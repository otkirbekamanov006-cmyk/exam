// SQL fayllarini psql dasturisiz ishga tushirish uchun yordamchi skript.
// Ishlatish: node db/run.js schema yoki node db/run.js seed
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const target = process.argv[2];
if (!['schema', 'seed'].includes(target)) {
  console.error('Foydalanish: node db/run.js <schema|seed>');
  process.exit(1);
}

(async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, `${target}.sql`), 'utf8');
    await client.query(sql);
    console.log(`✅ ${target}.sql muvaffaqiyatli bajarildi`);
  } catch (err) {
    console.error(`❌ ${target}.sql xatosi:`, err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
