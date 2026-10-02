<<<<<<< HEAD
const bcrypt = require('bcrypt');
const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const sendMail = require('../../utils/sendMail');
const templates = require('../../utils/emailTemplates');
const { signToken } = require('../../utils/jwt');
const { generateOtp, OTP_TTL_MINUTES, RESEND_COOLDOWN_SECONDS } = require('../../utils/otp');

const SALT_ROUNDS = 10;
const PUBLIC_USER = 'id, full_name, email, phone, role, is_verified, created_at';

const findByEmail = async (email) => {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
};

// Avvalgi kodlarni bekor qiladi, yangi kod yaratadi va uni elektron pochta orqali yuboradi.
const issueOtp = async (user, purpose) => {
  await db.query(
    'UPDATE otp_codes SET is_used = true WHERE user_id = $1 AND purpose = $2 AND is_used = false',
    [user.id, purpose]
  );
  const code = generateOtp();
  await db.query(
    `INSERT INTO otp_codes (user_id, code, purpose, expires_at)
     VALUES ($1, $2, $3, NOW() + make_interval(mins => $4))`,
    [user.id, code, purpose, OTP_TTL_MINUTES]
  );
  const tpl = purpose === 'verify' ? templates.verifyCode : templates.resetCode;
  const { subject, html } = tpl({ name: user.full_name, code });
  sendMail(user.email, subject, html); // await qilinmaydi — javob tez qaytadi, xato logga yoziladi
};

// Oxirgi kod yuborilganiga 60 soniya to'lmagan bo'lsa, 429 xatosini qaytaradi.
const ensureCooldown = async (userId, purpose) => {
  const { rows } = await db.query(
    `SELECT EXTRACT(EPOCH FROM (NOW() - created_at))::int AS seconds
       FROM otp_codes WHERE user_id = $1 AND purpose = $2
      ORDER BY created_at DESC LIMIT 1`,
    [userId, purpose]
  );
  if (rows[0] && rows[0].seconds < RESEND_COOLDOWN_SECONDS) {
    const wait = RESEND_COOLDOWN_SECONDS - rows[0].seconds;
    throw ApiError.tooMany(`Yangi kodni ${wait} soniyadan keyin so'rashingiz mumkin`);
  }
};

// Kod to'g'ri, hali ishlatilmagan va amal qilish muddati tugamagan bo'lsa, ishlatilgan deb belgilaydi.
const consumeOtp = async (client, userId, code, purpose) => {
  const { rows } = await client.query(
    `UPDATE otp_codes SET is_used = true
      WHERE id = (
        SELECT id FROM otp_codes
         WHERE user_id = $1 AND code = $2 AND purpose = $3
           AND is_used = false AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1
      )
      RETURNING id`,
    [userId, code, purpose]
  );
  if (!rows[0]) throw ApiError.badRequest('Kod noto\'g\'ri yoki muddati o\'tgan');
};

const register = async ({ full_name, email, phone, password }) => {
  if (await findByEmail(email)) throw ApiError.conflict('Bu email allaqachon ro\'yxatdan o\'tgan');

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await db.query(
    `INSERT INTO users (full_name, email, phone, password)
     VALUES ($1, $2, $3, $4) RETURNING ${PUBLIC_USER}`,
    [full_name, email, phone, hash]
  );
  await issueOtp(rows[0], 'verify');
  return rows[0];
};

