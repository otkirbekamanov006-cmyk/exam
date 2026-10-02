# 🔎 Topildi API

Yo‘qolgan va topilgan buyumlar platformasi uchun REST API.
Texnologiyalar: **Express.js**, **PostgreSQL** (`pg`, xom SQL), **JWT**, **bcrypt**, **Joi**, **Multer**, **Nodemailer**.

Platformada ikki xil e’lon bor:

- **LOST**: foydalanuvchi yo‘qotgan buyumi haqida e’lon beradi. Topgan odam “Men topdim” (`/report`) yuboradi va egasiga email boradi.
- **FOUND**: topuvchi buyumni e’lon qiladi va **maxfiy savol** qo‘yadi. Da’vogar to‘g‘ri javob berishi kerak. Javob bazada **bcrypt hash** sifatida saqlanadi. Hash qilishdan va solishtirishdan oldin `trim().toLowerCase()` qilinadi.

---

## ⚙️ O‘rnatish va ishga tushirish

### Talablar
- Node.js **18+**
- PostgreSQL **13+**

### Qadamlar

```bash
# 1-qadam: kerakli paketlarni o'rnatish
npm install

# 2-qadam: .env faylini yaratish va sozlash
cp .env.example .env        # Windows: copy .env.example .env

# 3-qadam: ma'lumotlar bazasini bir marta yaratish
psql -U postgres -c "CREATE DATABASE topildi"

# 4-qadam: jadvallar va boshlang'ich ma'lumotlarni yaratish
npm run db:setup            # = db:schema + db:seed (psql shart emas)
#   Buning o'rniga psql buyruqlari bilan ham bajarish mumkin:
#   psql -U postgres -d topildi -f db/schema.sql
#   psql -U postgres -d topildi -f db/seed.sql

# 5-qadam: serverni ishga tushirish
npm run dev
```

Server: `http://localhost:3000`. Swagger: `http://localhost:3000/api/docs`

> ⚠️ `db:schema` jadvallarni **o‘chirib, qaytadan yaratadi**, ya’ni barcha ma’lumotlar tozalanadi.

### 🐳 Docker orqali (bitta buyruq)

```bash
docker compose up --build
```

Postgres konteyneri birinchi ishga tushganda `schema.sql` va `seed.sql` avtomatik bajariladi. SMTP qiymatlarini `.env` faylga yozing, compose ularni o‘zi o‘qiydi.
Bazani noldan qayta yaratish uchun: `docker compose down -v && docker compose up --build`.

