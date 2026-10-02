const ApiError = require('../utils/ApiError');

// Faqat ko'rsatilgan rollarga ruxsat beradi; authenticate middleware'idan keyin ishlaydi.
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(ApiError.forbidden('Bu amal faqat admin uchun'));
  }
  next();
};

module.exports = { authorize };
