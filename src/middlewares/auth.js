<<<<<<< HEAD
const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');

// JWT tokenni tekshiradi va parolsiz foydalanuvchi ma'lumotlarini req.user ga joylaydi.
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw ApiError.unauthorized('Token yuborilmagan');

    let payload;
    try {
      payload = verifyToken(token);
    } catch (e) {
      throw ApiError.unauthorized(
        e.name === 'TokenExpiredError' ? 'Token muddati o\'tgan' : 'Token noto\'g\'ri'
      );
    }

    const { rows } = await db.query(
      'SELECT id, full_name, email, phone, role, is_verified, created_at FROM users WHERE id = $1',
      [payload.id]
    );
    const user = rows[0];
    if (!user) throw ApiError.unauthorized('Foydalanuvchi topilmadi');
    if (!user.is_verified) throw ApiError.forbidden('Akkaunt tasdiqlanmagan');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
=======
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

/**
 * auth(roles?) — JWT tekshiruvchi middleware
 * roles = [] bo'lsa, faqat login tekshiriladi
 * roles = ['admin'] bo'lsa, faqat admin o'ta oladi
 */
module.exports = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Token taqdim etilmagan'));
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role)) {
        return next(new ApiError(403, 'Ruxsat etilmagan: kerakli rol yo\'q'));
      }
      req.user = decoded;
      return next();
    } catch (err) {
      return next(new ApiError(401, 'Yaroqsiz yoki muddati o\'tgan token'));
    }
  };
};
>>>>>>> 76df369 (faylni ozgartrdim)
