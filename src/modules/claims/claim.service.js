const db = require('../../config/db');
const bcrypt = require('bcrypt');
const ApiError = require('../../utils/ApiError');
const { sendMail, claimReceivedTemplate, claimApprovedTemplate, claimRejectedTemplate } = require('../../utils/sendMail');

class ClaimService {

  // GET /api/claims/my
  static async getMyClaims(userId) {
    const result = await db.query(
      `SELECT c.id, c.item_id, c.message, c.status, c.created_at,
              i.title AS item_title, i.type AS item_type
       FROM claims c
       JOIN items i ON i.id = c.item_id
       WHERE c.claimant_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // GET /api/items/:id/claims — E'lon egasi
  static async getItemClaims(itemId, requesterId) {
    const id = parseInt(itemId, 10);
    if (!id || id <= 0) throw new ApiError(400, 'ID musbat butun son bo\'lishi kerak');

    const itemRes = await db.query('SELECT user_id FROM items WHERE id = $1', [id]);
    if (itemRes.rows.length === 0) throw new ApiError(404, 'E\'lon topilmadi');
    if (itemRes.rows[0].user_id !== requesterId) throw new ApiError(403, 'Ruxsat berilmagan');

    const result = await db.query(
      `SELECT c.id, c.item_id, c.message, c.status, c.created_at,
              u.full_name AS claimant_name, u.id AS claimant_id
       FROM claims c
       JOIN users u ON u.id = c.claimant_id
       WHERE c.item_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );
    return result.rows;
  }

