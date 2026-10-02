const bcrypt = require('bcrypt');
const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const sendMail = require('../../utils/sendMail');
const templates = require('../../utils/emailTemplates');
const { getRaw: getItem, normalizeAnswer } = require('../items/items.service');

const MAX_WRONG_ATTEMPTS = 3;

const getUser = async (id) => {
  const { rows } = await db.query('SELECT id, full_name, email, phone FROM users WHERE id = $1', [id]);
  return rows[0];
};

// 5.1 — E'lon bo'yicha da'vo yuborish
const create = async (itemId, claimant, { answer, message }) => {
  const item = await getItem(itemId); // yo'q bo'lsa — 404
  if (item.type !== 'found') throw ApiError.badRequest('Da\'vo faqat \'found\' turidagi e\'longa yuboriladi');
  if (item.status !== 'active') throw ApiError.badRequest('Bu e\'lon faol emas, unga da\'vo yuborib bo\'lmaydi');
  if (item.user_id === claimant.id) throw ApiError.forbidden('O\'z e\'loningizga da\'vo qila olmaysiz');

  const { rows: stats } = await db.query(
    `SELECT
        COUNT(*) FILTER (WHERE status = 'pending')::int        AS pending,
        COUNT(*) FILTER (WHERE answer_correct = false)::int     AS wrong
       FROM claims WHERE item_id = $1 AND claimant_id = $2`,
    [itemId, claimant.id]
  );
  if (stats[0].pending > 0) throw ApiError.conflict('Bu e\'longa sizning ko\'rib chiqilayotgan da\'voyingiz allaqachon bor');
  if (stats[0].wrong >= MAX_WRONG_ATTEMPTS) throw ApiError.tooMany('Urinishlar soni tugadi');

  // Javob e'lon yaratilgandagi usulda me'yorlashtiriladi va bcrypt yordamida saqlangan javob bilan solishtiriladi.
  const isCorrect = await bcrypt.compare(normalizeAnswer(answer), item.secret_answer);

  if (!isCorrect) {
    await db.query(
      `INSERT INTO claims (item_id, claimant_id, message, status, answer_correct)
       VALUES ($1, $2, $3, 'rejected', false)`,
      [itemId, claimant.id, message || null]
    );
    const left = MAX_WRONG_ATTEMPTS - (stats[0].wrong + 1);
    throw ApiError.badRequest(
      left > 0 ? `Javob noto'g'ri. Yana ${left} ta urinishingiz qoldi` : 'Javob noto\'g\'ri. Urinishlar soni tugadi'
    );
  }

  const { rows } = await db.query(
    `INSERT INTO claims (item_id, claimant_id, message, status, answer_correct)
     VALUES ($1, $2, $3, 'pending', true)
     RETURNING id, item_id, claimant_id, message, status, created_at`,
    [itemId, claimant.id, message || null]
  );

  // E'lon egasiga elektron xat yuborish
  const owner = await getUser(item.user_id);
  const { subject, html } = templates.claimReceived({
    ownerName: owner.full_name,
    itemTitle: item.title,
    claimantName: claimant.full_name,
    message,
  });
  sendMail(owner.email, subject, html);

  return rows[0];
};

// E'longa yuborilgan barcha da'volarni faqat e'lon egasi ko'ra oladi.
const listForItem = async (itemId, user) => {
  const item = await getItem(itemId);
  if (item.user_id !== user.id) throw ApiError.forbidden('Faqat e\'lon egasi da\'volarni ko\'ra oladi');

  const { rows } = await db.query(
    `SELECT cl.id, cl.status, cl.message, cl.created_at, cl.updated_at,
            cl.claimant_id, u.full_name AS claimant_name
       FROM claims cl JOIN users u ON u.id = cl.claimant_id
      WHERE cl.item_id = $1
      ORDER BY cl.created_at DESC`,
    [itemId]
  );
  return rows;
};

// Joriy foydalanuvchi yuborgan da'volar
const listMine = async (userId) => {
  const { rows } = await db.query(
    `SELECT cl.id, cl.status, cl.message, cl.created_at, cl.updated_at,
            cl.item_id, i.title AS item_title, i.status AS item_status
       FROM claims cl JOIN items i ON i.id = cl.item_id
      WHERE cl.claimant_id = $1
      ORDER BY cl.created_at DESC`,
    [userId]
  );
  return rows;
};

