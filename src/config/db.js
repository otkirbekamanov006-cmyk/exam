const { Pool } = require('pg');
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
