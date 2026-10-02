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
