-- =====================================================
-- Topildi loyihasining PostgreSQL ma'lumotlar bazasi tuzilmasi.
-- Bu fayl qayta ishga tushirilganda eski jadvallar o'chirilib, yangidan yaratiladi.
-- =====================================================

SET client_min_messages = warning;

DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS item_images CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS otp_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS otp_purpose;
DROP TYPE IF EXISTS item_type;
DROP TYPE IF EXISTS item_status;
DROP TYPE IF EXISTS claim_status;

CREATE TYPE user_role    AS ENUM ('user', 'admin');
CREATE TYPE otp_purpose  AS ENUM ('verify', 'reset');
CREATE TYPE item_type    AS ENUM ('lost', 'found');
CREATE TYPE item_status  AS ENUM ('active', 'returned', 'closed');
CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected');

-- 1. Foydalanuvchilar
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  full_name   VARCHAR(50)  NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  phone       VARCHAR(13)  NOT NULL CHECK (phone ~ '^\+998[0-9]{9}$'),
  password    VARCHAR(255) NOT NULL,              -- faqat bcrypt hash
  role        user_role    NOT NULL DEFAULT 'user',
  is_verified BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 2. Bir martalik tasdiqlash kodlari (OTP)
CREATE TABLE otp_codes (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code       VARCHAR(6)  NOT NULL CHECK (code ~ '^[0-9]{6}$'),
  purpose    otp_purpose NOT NULL,
  expires_at TIMESTAMP   NOT NULL,
  is_used    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_otp_user_purpose ON otp_codes(user_id, purpose);

-- 3. Kategoriyalar
CREATE TABLE categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- 4. E'lonlar
CREATE TABLE items (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id     INTEGER      NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  type            item_type    NOT NULL,
  title           VARCHAR(100) NOT NULL,
  description     TEXT         NOT NULL,
  location        VARCHAR(150) NOT NULL,
  event_date      DATE         NOT NULL,
  secret_question VARCHAR(200),
  secret_answer   VARCHAR(255),                   -- bcrypt hash, response'da qaytmaydi
  status          item_status  NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  -- type qiymati 'found' (topilgan) bo'lsa savol va javob shart; 'lost' (yo'qolgan) bo'lsa, ular berilmasligi kerak.
  CONSTRAINT chk_secret CHECK (
    (type = 'found' AND secret_question IS NOT NULL AND secret_answer IS NOT NULL) OR
    (type = 'lost'  AND secret_question IS NULL     AND secret_answer IS NULL)
  )
);
CREATE INDEX idx_items_status_created ON items(status, created_at DESC);
CREATE INDEX idx_items_user ON items(user_id);
CREATE INDEX idx_items_category ON items(category_id);

-- 5. E'lon rasmlari
CREATE TABLE item_images (
  id         SERIAL PRIMARY KEY,
  item_id    INTEGER      NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  filename   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_images_item ON item_images(item_id);

-- 6. Da'volar
CREATE TABLE claims (
  id             SERIAL PRIMARY KEY,
  item_id        INTEGER      NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  claimant_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message        TEXT,
  status         claim_status NOT NULL DEFAULT 'pending',
  answer_correct BOOLEAN      NOT NULL,           -- urinishlar limitini hisoblash uchun
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_claims_item ON claims(item_id);
CREATE INDEX idx_claims_claimant ON claims(claimant_id);
-- Har bir foydalanuvchi bitta e'longa faqat bitta 'pending' (ko'rib chiqilayotgan) da'vo yuborishi mumkin.
CREATE UNIQUE INDEX uniq_pending_claim ON claims(item_id, claimant_id) WHERE status = 'pending';
