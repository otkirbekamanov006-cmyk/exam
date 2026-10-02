const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { nodeEnv } = require('./config/env');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { UPLOAD_DIR } = require('./utils/deleteFiles');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (nodeEnv !== 'test') app.use(morgan('dev'));

// Yuklangan rasmlarni GET /uploads/<filename> manzili orqali ochish mumkin.
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Topildi API ishlayapti', docs: '/api/docs' });
});

// API hujjatlarini Swagger orqali ko'rsatish
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API yo'llarini tegishli routerlarga yo'naltirish
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/categories', require('./modules/categories/categories.routes'));
app.use('/api/items', require('./modules/items/items.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));
app.use('/api', require('./modules/claims/claims.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
