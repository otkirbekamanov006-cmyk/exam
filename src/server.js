const fs = require('fs');
const { port } = require('./config/env');
const app = require('./app');
const { pool } = require('./config/db');
const { UPLOAD_DIR } = require('./utils/deleteFiles');

// Yuklangan fayllar saqlanadigan uploads/ papkasi mavjudligini ta'minlash
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const start = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL ga ulandi');
  } catch (err) {
    console.error('❌ PostgreSQL ga ulanib bo\'lmadi:', err.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`🚀 Server http://localhost:${port} da ishlayapti`);
    console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
  });
};

process.on('unhandledRejection', (err) => console.error('unhandledRejection:', err));

start();
