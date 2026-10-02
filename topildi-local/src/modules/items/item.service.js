const db = require('../../config/db');
const bcrypt = require('bcrypt');
const ApiError = require('../../utils/ApiError');
const deleteFiles = require('../../utils/deleteFiles');
const { sendMail, reportReceivedTemplate } = require('../../utils/sendMail');

const imageUrl = (filename) => `/uploads/${encodeURIComponent(filename)}`;

class ItemService {
  // POST /api/items
  static async createItem(userId, data, files) {
    if (!files || files.length === 0) {
      throw new ApiError(400, 'Kamida 1 ta rasm yuklash shart');
    }

    // Kategoriya mavjudligini tekshiramiz
    const catCheck = await db.query('SELECT id FROM categories WHERE id = $1', [data.category_id]);
    if (catCheck.rows.length === 0) {
      deleteFiles(files);
      throw new ApiError(400, 'Bunday kategoriya mavjud emas');
    }

    let hashedAnswer = null;
    if (data.type === 'found') {
      if (!data.secret_question || !data.secret_answer) {
        deleteFiles(files);
        throw new ApiError(400, 'Found e\'lon uchun maxfiy savol va javob majburiy');
      }
      const normalizedAnswer = data.secret_answer.trim().toLowerCase();
      hashedAnswer = await bcrypt.hash(normalizedAnswer, 10);
    }

    let newItem;
    try {
      newItem = await db.query(
        `INSERT INTO items (user_id, category_id, type, title, description, location, event_date, secret_question, secret_answer)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          userId,
          data.category_id,
          data.type,
          data.title,
          data.description,
          data.location,
          data.event_date,
          data.secret_question || null,
          hashedAnswer
        ]
      );
    } catch (err) {
      deleteFiles(files);
      throw err;
    }

    const item = newItem.rows[0];

    const imagePromises = files.map(file =>
      db.query('INSERT INTO item_images (item_id, filename) VALUES ($1, $2)', [item.id, file.filename])
    );
    await Promise.all(imagePromises);

    const { secret_answer: _sa, ...safeItem } = item;

    // Rasmlari bilan birga qaytaramiz
    const images = files.map(file => imageUrl(file.filename));
    return { ...safeItem, images };
  }

  // GET /api/items
  static async getItems({ type, category_id, search, page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    let conditions = [`i.status = 'active'`];
    const params = [];

    if (type) {
      params.push(type);
      conditions.push(`i.type = $${params.length}`);
    }
    if (category_id) {
      params.push(parseInt(category_id, 10));
      conditions.push(`i.category_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(i.title ILIKE $${params.length} OR i.location ILIKE $${params.length})`);
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    // Total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM items i ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Data query
    params.push(limitNum, offset);
    const dataResult = await db.query(
      `SELECT i.id, i.type, i.title, i.description, i.location, i.event_date, i.status, i.created_at,
              i.category_id, c.name AS category_name,
              u.full_name AS owner_name,
              COALESCE(
                json_agg(ii.filename ORDER BY ii.id) FILTER (WHERE ii.id IS NOT NULL),
                '[]'
              ) AS images
       FROM items i
       JOIN categories c ON i.category_id = c.id
       JOIN users u ON i.user_id = u.id
       LEFT JOIN item_images ii ON ii.item_id = i.id
       ${whereClause}
       GROUP BY i.id, c.name, u.full_name
       ORDER BY i.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const rows = dataResult.rows.map(row => ({
      ...row,
      images: row.images.map(imageUrl)
    }));

    return {
      data: rows,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  // GET /api/items/my
  static async getMyItems(userId) {
    const result = await db.query(
      `SELECT i.id, i.type, i.title, i.description, i.location, i.event_date, i.status, i.created_at,
              i.category_id, c.name AS category_name,
              COALESCE(
                json_agg(ii.filename ORDER BY ii.id) FILTER (WHERE ii.id IS NOT NULL),
                '[]'
              ) AS images
       FROM items i
       JOIN categories c ON i.category_id = c.id
       LEFT JOIN item_images ii ON ii.item_id = i.id
       WHERE i.user_id = $1
       GROUP BY i.id, c.name
       ORDER BY i.created_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      ...row,
      images: row.images.map(imageUrl)
    }));
  }

  // GET /api/items/:id
  static async getItemById(itemId) {
    const id = parseInt(itemId, 10);
    if (!id || id <= 0) throw new ApiError(400, 'ID musbat butun son bo\'lishi kerak');

    const result = await db.query(
      `SELECT i.id, i.user_id, i.type, i.title, i.description, i.location, i.event_date,
              i.secret_question, i.status, i.created_at, i.category_id,
              c.name AS category_name,
              u.full_name AS owner_name,
              COALESCE(
                json_agg(ii.filename ORDER BY ii.id) FILTER (WHERE ii.id IS NOT NULL),
                '[]'
              ) AS images
       FROM items i
       JOIN categories c ON c.id = i.category_id
       JOIN users u ON u.id = i.user_id
       LEFT JOIN item_images ii ON ii.item_id = i.id
       WHERE i.id = $1
       GROUP BY i.id, c.name, u.full_name`,
      [id]
    );

    if (result.rows.length === 0) throw new ApiError(404, 'E\'lon topilmadi');

    const item = result.rows[0];
    return {
      ...item,
      images: item.images.map(imageUrl)
    };
  }

  // PATCH /api/items/:id — Egasi
  static async updateItem(itemId, userId, userRole, data) {
    const id = parseInt(itemId, 10);
    if (!id || id <= 0) throw new ApiError(400, 'ID musbat butun son bo\'lishi kerak');

    const itemRes = await db.query('SELECT * FROM items WHERE id = $1', [id]);
    if (itemRes.rows.length === 0) throw new ApiError(404, 'E\'lon topilmadi');

    const item = itemRes.rows[0];

    if (item.user_id !== userId) throw new ApiError(403, 'Bu e\'lonni o\'zgartirishga ruxsat yo\'q');
    if (item.status === 'returned') throw new ApiError(400, 'Qaytarilgan e\'lonni tahrirlab bo\'lmaydi');

    // status='closed' dan boshqa narsani PATCH orqali o'zgartirib bo'lmaydi agar 'returned' bo'lsa
    const { title, description, location, category_id, status } = data;

    if (category_id) {
      const catCheck = await db.query('SELECT id FROM categories WHERE id = $1', [category_id]);
      if (catCheck.rows.length === 0) throw new ApiError(400, 'Bunday kategoriya mavjud emas');
    }

    const fields = [];
    const values = [];

    if (title) { values.push(title); fields.push(`title = $${values.length}`); }
    if (description) { values.push(description); fields.push(`description = $${values.length}`); }
    if (location) { values.push(location); fields.push(`location = $${values.length}`); }
    if (category_id) { values.push(category_id); fields.push(`category_id = $${values.length}`); }
    if (status === 'closed') { values.push('closed'); fields.push(`status = $${values.length}`); }

    if (fields.length === 0) throw new ApiError(400, 'O\'zgartiradigan maydon yo\'q');

    values.push(id);
    const result = await db.query(
      `UPDATE items SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    const { secret_answer: _sa, ...safeItem } = result.rows[0];
    return safeItem;
  }

  // DELETE /api/items/:id — Egasi yoki Admin
  static async deleteItem(itemId, userId, userRole) {
    const id = parseInt(itemId, 10);
    if (!id || id <= 0) throw new ApiError(400, 'ID musbat butun son bo\'lishi kerak');

    const itemRes = await db.query('SELECT * FROM items WHERE id = $1', [id]);
    if (itemRes.rows.length === 0) throw new ApiError(404, 'E\'lon topilmadi');

    const item = itemRes.rows[0];

    if (userRole !== 'admin' && item.user_id !== userId) {
      throw new ApiError(403, 'Bu e\'lonni o\'chirishga ruxsat yo\'q');
    }

    // Rasmlarni olish
    const imagesRes = await db.query('SELECT filename FROM item_images WHERE item_id = $1', [id]);
    await db.query('DELETE FROM items WHERE id = $1', [id]);

    // Diskdan o'chirish
    if (imagesRes.rows.length > 0) {
      deleteFiles(imagesRes.rows);
    }
  }

  // POST /api/items/:id/report — faqat 'lost' e'lonlar
  static async reportItem(itemId, reporterId, message) {
    const id = parseInt(itemId, 10);
    if (!id || id <= 0) throw new ApiError(400, 'ID musbat butun son bo\'lishi kerak');

    const itemRes = await db.query(
      `SELECT i.*, u.full_name AS owner_name, u.email AS owner_email
       FROM items i JOIN users u ON u.id = i.user_id
       WHERE i.id = $1`,
      [id]
    );
    if (itemRes.rows.length === 0) throw new ApiError(404, 'E\'lon topilmadi');

    const item = itemRes.rows[0];
    if (item.type !== 'lost') throw new ApiError(400, 'Bu endpoint faqat lost e\'lonlar uchun');
    if (item.status !== 'active') throw new ApiError(400, 'E\'lon aktiv emas');
    if (item.user_id === reporterId) throw new ApiError(403, 'O\'z e\'lonizga report yubora olmaysiz');

    const reporterRes = await db.query(
      'SELECT full_name, phone FROM users WHERE id = $1',
      [reporterId]
    );
    const reporter = reporterRes.rows[0];

    sendMail(
      item.owner_email,
      `"${item.title}" buyumingizni topishdi!`,
      reportReceivedTemplate(item.owner_name, item.title, reporter.full_name, reporter.phone, message)
    );

    return { message: 'Xabar egasiga yuborildi' };
  }
}

module.exports = ItemService;