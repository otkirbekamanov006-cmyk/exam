const { Pool } = require('pg');
<<<<<<< HEAD
const { db } = require('./env');

const pool = new Pool(db);

pool.on('error', (err) => {
  console.error('PostgreSQL pool xatosi:', err.message);
});

module.exports = {
  pool,
  // Oddiy SQL so'rovlarini qisqaroq yozish uchun yordamchi usul
  query: (text, params) => pool.query(text, params),
  // Tranzaksiya bajarish uchun alohida ulanish olish
  getClient: () => pool.connect(),
};
=======
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
};
>>>>>>> 76df369 (faylni ozgartrdim)
