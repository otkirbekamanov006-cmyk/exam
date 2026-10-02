const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');

const getAll = async () => {
  const { rows } = await db.query('SELECT id, name, created_at FROM categories ORDER BY id');
  return rows;
};

// Kategoriya nomi katta-kichik harflardan qat'i nazar avval ishlatilganini tekshiradi.
const ensureNameFree = async (name, exceptId = null) => {
  const { rows } = await db.query(
    'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND ($2::int IS NULL OR id <> $2)',
    [name, exceptId]
  );
  if (rows[0]) throw ApiError.conflict('Bunday nomli kategoriya allaqachon mavjud');
};

const create = async ({ name }) => {
  await ensureNameFree(name);
  const { rows } = await db.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
  return rows[0];
};

const update = async (id, { name }) => {
  await ensureNameFree(name, id);
  const { rows } = await db.query('UPDATE categories SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
  if (!rows[0]) throw ApiError.notFound('Kategoriya topilmadi');
  return rows[0];
};

const remove = async (id) => {
  const { rows: found } = await db.query('SELECT id FROM categories WHERE id = $1', [id]);
  if (!found[0]) throw ApiError.notFound('Kategoriya topilmadi');

  const { rows } = await db.query('SELECT COUNT(*)::int AS count FROM items WHERE category_id = $1', [id]);
  if (rows[0].count > 0) {
    throw ApiError.conflict(`Bu kategoriyaga ${rows[0].count} ta e'lon bog'langan, o'chirib bo'lmaydi`);
  }
  await db.query('DELETE FROM categories WHERE id = $1', [id]);
};

module.exports = { getAll, create, update, remove };
