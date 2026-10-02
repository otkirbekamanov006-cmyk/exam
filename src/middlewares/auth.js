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
