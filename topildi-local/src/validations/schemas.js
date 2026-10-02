const Joi = require('joi');

const phoneRegex = /^\+998\d{9}$/;

// ─── Auth ────────────────────────────────────────────────────────────────────

exports.registerSchema = Joi.object({
  full_name: Joi.string().min(3).max(50).required().messages({
    'string.min': 'Ism kamida 3 ta belgidan iborat bo\'lishi kerak',
    'string.max': 'Ism 50 ta belgidan oshmasligi kerak',
    'any.required': 'Ism majburiy'
  }),
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'To\'g\'ri email manzil kiriting',
    'any.required': 'Email majburiy'
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required().messages({
    'string.min': 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak',
    'string.pattern.base': 'Parol kamida 1 ta harf va 1 ta raqam o\'z ichiga olishi kerak',
    'any.required': 'Parol majburiy'
  }),
  phone: Joi.string().pattern(phoneRegex).required().messages({
    'string.pattern.base': 'Telefon +998XXXXXXXXX formatida bo\'lishi kerak',
    'any.required': 'Telefon majburiy'
  })
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'To\'g\'ri email manzil kiriting',
    'any.required': 'Email majburiy'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Parol majburiy'
  })
});

exports.verifySchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': 'Kod aynan 6 ta raqamdan iborat bo\'lishi kerak',
    'string.pattern.base': 'Kod faqat raqamlardan iborat bo\'lishi kerak'
  })
});

exports.resendCodeSchema = Joi.object({
  email: Joi.string().email().lowercase().required()
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required()
});

exports.resetPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': 'Kod aynan 6 ta raqamdan iborat bo\'lishi kerak'
  }),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required().messages({
    'string.min': 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak',
    'string.pattern.base': 'Parol kamida 1 ta harf va 1 ta raqam o\'z ichiga olishi kerak',
    'any.required': 'Yangi parol majburiy'
  })
});

// ─── Categories ──────────────────────────────────────────────────────────────

exports.categorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Kategoriya nomi kamida 2 ta belgi bo\'lishi kerak',
    'any.required': 'Kategoriya nomi majburiy'
  })
});

exports.categoryIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID musbat butun son bo\'lishi kerak',
    'any.required': 'ID majburiy'
  })
});

// ─── Items ───────────────────────────────────────────────────────────────────

exports.itemSchema = Joi.object({
  type: Joi.string().valid('lost', 'found').required().messages({
    'any.only': 'Tur faqat lost yoki found bo\'lishi mumkin',
    'any.required': 'E\'lon turi majburiy'
  }),
  title: Joi.string().min(5).max(100).required().messages({
    'string.min': 'Sarlavha kamida 5 ta belgi bo\'lishi kerak',
    'string.max': 'Sarlavha 100 ta belgidan oshmasligi kerak',
    'any.required': 'Sarlavha majburiy'
  }),
  description: Joi.string().min(10).max(1000).required().messages({
    'string.min': 'Tavsif kamida 10 ta belgi bo\'lishi kerak',
    'string.max': 'Tavsif 1000 ta belgidan oshmasligi kerak',
    'any.required': 'Tavsif majburiy'
  }),
  location: Joi.string().min(3).max(150).required().messages({
    'string.min': 'Joylashuv kamida 3 ta belgi bo\'lishi kerak',
    'any.required': 'Joylashuv majburiy'
  }),
  category_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Kategoriya ID musbat butun son bo\'lishi kerak',
    'any.required': 'Kategoriya majburiy'
  }),
  event_date: Joi.date().iso().max('now').required().messages({
    'date.max': 'Sana kelajakdagi bo\'lishi mumkin emas',
    'any.required': 'Sana majburiy'
  }),
  secret_question: Joi.when('type', {
    is: 'found',
    then: Joi.string().min(10).max(200).required().messages({
      'string.min': 'Maxfiy savol kamida 10 ta belgi bo\'lishi kerak',
      'any.required': 'Maxfiy savol (found e\'lon uchun) majburiy'
    }),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'Maxfiy savol faqat found e\'lon uchun qo\'llaniladi'
    })
  }),
  secret_answer: Joi.when('type', {
    is: 'found',
    then: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Maxfiy javob kamida 2 ta belgi bo\'lishi kerak',
      'any.required': 'Maxfiy javob (found e\'lon uchun) majburiy'
    }),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'Maxfiy javob faqat found e\'lon uchun qo\'llaniladi'
    })
  })
});

exports.updateItemSchema = Joi.object({
  title: Joi.string().min(5).max(100),
  description: Joi.string().min(10).max(1000),
  location: Joi.string().min(3).max(150),
  category_id: Joi.number().integer().positive(),
  status: Joi.string().valid('closed')
}).min(1).messages({
  'object.min': 'Kamida bitta maydon o\'zgartirilishi kerak'
});

exports.itemIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID musbat butun son bo\'lishi kerak',
    'any.required': 'ID majburiy'
  })
});

exports.itemQuerySchema = Joi.object({
  type: Joi.string().valid('lost', 'found'),
  category_id: Joi.number().integer().positive(),
  search: Joi.string().max(100),
  page: Joi.number().integer().positive().default(1),
  limit: Joi.number().integer().positive().max(50).default(10)
});

exports.reportSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  message: Joi.string().max(500).allow('', null)
});

// ─── Claims ──────────────────────────────────────────────────────────────────

exports.claimSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID musbat butun son bo\'lishi kerak'
  }),
  answer: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Javob kamida 2 ta belgi bo\'lishi kerak',
    'any.required': 'Javob majburiy'
  }),
  message: Joi.string().max(500).allow('', null)
});

exports.claimIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID musbat butun son bo\'lishi kerak'
  })
});