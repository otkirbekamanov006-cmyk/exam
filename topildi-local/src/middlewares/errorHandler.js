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