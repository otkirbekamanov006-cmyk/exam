const db = require('../../config/db');

/**
 * Bitta SQL so'rovi GROUP BY ROLLUP yordamida har bir kategoriya statistikasini
 * va umumiy jami natijani (category_id qiymati NULL bo'lgan qatorni) birga oladi.
 */
const getStats = async () => {
  const { rows } = await db.query(`
    SELECT
      c.id                                                   AS category_id,
      c.name                                                 AS category_name,
      COUNT(i.id)::int                                       AS total_items,
      COUNT(i.id) FILTER (WHERE i.type = 'lost')::int        AS lost,
      COUNT(i.id) FILTER (WHERE i.type = 'found')::int       AS found,
      COUNT(i.id) FILTER (WHERE i.status = 'active')::int    AS active,
      COUNT(i.id) FILTER (WHERE i.status = 'returned')::int  AS returned,
      COUNT(i.id) FILTER (WHERE i.status = 'closed')::int    AS closed
    FROM categories c
    LEFT JOIN items i ON i.category_id = c.id
    GROUP BY ROLLUP ((c.id, c.name))
    ORDER BY c.id NULLS FIRST
  `);

  const [totalRow, ...byCategory] = rows;
  return {
    total_items: totalRow.total_items,
    returned_items: totalRow.returned,
    active_items: totalRow.active,
    closed_items: totalRow.closed,
    lost_items: totalRow.lost,
    found_items: totalRow.found,
    by_category: byCategory,
  };
};

module.exports = { getStats };
