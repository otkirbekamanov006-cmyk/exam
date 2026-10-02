# Topildi API 🔍

Yo'qolgan va topilgan buyumlar platformasi uchun REST API.

## Texnologiyalar

- **Runtime**: Node.js
- **Framework**: Express.js
- **Ma'lumotlar bazasi**: PostgreSQL
- **Autentifikatsiya**: JWT
- **Hashing**: bcrypt
- **Email**: Nodemailer
- **Fayl yuklash**: Multer
- **Validatsiya**: Joi

---

## O'rnatish va ishga tushirish

### 1. Repozitoriyni klonlang
```bash
git clone <repo-url>
cd topildi-api
```

### 2. Bog'liqliklarni o'rnating
```bash
npm install
```

### 3. `.env` faylini sozlang
```bash
cp .env.example .env
# .env faylini tahrirlang
```

`.env` ichida:
```
PORT=5000
DATABASE_URL=postgresql://postgres:your_local_password@localhost:5432/topildi_db
JWT_SECRET=sizning_maxfiy_kalit
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=gmail_app_password
BASE_URL=http://localhost:5000
DEV_AUTH_OTP=false
```

Gmail uchun `SMTP_PASS` oddiy akkaunt paroli emas, Google 2-Step Verification yoqilgandan keyin yaratilgan App Password bo'lishi kerak. `.env`ni saqlagandan so'ng serverni qayta ishga tushiring. Tasdiqlash kodi yuborilmasa, `.env`dagi `SMTP_USER` va `SMTP_PASS`ni tekshiring; haqiqiy qiymatlarni repozitoriyga yoki chatga joylamang.

Mahalliy sinovda email sozlanmagan bo'lsa, `.env`ga `DEV_AUTH_OTP=true` qo'shing va serverni qayta ishga tushiring. Tasdiqlash va parol tiklash kodlari shu holatda saytning o'zida ko'rinadi. Bu sozlama production muhitida ishlamaydi; deploy qilganda `false` holida qoldiring.

### 4. Ma'lumotlar bazasini yarating
```bash
# PostgreSQL da topildi_db bazasini yarating
psql -U postgres -c "CREATE DATABASE topildi_db;"

# Sxemani qo'llang
psql -U postgres -d topildi_db -f db/schema.sql

# Boshlang'ich ma'lumotlarni qo'shing
psql -U postgres -d topildi_db -f db/seed.sql
```

### 5. Serverni ishga tushiring
```bash
npm run dev    # Development
npm start      # Production
```

---

## Admin login ma'lumotlari (seed'dan)

| Maydon   | Qiymat             |
|----------|--------------------|
| Email    | admin@topildi.uz   |
| Parol    | Admin123!          |
| Rol      | admin              |

---

## API Endpointlar

Base URL: `http://localhost:5000/api`

### 🔐 Auth

| Metod | Endpoint              | Kirish | Vazifasi                    |
|-------|-----------------------|--------|-----------------------------|
| POST  | /auth/register        | Hamma  | Ro'yxatdan o'tish           |
| POST  | /auth/verify          | Hamma  | Email tasdiqlash            |
| POST  | /auth/resend-code     | Hamma  | Kodni qayta yuborish        |
| POST  | /auth/login           | Hamma  | Tizimga kirish → JWT token  |
| POST  | /auth/forgot-password | Hamma  | Parolni tiklash kodi        |
| POST  | /auth/reset-password  | Hamma  | Yangi parol o'rnatish       |
| GET   | /auth/me              | User   | Joriy foydalanuvchi         |

### 📁 Kategoriyalar

| Metod  | Endpoint         | Kirish | Vazifasi          |
|--------|------------------|--------|-------------------|
| GET    | /categories      | Hamma  | Barcha kategoriyalar |
| POST   | /categories      | Admin  | Yangi kategoriya  |
| PUT    | /categories/:id  | Admin  | Tahrirlash        |
| DELETE | /categories/:id  | Admin  | O'chirish         |

### 📢 E'lonlar

| Metod  | Endpoint           | Kirish      | Vazifasi                           |
|--------|--------------------|-------------|------------------------------------|
| GET    | /items             | Hamma       | E'lonlar ro'yxati (filtr+paginate) |
| GET    | /items/my          | User        | O'zimning e'lonlarim               |
| GET    | /items/:id         | Hamma       | Bitta e'lon                        |
| POST   | /items             | User        | E'lon yaratish (rasm bilan)        |
| PATCH  | /items/:id         | Egasi       | E'lonni tahrirlash                 |
| DELETE | /items/:id         | Egasi/Admin | E'lonni o'chirish                  |
| POST   | /items/:id/report  | User        | "Men topdim" (lost e'lonlar)       |

**Filtr parametrlari:**
```
GET /api/items?type=lost&category_id=1&search=hamyon&page=1&limit=10
```

### 📝 Da'volar

| Metod | Endpoint               | Kirish  | Vazifasi                    |
|-------|------------------------|---------|-----------------------------|
| POST  | /items/:id/claims      | User    | Da'vo yuborish (found)      |
| GET   | /items/:id/claims      | Egasi   | E'lon da'volari             |
| GET   | /claims/my             | User    | Mening da'volarim           |
| PATCH | /claims/:id/approve    | Egasi   | Da'voni tasdiqlash          |
| PATCH | /claims/:id/reject     | Egasi   | Da'voni rad etish           |

### 📊 Admin

| Metod | Endpoint     | Kirish | Vazifasi        |
|-------|--------------|--------|-----------------|
| GET   | /admin/stats | Admin  | Statistika      |

---

## Javob formati

```json
// Muvaffaqiyatli
{ "success": true, "message": "...", "data": {} }

// Ro'yxat (pagination)
{ "success": true, "data": [], "meta": { "page": 1, "limit": 10, "total": 37, "totalPages": 4 } }

// Xato
{ "success": false, "message": "Validatsiya xatosi", "errors": [{ "field": "email", "message": "..." }] }
```

---

## Rasmlarni ko'rish

```
GET http://localhost:5000/uploads/<filename>
```