const verify = async ({ email, code }) => {
  const user = await findByEmail(email);
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');
  if (user.is_verified) throw ApiError.badRequest('Akkaunt allaqachon tasdiqlangan');

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await consumeOtp(client, user.id, code, 'verify');
    await client.query('UPDATE users SET is_verified = true WHERE id = $1', [user.id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const resendCode = async ({ email }) => {
  const user = await findByEmail(email);
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');
  if (user.is_verified) throw ApiError.badRequest('Akkaunt allaqachon tasdiqlangan');
  await ensureCooldown(user.id, 'verify');
  await issueOtp(user, 'verify');
};

const login = async ({ email, password }) => {
  const user = await findByEmail(email);
  // Xavfsizlik uchun email manzili yoki parolning qaysi biri xato ekanini alohida bildirmaymiz.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw ApiError.unauthorized('Email yoki parol noto\'g\'ri');
  }
  if (!user.is_verified) throw ApiError.forbidden('Akkaunt tasdiqlanmagan. Emailingizga kelgan kodni kiriting');

  const { password: _omit, ...safeUser } = user;
  return { token: signToken(user), user: safeUser };
};

const forgotPassword = async ({ email }) => {
  const user = await findByEmail(email);
  if (!user) throw ApiError.notFound('Bu email bilan foydalanuvchi topilmadi');
  await ensureCooldown(user.id, 'reset');
  await issueOtp(user, 'reset');
};

const resetPassword = async ({ email, code, newPassword }) => {
  const user = await findByEmail(email);
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await consumeOtp(client, user.id, code, 'reset');
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await client.query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { register, verify, resendCode, login, forgotPassword, resetPassword };
=======
const db = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ApiError = require('../../utils/ApiError');
const { generateOTP } = require('../../utils/otp');
const { sendMail, otpTemplate } = require('../../utils/sendMail');

class AuthService {
  static async getUserById(userId) {
    const result = await db.query(
      'SELECT id, full_name, email, phone, role, is_verified, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Foydalanuvchi topilmadi');
    }
    return result.rows[0];
  }

  static async sendOtp(user, purpose) {
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const result = await db.query(
      `INSERT INTO otp_codes (user_id, code, purpose, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [user.id, code, purpose, expiresAt]
    );

    const localOtpEnabled = process.env.DEV_AUTH_OTP === 'true' && process.env.NODE_ENV !== 'production';
    if (localOtpEnabled) {
      return code;
    }

    const subject = purpose === 'verify' ? 'Akkountni tasdiqlash kodi' : 'Parolni tiklash kodi';
    const sent = await sendMail(user.email, subject, otpTemplate(user.full_name, code, purpose));
    if (!sent) {
      await db.query('UPDATE otp_codes SET is_used = true WHERE id = $1', [result.rows[0].id]);
      throw new ApiError(502, 'Emailga kod yuborilmadi. SMTP sozlamalarini tekshiring va qayta urinib ko‘ring');
    }
    return null;
  }

  static async register({ full_name, email, password, phone }) {
    const normalizedEmail = email.toLowerCase();
    const userExist = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (userExist.rows.length > 0) {
      throw new ApiError(409, 'Ushbu email allaqachon ro\'yxatdan o\'tgan');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.query(
      `INSERT INTO users (full_name, email, password, phone, is_verified)
       VALUES ($1, $2, $3, $4, false) RETURNING id, full_name, email, phone, role, is_verified`,
      [full_name, normalizedEmail, hashedPassword, phone]
    );

    const user = newUser.rows[0];
    const devCode = await this.sendOtp(user, 'verify');

    return { user, devCode };
  }

  static async verify({ email, code }) {
    const normalizedEmail = email.toLowerCase();
    const userRes = await db.query('SELECT id, full_name, is_verified FROM users WHERE email = $1', [normalizedEmail]);
    if (userRes.rows.length === 0) throw new ApiError(404, 'Foydalanuvchi topilmadi');
    const user = userRes.rows[0];

    if (user.is_verified) {
      throw new ApiError(400, 'Akkount allaqachon tasdiqlangan');
    }

    const otpRes = await db.query(
      `SELECT id FROM otp_codes
       WHERE user_id = $1 AND code = $2 AND purpose = 'verify' AND is_used = false AND expires_at > NOW()`,
      [user.id, code]
    );

    if (otpRes.rows.length === 0) {
      throw new ApiError(400, 'Kod noto\'g\'ri yoki muddati o\'tgan');
    }

    await db.query('UPDATE otp_codes SET is_used = true WHERE id = $1', [otpRes.rows[0].id]);
    await db.query('UPDATE users SET is_verified = true WHERE id = $1', [user.id]);

    return { message: 'Akkount muvaffaqiyatli tasdiqlandi' };
  }

  static async resendCode({ email }) {
    const normalizedEmail = email.toLowerCase();
    const userRes = await db.query('SELECT id, full_name, is_verified FROM users WHERE email = $1', [normalizedEmail]);
    if (userRes.rows.length === 0) throw new ApiError(404, 'Foydalanuvchi topilmadi');
    const user = userRes.rows[0];

    if (user.is_verified) {
      throw new ApiError(400, 'Akkount allaqachon tasdiqlangan');
    }

    // 60 soniya tekshiruvi
    const lastOtpRes = await db.query(
      `SELECT created_at FROM otp_codes
       WHERE user_id = $1 AND purpose = 'verify' AND is_used = false
       ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );

    if (lastOtpRes.rows.length > 0) {
      const lastCreated = new Date(lastOtpRes.rows[0].created_at);
      const diffSeconds = (Date.now() - lastCreated.getTime()) / 1000;
      if (diffSeconds < 60) {
        const remaining = Math.ceil(60 - diffSeconds);
        throw new ApiError(429, `Iltimos, ${remaining} soniya kutib turing`);
      }
    }

    const devCode = await this.sendOtp(user, 'verify');

    return {
      message: 'Tasdiqlash kodi qayta yuborildi',
      ...(devCode && { devCode })
    };
  }

  static async login({ email, password }) {
    const normalizedEmail = email.toLowerCase();
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (userRes.rows.length === 0) throw new ApiError(401, 'Email yoki parol noto\'g\'ri');
    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ApiError(401, 'Email yoki parol noto\'g\'ri');

    if (!user.is_verified) {
      throw new ApiError(403, 'Akkount tasdiqlanmagan. Iltimos, emailizga borgan kodni tasdiqlang');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _pw, ...safeUser } = user;
    return { token, user: safeUser };
  }

  static async forgotPassword({ email }) {
    const normalizedEmail = email.toLowerCase();
    const userRes = await db.query('SELECT id, full_name FROM users WHERE email = $1', [normalizedEmail]);
    if (userRes.rows.length === 0) {
      // Xavfsizlik uchun email mavjud bo'lmasa ham bir xil xabar
      return { message: 'Parolni tiklash kodi emailga yuborildi' };
    }

    const user = userRes.rows[0];
    const devCode = await this.sendOtp({ ...user, email: normalizedEmail }, 'reset');

    return {
      message: 'Parolni tiklash kodi emailga yuborildi',
      ...(devCode && { devCode })
    };
  }

  static async resetPassword({ email, code, newPassword }) {
    const normalizedEmail = email.toLowerCase();
    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (userRes.rows.length === 0) {
      throw new ApiError(400, 'Kod noto\'g\'ri yoki muddati o\'tgan');
    }

    const user = userRes.rows[0];
    const otpRes = await db.query(
      `SELECT id FROM otp_codes
       WHERE user_id = $1 AND code = $2 AND purpose = 'reset' AND is_used = false AND expires_at > NOW()`,
      [user.id, code]
    );

    if (otpRes.rows.length === 0) {
      throw new ApiError(400, 'Kod noto\'g\'ri yoki muddati o\'tgan');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
    await db.query('UPDATE otp_codes SET is_used = true WHERE id = $1', [otpRes.rows[0].id]);

    return { message: 'Parol muvaffaqiyatli yangilandi' };
  }
}

module.exports = AuthService;
>>>>>>> 76df369 (faylni ozgartrdim)
