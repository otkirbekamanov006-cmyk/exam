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
