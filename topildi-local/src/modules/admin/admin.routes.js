const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const auth = require('../../middlewares/auth');

// GET /api/admin/stats — Admin only
router.get('/stats', auth(['admin']), async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*)                                          AS total_items,
        COUNT(*) FILTER (WHERE status = 'returned')      AS returned_items,
        COUNT(*) FILTER (WHERE status = 'active')        AS active_items,
        COUNT(*) FILTER (WHERE type = 'lost')            AS lost_items,
        COUNT(*) FILTER (WHERE type = 'found')           AS found_items,
        (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_users,
        (SELECT COUNT(*) FROM claims)                    AS total_claims,
        (SELECT COUNT(*) FROM claims WHERE status = 'approved') AS approved_claims
      FROM items
    `);

    const catStats = await db.query(`
      SELECT
        c.name AS category,
        COUNT(i.id) AS total,
        COUNT(i.id) FILTER (WHERE i.status = 'returned') AS returned
      FROM categories c
      LEFT JOIN items i ON i.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY total DESC
    `);

    res.json({
      success: true,
      data: {
        summary: result.rows[0],
        by_category: catStats.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
