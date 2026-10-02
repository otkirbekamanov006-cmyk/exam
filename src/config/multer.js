const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const { UPLOAD_DIR } = require('../utils/deleteFiles');

const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_FILES = 3;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  // Fayl nomi takrorlanmasligi uchun vaqt belgisi, tasodifiy son va kengaytmadan tuziladi.
  filename: (req, file, cb) => {
    const ext = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomInt(10000, 99999)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) return cb(null, true);
  cb(ApiError.badRequest('Faqat rasm yuklash mumkin (jpeg, png, webp)'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
});

// E'lon uchun "images" maydonida 1 dan 3 tagacha rasm qabul qilinadi.
const uploadItemImages = upload.array('images', MAX_FILES);

// So'rov bilan kamida bitta rasm yuborilganini tekshiradi.
const requireImages = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(
      ApiError.badRequest('Validatsiya xatosi', [{ field: 'images', message: 'Kamida 1 ta rasm yuklash kerak' }])
    );
  }
  next();
};

module.exports = { uploadItemImages, requireImages, MAX_FILES, MAX_FILE_SIZE };
