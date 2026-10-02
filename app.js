const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./src/middlewares/errorHandler');
const ApiError = require('./src/utils/ApiError');

const authRoutes = require('./src/modules/auth/auth.routes');
const categoryRoutes = require('./src/modules/categories/category.routes');
const itemRoutes = require('./src/modules/items/item.routes');
const claimRoutes = require('./src/modules/claims/claim.routes');
const adminRoutes = require('./src/modules/admin/admin.routes');

// Bonus: rate limiting
let loginLimiter = (req, res, next) => next();
let otpLimiter = (req, res, next) => next();
try {
  const rateLimit = require('express-rate-limit');
  loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 daqiqa
    max: 10,
    message: { success: false, message: 'Juda ko\'p urinish. 15 daqiqadan so\'ng qayta urinib ko\'ring' },
    standardHeaders: true,
    legacyHeaders: false
  });
  otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 daqiqa
    max: 5,
    message: { success: false, message: 'Juda ko\'p urinish. 5 daqiqadan so\'ng qayta urinib ko\'ring' }
  });
} catch (_) {
  console.warn('express-rate-limit o\'rnatilmagan, limitlar o\'chirilgan');
}

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Statik fayllar — /uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  index: false
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Topildi API ishlamoqda', time: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);

// Rate limitlarni auth routelariga qo'shamiz
// (Express middleware zanjirida keyingi qayta ulash mumkin emas, shuning uchun router darajasida bo'lishi ideal)
// Lekin sodda usul: login va OTP endpointlariga alohida middleware
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/resend-code', otpLimiter);
app.use('/api/auth/verify', otpLimiter);

// 404 — Faqat /api ostidagi noma'lum route'lar
app.use('/api/*', (req, res, next) => {
  next(new ApiError(404, `${req.originalUrl} manzili topilmadi`));
});

// Frontend uchun (SPA support)
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.set('Cache-Control', 'no-store');
    res.sendFile(indexPath);
  } else {
    res.json({ success: true, message: 'Topildi API' });
  }
});

// Markazlashgan xato handler — oxirda bo'lishi shart
app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server ${PORT}-portda ishga tushdi`);
    console.log(`📚 API: http://localhost:${PORT}/api`);
  });
}

module.exports = app;