### 📧 Email (SMTP)
Test uchun eng qulayi [Mailtrap](https://mailtrap.io). Gmail ishlatsangiz, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true` deb yozing va oddiy parol o‘rniga **App Password** kiriting.
Email yuborilmasa ham server yiqilmaydi: xato faqat konsolga yoziladi.

---

## 👤 Admin (seed’dan)

| Email | Parol |
|---|---|
| `admin@topildi.uz` | `Admin1234` |

---

## 📁 Loyiha tuzilmasi

```
topildi-api/
├── src/
│   ├── config/        # env.js, db.js, mailer.js, multer.js
│   ├── middlewares/   # auth.js, role.js, validate.js, errorHandler.js, rateLimit.js
│   ├── validations/   # common.js, auth / category / item / claim validation
│   ├── modules/
│   │   ├── auth/        # routes, controller, service
│   │   ├── categories/
│   │   ├── items/
│   │   ├── claims/
│   │   └── admin/       # /admin/stats
│   ├── utils/         # ApiError, response, otp, jwt, sendMail, emailTemplates, deleteFiles
│   ├── docs/          # swagger.js (OpenAPI 3)
│   ├── app.js
│   └── server.js
├── db/                # schema.sql, seed.sql, run.js
├── postman/           # Topildi.postman_collection.json
├── uploads/           # .gitignore da
├── Dockerfile, docker-compose.yml
└── .env.example
```

Har bir modul **routes → controller → service** tartibida ishlaydi:
- **routes:** yo‘l va middleware’lar (auth, validate, multer)
- **controller:** HTTP javobini yuboradi
- **service:** biznes mantiq va SQL

### Asosiy kodlarni qayerdan ko'rish kerak?

| Nima izlayapsiz? | Qayerdan boshlaysiz? |
|---|---|
| Serverni ishga tushirish | `src/server.js` |
| API yo'llari qayerga ulanganini ko'rish | `src/app.js` |
| Kirish va ro'yxatdan o'tish | `src/modules/auth/` |
| Kategoriyalar | `src/modules/categories/` |
| E'lonlar | `src/modules/items/` |
| Da'volar | `src/modules/claims/` |
| Administrator funksiyalari | `src/modules/admin/` |
| Ma'lumotlar bazasi jadvallari | `db/schema.sql` |
| Server va baza sozlamalari | `.env` va `src/config/` |

Har bir modul ichida odatda shu tartibda oching:

1. `*.routes.js` — API manzili va unga biriktirilgan tekshiruvlar.
2. `*.controller.js` — so'rov ma'lumotlarini qabul qiladi va javob qaytaradi.
3. `*.service.js` — asosiy ishni bajaradi, masalan ma'lumotlar bazasidan o'qiydi yoki unga yozadi.

Masalan, ro'yxatdan o'tish kodini topish uchun `src/modules/auth/auth.routes.js` faylidan `/register` yo'lini toping. U yerdagi `register` funksiyasi controllerga olib boradi, controller esa asosiy ishni service'dan so'raydi. Kodni brauzerda sinash uchun serverni ishga tushirib, `http://localhost:3000/api/docs` manzilini oching.

---

## 🗄 Ma’lumotlar bazasi

| Jadval | Asosiy cheklovlar |
|---|---|
| `users` | `email UNIQUE`, `phone CHECK (+998XXXXXXXXX)`, `role ENUM`, `is_verified` |
| `otp_codes` | `user_id → users ON DELETE CASCADE`, `purpose ENUM('verify','reset')`, `expires_at`, `is_used` |
| `categories` | `name UNIQUE` |
| `items` | `category_id → categories ON DELETE RESTRICT`. `CHECK`: found bo‘lsa savol/javob bor, lost bo‘lsa yo‘q |
| `item_images` | `item_id → items ON DELETE CASCADE` |
| `claims` | `item_id → items CASCADE`, `claimant_id → users CASCADE`, `answer_correct` (urinishlarni sanash uchun). Qisman UNIQUE indeks: bitta foydalanuvchida bitta e’longa faqat bitta `pending` da’vo bo‘ladi |

---

## 🔗 Endpointlar

Barcha yo‘llar `/api` bilan boshlanadi. Himoyalangan yo‘llar uchun header: `Authorization: Bearer <token>`

### Auth
| Metod | Yo‘l | Kirish | Tavsif |
|---|---|---|---|
| POST | `/auth/register` | Hamma | Ro‘yxatdan o‘tish, emailga 6 xonali kod (5 daqiqa amal qiladi) |
| POST | `/auth/verify` | Hamma | `{ email, code }`: akkauntni tasdiqlash |
| POST | `/auth/resend-code` | Hamma | Yangi kod. 60 soniya o‘tmagan bo‘lsa **429** |
| POST | `/auth/login` | Hamma | JWT token. Tasdiqlanmagan akkaunt **403** |
| POST | `/auth/forgot-password` | Hamma | `reset` maqsadli kod |
| POST | `/auth/reset-password` | Hamma | `{ email, code, newPassword }` |
| GET | `/auth/me` | User | Joriy foydalanuvchi (parolsiz) |

### Kategoriyalar
| Metod | Yo‘l | Kirish | Tavsif |
|---|---|---|---|
| GET | `/categories` | Hamma | Barcha kategoriyalar |
| POST | `/categories` | Admin | Yaratish. Nom takrorlansa **409** |
| PUT | `/categories/:id` | Admin | Tahrirlash |
| DELETE | `/categories/:id` | Admin | O‘chirish. Bog‘langan e’lon bo‘lsa **409** |

### E’lonlar
| Metod | Yo‘l | Kirish | Tavsif |
|---|---|---|---|
| GET | `/items` | Hamma | Faqat `active`. `?type`, `?category_id`, `?search`, `?page`, `?limit` (≤ 50) |
| GET | `/items/:id` | Hamma | E’lon, rasm URL’lari va egasining ismi (email/telefon ko‘rinmaydi) |
| GET | `/items/my` | User | O‘zimning barcha e’lonlarim |
| POST | `/items` | User | `multipart/form-data`, `images` (1–3 ta) |
| PATCH | `/items/:id` | Egasi | title, description, location, category_id, `status='closed'` |
| DELETE | `/items/:id` | Egasi / Admin | E’lon va rasmlarini diskdan o‘chiradi |
| POST | `/items/:id/report` | User | Faqat `lost`: “Men topdim” `{ message }` |

### Da’volar
| Metod | Yo‘l | Kirish | Tavsif |
|---|---|---|---|
| POST | `/items/:id/claims` | User | `{ answer, message }`, faqat `found` |
| GET | `/items/:id/claims` | Egasi | E’longa kelgan da’volar |
| GET | `/claims/my` | User | Men yuborgan da’volar |
| PATCH | `/claims/:id/approve` | E’lon egasi | Tasdiqlash (tranzaksiya) |
| PATCH | `/claims/:id/reject` | E’lon egasi | Rad etish |

### Admin (bonus)
| Metod | Yo‘l | Kirish | Tavsif |
|---|---|---|---|
| GET | `/admin/stats` | Admin | Jami, qaytarilgan va kategoriyalar bo‘yicha statistika (bitta SQL, `GROUP BY ROLLUP`) |

Rasmlar: `GET /uploads/<filename>`

---

## 📏 Biznes qoidalar (qisqacha)

**Da’vo yuborish**
- E’lon yo‘q bo‘lsa **404**.
- `lost` turidagi yoki `active` bo‘lmagan e’lon bo‘lsa **400**.
- O‘z e’loniga da’vo qilinsa **403**.
- Foydalanuvchining shu e’longa `pending` da’vosi bo‘lsa **409**.
- 3 ta noto‘g‘ri javobdan keyin **429** “Urinishlar soni tugadi”.
- Noto‘g‘ri javob bo‘lsa da’vo `rejected` holatida saqlanadi va **400** qaytadi. Email yuborilmaydi.
- To‘g‘ri javob bo‘lsa da’vo `pending` holatida saqlanadi, **201** qaytadi va egasiga email boradi.

**Approve.** Hammasi bitta tranzaksiyada (`BEGIN / COMMIT / ROLLBACK`) bajariladi, qatorlar `SELECT … FOR UPDATE` bilan qulflanadi:
- da’vo `approved` bo‘ladi;
- e’lon `returned` bo‘ladi;
- qolgan `pending` da’volar `rejected` bo‘ladi.

Keyin ikkala tomonga qarshi tomonning ismi va telefoni yuboriladi.

**E’lonlar**
- Admin istalgan e’lonni o‘chira oladi, lekin tahrirlay olmaydi.
- `returned` e’lonni tahrirlab bo‘lmaydi.
- `password` va `secret_answer` hech qaysi javobda qaytmaydi.

**Multer**
- Faqat jpeg, png va webp. Har bir fayl ≤ 2 MB, 1–3 ta.
- Validatsiya yoki baza xatosida yuklangan fayllar diskdan o‘chiriladi (`errorHandler` ichida).

---

## 📨 Emaillar (6 tur)
1. Tasdiqlash kodi (register / resend-code)
2. Parolni tiklash kodi
3. Da’vo keldi (topuvchiga)
4. Da’vo tasdiqlandi (ikkala tomonga, kontaktlar bilan)
5. Da’vo rad etildi (da’vogarga)
6. “Men topdim” (yo‘qotgan odamga)

---

## 📦 Javob formati

```json
{ "success": true, "message": "E'lon yaratildi", "data": { } }

{ "success": true, "data": [ ], "meta": { "page": 1, "limit": 10, "total": 37, "totalPages": 4 } }

{ "success": false, "message": "Validatsiya xatosi",
  "errors": [ { "field": "phone", "message": "Telefon +998xxxxxxx  formatida bo'lishi kerak" } ] }
```

---

## ⭐ Bonuslar
- ✅ Swagger: `/api/docs`
- ✅ Docker: `docker compose up --build`
- ✅ Rate limit: `login` va OTP endpointlari (`express-rate-limit`)
- ✅ `GET /admin/stats` (`GROUP BY ROLLUP`)

## 🧪 Postman
`postman/Topildi.postman_collection.json` faylini import qiling. Login so‘rovlari tokenni o‘zi saqlaydi: `token` (Aziz), `token2` (Dilnoza), `adminToken`.
## Lokal ilova nusxasi

Kompyuterdagi yangilangan ilova mavjud fayllarni almashtirmaslik uchun [`topildi-local/`](./topildi-local/) papkasiga joylangan. Ishga tushirish ko'rsatmalari papka ichidagi README faylida.
