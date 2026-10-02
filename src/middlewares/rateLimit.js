const rateLimit = require('express-rate-limit');

const WINDOW_MS = 15 * 60 * 1000; // 15 daqiqa

// Har bir API yo'li uchun alohida so'rov hisoblagichini yaratadi va xatoni loyiha formatida qaytaradi.
const createLimiter = (limit, message) =>
  rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, message }),
  });

// Kirish: bitta IP manzildan 15 daqiqada ko'pi bilan 10 ta urinish.
const loginLimiter = createLimiter(10, 'Juda ko\'p login urinishlari. 15 daqiqadan keyin qayta urinib ko\'ring');

// Har bir OTP API yo'li uchun 15 daqiqada ko'pi bilan 10 ta so'rov.
const otpLimiter = () => createLimiter(10, 'Juda ko\'p so\'rov yuborildi. Birozdan keyin qayta urinib ko\'ring');

module.exports = { loginLimiter, otpLimiter };
