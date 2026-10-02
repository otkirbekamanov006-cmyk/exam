const bcrypt = require('bcrypt');
const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const sendMail = require('../../utils/sendMail');
const templates = require('../../utils/emailTemplates');
const { deleteFiles } = require('../../utils/deleteFiles');
const { appUrl } = require('../../config/env');

// Maxfiy javob bo'lgan secret_answer qiymati hech qachon so'rov natijasiga qo'shilmaydi.
const ITEM_COLUMNS = `
  i.id, i.type, i.title, i.description, i.location,
  to_char(i.event_date, 'YYYY-MM-DD') AS event_date,
  i.secret_question, i.status, i.category_id, c.name AS category_name,
  i.user_id, u.full_name AS owner_name, i.created_at, i.updated_at,
  COALESCE(
    (SELECT json_agg(img.filename ORDER BY img.id) FROM item_images img WHERE img.item_id = i.id),
    '[]'::json
  ) AS images`;

const FROM = `FROM items i
  JOIN categories c ON c.id = i.category_id
  JOIN users u ON u.id = i.user_id`;

// Fayl nomlarini brauzerda ochiladigan to'liq manzilga aylantiradi.
const withImageUrls = (item) =>
  item && { ...item, images: item.images.map((f) => ({ filename: f, url: `${appUrl}/uploads/${f}` })) };

// Javobni solishtirishdan oldin ortiqcha bo'shliqlar olib tashlanadi va harflar bir xil ko'rinishga keltiriladi.
const normalizeAnswer = (answer) => String(answer).trim().toLowerCase();

const getById = async (id) => {
  const { rows } = await db.query(`SELECT ${ITEM_COLUMNS} ${FROM} WHERE i.id = $1`, [id]);
  if (!rows[0]) throw ApiError.notFound('E\'lon topilmadi');
  return withImageUrls(rows[0]);
};

// E'lon egasini, turini va holatini ichki tekshirish uchun ishlatiladi.
const getRaw = async (id) => {
  const { rows } = await db.query('SELECT * FROM items WHERE id = $1', [id]);
  if (!rows[0]) throw ApiError.notFound('E\'lon topilmadi');
  return rows[0];
};

const list = async ({ type, category_id, search, page, limit }) => {
  const where = ['i.status = \'active\''];
  const params = [];

  if (type) {
    params.push(type);
    where.push(`i.type = $${params.length}`);
  }
  if (category_id) {
    params.push(category_id);
    where.push(`i.category_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(i.title ILIKE $${params.length} OR i.location ILIKE $${params.length})`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const { rows: countRows } = await db.query(`SELECT COUNT(*)::int AS total FROM items i ${whereSql}`, params);
  const total = countRows[0].total;

  const offset = (page - 1) * limit;
  const { rows } = await db.query(
    `SELECT ${ITEM_COLUMNS} ${FROM} ${whereSql}
      ORDER BY i.created_at DESC, i.id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    data: rows.map(withImageUrls),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const listMine = async (userId) => {
  const { rows } = await db.query(
    `SELECT ${ITEM_COLUMNS} ${FROM} WHERE i.user_id = $1 ORDER BY i.created_at DESC, i.id DESC`,
    [userId]
  );
  return rows.map(withImageUrls);
};

const create = async (userId, body, files) => {
  const secretHash = body.type === 'found' ? await bcrypt.hash(normalizeAnswer(body.secret_answer), 10) : null;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO items (user_id, category_id, type, title, description, location, event_date, secret_question, secret_answer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        userId,
        body.category_id,
        body.type,
        body.title,
        body.description,
        body.location,
        body.event_date,
        body.type === 'found' ? body.secret_question : null,
        secretHash,
      ]
    );
    const itemId = rows[0].id;
    for (const file of files) {
      await client.query('INSERT INTO item_images (item_id, filename) VALUES ($1, $2)', [itemId, file.filename]);
    }
    await client.query('COMMIT');
    return getById(itemId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err; // fayllar errorHandler'da diskdan o'chiriladi
  } finally {
    client.release();
  }
};

const update = async (id, user, body) => {
  const item = await getRaw(id);
  // E'lonni faqat egasi tahrirlay oladi; administrator ham boshqa foydalanuvchi e'lonini tahrirlay olmaydi.
  if (item.user_id !== user.id) throw ApiError.forbidden('Siz faqat o\'z e\'loningizni tahrirlay olasiz');
  if (item.status === 'returned') throw ApiError.badRequest('Qaytarilgan (returned) e\'lonni tahrirlab bo\'lmaydi');

  const allowed = ['title', 'description', 'location', 'category_id', 'status'];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      params.push(body[key]);
      sets.push(`${key} = $${params.length}`);
    }
  }
  params.push(id);
  await db.query(`UPDATE items SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params);
  return getById(id);
};

const remove = async (id, user) => {
  const item = await getRaw(id);
  if (item.user_id !== user.id && user.role !== 'admin') {
    throw ApiError.forbidden('Siz faqat o\'z e\'loningizni o\'chira olasiz');
  }
  const { rows: images } = await db.query('SELECT filename FROM item_images WHERE item_id = $1', [id]);
  await db.query('DELETE FROM items WHERE id = $1', [id]); // item_images va claims CASCADE bilan o'chadi
  await deleteFiles(images.map((r) => r.filename));
};

// "Men topdim" xabari faqat yo'qolgan buyum e'lonlari uchun yuboriladi.
const report = async (id, finder, { message }) => {
  const item = await getRaw(id);
  if (item.type !== 'lost') throw ApiError.badRequest('"Men topdim" faqat \'lost\' turidagi e\'lonlar uchun');
  if (item.status !== 'active') throw ApiError.badRequest('Bu e\'lon faol emas');
  if (item.user_id === finder.id) throw ApiError.forbidden('O\'z e\'loningizga xabar yubora olmaysiz');

  const { rows } = await db.query('SELECT full_name, email FROM users WHERE id = $1', [item.user_id]);
  const owner = rows[0];
  const { subject, html } = templates.itemReported({
    ownerName: owner.full_name,
    itemTitle: item.title,
    finderName: finder.full_name,
    finderPhone: finder.phone,
    message,
  });
  sendMail(owner.email, subject, html);
};

module.exports = { list, listMine, getById, getRaw, create, update, remove, report, normalizeAnswer };
