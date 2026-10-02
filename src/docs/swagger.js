// OpenAPI 3 formatidagi hujjatlar /api/docs manzilida Swagger UI orqali ko'rsatiladi.
const { appUrl } = require('../config/env');

const json = (schema) => ({ content: { 'application/json': { schema } } });
const ok = (description = 'Muvaffaqiyatli') => ({ description, ...json({ $ref: '#/components/schemas/Success' }) });
const err = (description) => ({ description, ...json({ $ref: '#/components/schemas/Error' }) });
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } };
const bearer = [{ bearerAuth: [] }];

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Topildi API',
    version: '1.0.0',
    description: 'Yo\'qolgan va topilgan buyumlar platformasi uchun REST API.\n\nAdmin: `admin@topildi.uz` / `Admin1234`',
  },
  servers: [{ url: `${appUrl}/api` }],
  tags: [
    { name: 'Auth' }, { name: 'Categories' }, { name: 'Items' }, { name: 'Claims' }, { name: 'Admin' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {},
          meta: { $ref: '#/components/schemas/Meta' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validatsiya xatosi' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: { field: { type: 'string' }, message: { type: 'string' } },
            },
          },
        },
      },
      Meta: {
        type: 'object',
        properties: {
          page: { type: 'integer' }, limit: { type: 'integer' },
          total: { type: 'integer' }, totalPages: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Ro\'yxatdan o\'tish (emailga 6 xonali kod)',
        requestBody: json({
          type: 'object', required: ['full_name', 'email', 'phone', 'password'],
          properties: {
            full_name: { type: 'string', example: 'Aziz Karimov' },
            email: { type: 'string', example: 'aziz@example.com' },
            phone: { type: 'string', example: '+998901112233' },
            password: { type: 'string', example: 'Parol1234' },
          },
        }),
        responses: { 201: ok('Yaratildi'), 400: err('Validatsiya xatosi'), 409: err('Email band') },
      },
    },
    '/auth/verify': {
      post: {
        tags: ['Auth'], summary: 'Emailni tasdiqlash',
        requestBody: json({ type: 'object', properties: { email: { type: 'string' }, code: { type: 'string', example: '123456' } } }),
        responses: { 200: ok(), 400: err('Kod noto\'g\'ri yoki muddati o\'tgan'), 404: err('Topilmadi') },
      },
    },
    '/auth/resend-code': {
      post: {
        tags: ['Auth'], summary: 'Kodni qayta yuborish',
        requestBody: json({ type: 'object', properties: { email: { type: 'string' } } }),
        responses: { 200: ok(), 429: err('60 soniya o\'tmagan') },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Kirish — JWT token',
        requestBody: json({ type: 'object', properties: { email: { type: 'string', example: 'admin@topildi.uz' }, password: { type: 'string', example: 'Admin1234' } } }),
        responses: { 200: ok(), 401: err('Email yoki parol xato'), 403: err('Akkaunt tasdiqlanmagan') },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'], summary: 'Parolni tiklash kodini yuborish',
        requestBody: json({ type: 'object', properties: { email: { type: 'string' } } }),
        responses: { 200: ok(), 404: err('Topilmadi'), 429: err('Juda tez') },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'], summary: 'Yangi parol o\'rnatish',
        requestBody: json({ type: 'object', properties: { email: { type: 'string' }, code: { type: 'string' }, newPassword: { type: 'string' } } }),
        responses: { 200: ok(), 400: err('Kod noto\'g\'ri') },
      },
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Joriy foydalanuvchi', security: bearer, responses: { 200: ok(), 401: err('Token yo\'q') } },
    },
    '/categories': {
      get: { tags: ['Categories'], summary: 'Barcha kategoriyalar', responses: { 200: ok() } },
      post: {
        tags: ['Categories'], summary: 'Kategoriya yaratish (admin)', security: bearer,
        requestBody: json({ type: 'object', properties: { name: { type: 'string', example: 'Ko\'zoynak' } } }),
        responses: { 201: ok(), 403: err('Admin emas'), 409: err('Nom band') },
      },
    },
    '/categories/{id}': {
      put: {
        tags: ['Categories'], summary: 'Kategoriyani tahrirlash (admin)', security: bearer, parameters: [idParam],
        requestBody: json({ type: 'object', properties: { name: { type: 'string' } } }),
        responses: { 200: ok(), 404: err('Topilmadi'), 409: err('Nom band') },
      },
      delete: {
        tags: ['Categories'], summary: 'Kategoriyani o\'chirish (admin)', security: bearer, parameters: [idParam],
        responses: { 200: ok(), 409: err('Bog\'langan e\'lon bor') },
      },
    },
    '/items': {
      get: {
        tags: ['Items'], summary: 'Faol e\'lonlar (filtr, qidiruv, pagination)',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['lost', 'found'] } },
          { name: 'category_id', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 50 } },
        ],
        responses: { 200: ok(), 400: err('Validatsiya xatosi') },
      },
      post: {
        tags: ['Items'], summary: 'E\'lon yaratish (multipart/form-data)', security: bearer,
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['type', 'category_id', 'title', 'description', 'location', 'event_date', 'images'],
                properties: {
                  type: { type: 'string', enum: ['lost', 'found'] },
                  category_id: { type: 'integer', example: 3 },
                  title: { type: 'string', example: 'Qora charm hamyon' },
                  description: { type: 'string', example: 'Metroda topildi, ichida kartalar bor' },
                  location: { type: 'string', example: 'Chilonzor metro bekati' },
                  event_date: { type: 'string', example: '2026-09-28' },
                  secret_question: { type: 'string', example: 'Hamyon ichida qaysi bankning kartasi bor?' },
                  secret_answer: { type: 'string', example: 'Kapitalbank' },
                  images: { type: 'array', items: { type: 'string', format: 'binary' }, minItems: 1, maxItems: 3 },
                },
              },
            },
          },
        },
        responses: { 201: ok(), 400: err('Validatsiya / fayl xatosi') },
      },
    },
    '/items/my': {
      get: { tags: ['Items'], summary: 'Mening e\'lonlarim', security: bearer, responses: { 200: ok() } },
    },
    '/items/{id}': {
      get: { tags: ['Items'], summary: 'Bitta e\'lon', parameters: [idParam], responses: { 200: ok(), 404: err('Topilmadi') } },
      patch: {
        tags: ['Items'], summary: 'E\'lonni tahrirlash (egasi)', security: bearer, parameters: [idParam],
        requestBody: json({
          type: 'object',
          properties: {
            title: { type: 'string' }, description: { type: 'string' }, location: { type: 'string' },
            category_id: { type: 'integer' }, status: { type: 'string', enum: ['closed'] },
          },
        }),
        responses: { 200: ok(), 400: err('returned e\'lon'), 403: err('Egasi emas') },
      },
      delete: {
        tags: ['Items'], summary: 'E\'lonni o\'chirish (egasi yoki admin)', security: bearer, parameters: [idParam],
        responses: { 200: ok(), 403: err('Ruxsat yo\'q') },
      },
    },
    '/items/{id}/report': {
      post: {
        tags: ['Items'], summary: '"Men topdim" (faqat lost)', security: bearer, parameters: [idParam],
        requestBody: json({ type: 'object', properties: { message: { type: 'string', example: 'Telefoningizni topdim, qo\'ng\'iroq qiling' } } }),
        responses: { 200: ok(), 400: err('lost emas') },
      },
    },
    '/items/{id}/claims': {
      post: {
        tags: ['Claims'], summary: 'Da\'vo yuborish (faqat found)', security: bearer, parameters: [idParam],
        requestBody: json({ type: 'object', properties: { answer: { type: 'string', example: 'kapitalbank' }, message: { type: 'string' } } }),
        responses: {
          201: ok('Javob to\'g\'ri — pending'), 400: err('Javob noto\'g\'ri'), 403: err('O\'z e\'loni'),
          404: err('Topilmadi'), 409: err('Pending da\'vo bor'), 429: err('Urinishlar soni tugadi'),
        },
      },
      get: {
        tags: ['Claims'], summary: 'E\'longa kelgan da\'volar (egasi)', security: bearer, parameters: [idParam],
        responses: { 200: ok(), 403: err('Egasi emas') },
      },
    },
    '/claims/my': {
      get: { tags: ['Claims'], summary: 'Men yuborgan da\'volar', security: bearer, responses: { 200: ok() } },
    },
    '/claims/{id}/approve': {
      patch: {
        tags: ['Claims'], summary: 'Da\'voni tasdiqlash (tranzaksiya)', security: bearer, parameters: [idParam],
        responses: { 200: ok(), 400: err('pending emas'), 403: err('Egasi emas') },
      },
    },
    '/claims/{id}/reject': {
      patch: {
        tags: ['Claims'], summary: 'Da\'voni rad etish', security: bearer, parameters: [idParam],
        responses: { 200: ok(), 400: err('pending emas'), 403: err('Egasi emas') },
      },
    },
    '/admin/stats': {
      get: { tags: ['Admin'], summary: 'Statistika (GROUP BY)', security: bearer, responses: { 200: ok(), 403: err('Admin emas') } },
    },
  },
};
