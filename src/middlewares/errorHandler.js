<<<<<<< HEAD
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { deleteUploadedFiles } = require('../utils/deleteFiles');
const { nodeEnv } = require('../config/env');

const multerMessages = {
  LIMIT_FILE_SIZE: 'Har bir rasm hajmi 2 MB dan oshmasligi kerak',
  LIMIT_FILE_COUNT: 'Ko\'pi bilan 3 ta rasm yuklash mumkin',
  LIMIT_UNEXPECTED_FILE: 'Rasmlar "images" maydonida yuborilishi kerak (ko\'pi bilan 3 ta)',
};

// 404 — so'ralgan API yo'li mavjud emas
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route topilmadi: ${req.method} ${req.originalUrl}`));
};

// Barcha xatolarni yagona joyda qayta ishlash
// eslint-disable-next-line no-unused-vars
const errorHandler = async (err, req, res, next) => {
  // So'rov xato bilan tugasa, yuklangan fayllar diskda keraksiz qolmasin.
  await deleteUploadedFiles(req);

  let status = 500;
  let message = 'Serverda kutilmagan xatolik yuz berdi';
  let errors;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = multerMessages[err.code] || 'Fayl yuklashda xatolik';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'JSON formati noto\'g\'ri';
  } else if (err.code === '23505') {
    status = 409;
    message = 'Bunday ma\'lumot allaqachon mavjud';
  } else if (err.code === '23503') {
    status = 409;
    message = 'Bog\'langan ma\'lumot mavjud yoki topilmadi';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token noto\'g\'ri yoki muddati o\'tgan';
  }

  if (status === 500) console.error('❌', err);

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (status === 500 && nodeEnv === 'development') body.detail = err.message; // stack trace hech qachon yo'q
  res.status(status).json(body);
};

module.exports = { notFound, errorHandler };
=======
const deleteFiles = require('../utils/deleteFiles');

const errorHandler = (err, req, res, next) => {
  // Agar validatsiyadan o'tmay fayl yuklangan bo'lsa, fayllarni o'chiramiz
  if (req.files && req.files.length) deleteFiles(req.files);
  if (req.file) deleteFiles([req.file]);

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500
    ? 'Ichki server xatoligi yuz berdi'
    : err.message || 'Xatolik yuz berdi';

  // 500 xatolikni konsolga chiqaramiz
  if (statusCode === 500) {
    console.error('[SERVER ERROR]', err);
  }

  const response = { success: false, message };
  if (err.errors && err.errors.length > 0) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
>>>>>>> 76df369 (faylni ozgartrdim)
