const crypto = require('crypto');

const OTP_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;

// Kriptografik usulda xavfsiz 6 xonali tasdiqlash kodini yaratadi (100000 dan 999999 gacha).
const generateOtp = () => String(crypto.randomInt(100000, 1000000));

module.exports = { generateOtp, OTP_TTL_MINUTES, RESEND_COOLDOWN_SECONDS };
