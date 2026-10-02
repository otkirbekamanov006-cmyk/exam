<<<<<<< HEAD
const fs = require('fs/promises');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// Fayllarni diskdan o'chiradi; xato yuz bersa server to'xtamaydi, xabar jurnalga yoziladi.
const deleteFiles = async (filenames = []) => {
  await Promise.all(
    filenames.filter(Boolean).map(async (name) => {
      try {
        await fs.unlink(path.join(UPLOAD_DIR, path.basename(name)));
      } catch (err) {
        if (err.code !== 'ENOENT') console.error('Faylni o\'chirishda xato:', name, err.message);
      }
    })
  );
};

// Multer yuklagan fayllarni req.files ro'yxatidan olib, diskdan o'chirish.
const deleteUploadedFiles = (req) => {
  const files = req.files || (req.file ? [req.file] : []);
  return deleteFiles(files.map((f) => f.filename));
};

module.exports = { deleteFiles, deleteUploadedFiles, UPLOAD_DIR };
=======
const fs = require('fs');
const path = require('path');

const deleteFiles = (files) => {
  if (!files || !files.length) return;
  files.forEach((file) => {
    const filePath = path.join(__dirname, '../../uploads', file.filename || file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

module.exports = deleteFiles;
>>>>>>> 76df369 (faylni ozgartrdim)