  // POST /api/items/:id/claims
  static async createClaim(itemId, userId, answer, message) {
    const id = parseInt(itemId, 10);
    if (!id || id <= 0) throw new ApiError(400, 'ID musbat butun son bo\'lishi kerak');

    const itemRes = await db.query(
      `SELECT i.*, u.email AS owner_email, u.full_name AS owner_name
       FROM items i JOIN users u ON u.id = i.user_id
       WHERE i.id = $1`,
      [id]
    );
    if (itemRes.rows.length === 0) throw new ApiError(404, 'E\'lon topilmadi');

    const item = itemRes.rows[0];

    // 5.1 qoidalar
    if (item.type !== 'found') throw new ApiError(400, 'Da\'vo faqat found e\'lonlarga yuboriladi');
    if (item.status !== 'active') throw new ApiError(400, 'E\'lon aktiv emas');
    if (item.user_id === userId) throw new ApiError(403, 'O\'z e\'lonizga da\'vo qila olmaysiz');

    // 3 marta xato urinish tekshiruvi
    const attemptsRes = await db.query(
      `SELECT COUNT(*) FROM claims WHERE item_id = $1 AND claimant_id = $2 AND status = 'rejected'`,
      [id, userId]
    );
    if (parseInt(attemptsRes.rows[0].count, 10) >= 3) {
      throw new ApiError(429, 'Urinishlar soni tugadi');
    }

    // Pending da'vo tekshiruvi
    const pendingRes = await db.query(
      `SELECT id FROM claims WHERE item_id = $1 AND claimant_id = $2 AND status = 'pending'`,
      [id, userId]
    );
    if (pendingRes.rows.length > 0) {
      throw new ApiError(409, 'Siz allaqachon ushbu e\'longa da\'vo yuborgansiz');
    }

    // Javobni normallashtirish va solishtirish
    const normalizedAnswer = answer.trim().toLowerCase();
    const isCorrect = await bcrypt.compare(normalizedAnswer, item.secret_answer);

    if (!isCorrect) {
      // Rad etilgan da'voni saqlaymiz
      await db.query(
        `INSERT INTO claims (item_id, claimant_id, message, status) VALUES ($1, $2, $3, 'rejected')`,
        [id, userId, message || null]
      );
      throw new ApiError(400, 'Maxfiy javob noto\'g\'ri');
    }

    // To'g'ri javob — pending da'vo
    const newClaim = await db.query(
      `INSERT INTO claims (item_id, claimant_id, message, status) VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [id, userId, message || null]
    );

    // E'lon egasiga email
    const claimantRes = await db.query('SELECT full_name FROM users WHERE id = $1', [userId]);
    sendMail(
      item.owner_email,
      `"${item.title}" e'loningizga da'vo keldi`,
      claimReceivedTemplate(item.owner_name, item.title, claimantRes.rows[0].full_name, message)
    );

    return newClaim.rows[0];
  }

  // PATCH /api/claims/:id/approve — E'lon egasi
  static async approveClaim(claimId, ownerId) {
    const id = parseInt(claimId, 10);
    if (!id || id <= 0) throw new ApiError(400, 'ID musbat butun son bo\'lishi kerak');

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const claimRes = await client.query('SELECT * FROM claims WHERE id = $1', [id]);
      if (claimRes.rows.length === 0) throw new ApiError(404, 'Da\'vo topilmadi');
      const claim = claimRes.rows[0];

      if (claim.status !== 'pending') {
        throw new ApiError(400, 'Faqat kutilayotgan (pending) da\'voni tasdiqlash mumkin');
      }

      const itemRes = await client.query('SELECT * FROM items WHERE id = $1', [claim.item_id]);
      if (itemRes.rows.length === 0) throw new ApiError(404, 'E\'lon topilmadi');
      const item = itemRes.rows[0];

      if (item.user_id !== ownerId) throw new ApiError(403, 'Ruxsat berilmagan');

      // Tranzaksiya: approve + returned + boshqa pending → rejected
      await client.query(`UPDATE claims SET status = 'approved' WHERE id = $1`, [id]);
      await client.query(`UPDATE items SET status = 'returned' WHERE id = $1`, [item.id]);
      await client.query(
        `UPDATE claims SET status = 'rejected' WHERE item_id = $1 AND id != $2 AND status = 'pending'`,
        [item.id, id]
      );

      await client.query('COMMIT');

      // Email (tranzaksiyadan tashqarida)
      const owner = (await db.query('SELECT full_name, phone, email FROM users WHERE id = $1', [ownerId])).rows[0];
      const claimant = (await db.query('SELECT full_name, phone, email FROM users WHERE id = $1', [claim.claimant_id])).rows[0];

      sendMail(owner.email, 'Da\'vo tasdiqlandi', claimApprovedTemplate(owner.full_name, claimant.full_name, claimant.phone, true));
      sendMail(claimant.email, 'Da\'vongiz tasdiqlandi!', claimApprovedTemplate(claimant.full_name, owner.full_name, owner.phone, false));

      return { message: 'Da\'vo muvaffaqiyatli tasdiqlandi' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // PATCH /api/claims/:id/reject — E'lon egasi
  static async rejectClaim(claimId, ownerId) {
    const id = parseInt(claimId, 10);
    if (!id || id <= 0) throw new ApiError(400, 'ID musbat butun son bo\'lishi kerak');

    // Da'voni topamiz
    const claimRes = await db.query('SELECT * FROM claims WHERE id = $1', [id]);
    if (claimRes.rows.length === 0) throw new ApiError(404, 'Da\'vo topilmadi');
    const claim = claimRes.rows[0];

    // E'lon egasini tekshiramiz
    const itemRes = await db.query('SELECT user_id, title FROM items WHERE id = $1', [claim.item_id]);
    if (itemRes.rows.length === 0) throw new ApiError(404, 'E\'lon topilmadi');
    if (itemRes.rows[0].user_id !== ownerId) throw new ApiError(403, 'Ruxsat berilmagan');

    if (claim.status !== 'pending') {
      throw new ApiError(400, 'Faqat kutilayotgan (pending) da\'voni rad etish mumkin');
    }

    await db.query(`UPDATE claims SET status = 'rejected' WHERE id = $1`, [id]);

    // Da'vogarga email
    const claimant = (await db.query('SELECT full_name, email FROM users WHERE id = $1', [claim.claimant_id])).rows[0];
    sendMail(
      claimant.email,
      `Da'vongiz rad etildi`,
      claimRejectedTemplate(claimant.full_name, itemRes.rows[0].title)
    );

    return { message: 'Da\'vo rad etildi' };
  }
}

module.exports = ClaimService;