// Da'vo va unga tegishli e'lon ma'lumotlarini egalikni tekshirish uchun olish.
const getClaimWithItem = async (client, claimId, lock = false) => {
  const { rows } = await client.query(
    `SELECT cl.*, i.user_id AS owner_id, i.title AS item_title, i.status AS item_status
       FROM claims cl JOIN items i ON i.id = cl.item_id
      WHERE cl.id = $1 ${lock ? 'FOR UPDATE OF cl, i' : ''}`,
    [claimId]
  );
  if (!rows[0]) throw ApiError.notFound('Da\'vo topilmadi');
  return rows[0];
};

// 5.2 — Da'voni bitta tranzaksiya ichida tasdiqlash
const approve = async (claimId, user) => {
  const client = await db.getClient();
  let claim;
  let autoRejected = [];
  try {
    await client.query('BEGIN');
    claim = await getClaimWithItem(client, claimId, true); // qatorlar qulflanadi (parallel approve'dan himoya)

    if (claim.owner_id !== user.id) throw ApiError.forbidden('Faqat e\'lon egasi da\'voni tasdiqlay oladi');
    if (claim.status !== 'pending') throw ApiError.badRequest('Faqat \'pending\' holatidagi da\'voni tasdiqlash mumkin');
    if (claim.item_status !== 'active') throw ApiError.badRequest('E\'lon faol emas');

    await client.query('UPDATE claims SET status = \'approved\', updated_at = NOW() WHERE id = $1', [claimId]);
    await client.query('UPDATE items SET status = \'returned\', updated_at = NOW() WHERE id = $1', [claim.item_id]);
    const { rows } = await client.query(
      `UPDATE claims SET status = 'rejected', updated_at = NOW()
        WHERE item_id = $1 AND status = 'pending' AND id <> $2
        RETURNING claimant_id`,
      [claim.item_id, claimId]
    );
    autoRejected = rows;

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Elektron xatlar tranzaksiya muvaffaqiyatli tugagandan keyin yuboriladi.
  const [finder, claimant] = await Promise.all([getUser(claim.owner_id), getUser(claim.claimant_id)]);
  const toFinder = templates.claimApproved({
    name: finder.full_name,
    itemTitle: claim.item_title,
    otherRole: 'Buyum egasi',
    otherName: claimant.full_name,
    otherPhone: claimant.phone,
  });
  const toClaimant = templates.claimApproved({
    name: claimant.full_name,
    itemTitle: claim.item_title,
    otherRole: 'Topgan inson',
    otherName: finder.full_name,
    otherPhone: finder.phone,
  });
  sendMail(finder.email, toFinder.subject, toFinder.html);
  sendMail(claimant.email, toClaimant.subject, toClaimant.html);

  // Avtomatik rad etilgan boshqa da'vogarlarga ham xabar yuborish.
  for (const { claimant_id } of autoRejected) {
    const u = await getUser(claimant_id);
    const tpl = templates.claimRejected({ name: u.full_name, itemTitle: claim.item_title });
    sendMail(u.email, tpl.subject, tpl.html);
  }

  return {
    claim_id: claim.id,
    item_id: claim.item_id,
    status: 'approved',
    item_status: 'returned',
    rejected_others: autoRejected.length,
  };
};

const reject = async (claimId, user) => {
  const claim = await getClaimWithItem(db, claimId);
  if (claim.owner_id !== user.id) throw ApiError.forbidden('Faqat e\'lon egasi da\'voni rad eta oladi');
  if (claim.status !== 'pending') throw ApiError.badRequest('Faqat \'pending\' holatidagi da\'voni rad etish mumkin');

  await db.query('UPDATE claims SET status = \'rejected\', updated_at = NOW() WHERE id = $1', [claimId]);

  const claimant = await getUser(claim.claimant_id);
  const { subject, html } = templates.claimRejected({ name: claimant.full_name, itemTitle: claim.item_title });
  sendMail(claimant.email, subject, html);

  return { claim_id: claim.id, item_id: claim.item_id, status: 'rejected' };
};

module.exports = { create, listForItem, listMine, approve, reject };
