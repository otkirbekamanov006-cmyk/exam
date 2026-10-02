-- Topildi Platform — Ma'lumotlar bazasi sxemasi
-- Avval mavjud bo'lsa, tozalaymiz

DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS item_images CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS otp_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS otp_purpose CASCADE;
DROP TYPE IF EXISTS item_type CASCADE;
DROP TYPE IF EXISTS item_status CASCADE;
DROP TYPE IF EXISTS claim_status CASCADE;

-- ─── Enumlar ────────────────────────────────────────────────────────────────

CREATE TYPE user_role    AS ENUM ('user', 'admin');
CREATE TYPE otp_purpose  AS ENUM ('verify', 'reset');
CREATE TYPE item_type    AS ENUM ('lost', 'found');
CREATE TYPE item_status  AS ENUM ('active', 'returned', 'closed');
CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected');

-- ─── Jadvallar ──────────────────────────────────────────────────────────────

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    full_name   VARCHAR(50)  NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    phone       VARCHAR(13)  NOT NULL,
    password    VARCHAR      NOT NULL,
    role        user_role    DEFAULT 'user',
    is_verified BOOLEAN      DEFAULT false,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_codes (
    id         SERIAL PRIMARY KEY,
    user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code       VARCHAR(6)   NOT NULL,
    purpose    otp_purpose  NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    is_used    BOOLEAN      DEFAULT false,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    id              SERIAL PRIMARY KEY,
    user_id         INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     INT           NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    type            item_type     NOT NULL,
    title           VARCHAR(100)  NOT NULL,
    description     TEXT          NOT NULL,
    location        VARCHAR(150)  NOT NULL,
    event_date      DATE          NOT NULL,
    secret_question VARCHAR(200),
    secret_answer   VARCHAR,
    status          item_status   DEFAULT 'active',
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item_images (
    id         SERIAL PRIMARY KEY,
    item_id    INT          NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    filename   VARCHAR      NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE claims (
    id           SERIAL PRIMARY KEY,
    item_id      INT          NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    claimant_id  INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message      TEXT,
    status       claim_status DEFAULT 'pending',
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─── Indekslar (performance uchun) ──────────────────────────────────────────

CREATE INDEX idx_items_status      ON items(status);
CREATE INDEX idx_items_type        ON items(type);
CREATE INDEX idx_items_category    ON items(category_id);
CREATE INDEX idx_items_user        ON items(user_id);
CREATE INDEX idx_claims_item       ON claims(item_id);
CREATE INDEX idx_claims_claimant   ON claims(claimant_id);
CREATE INDEX idx_otp_user_purpose  ON otp_codes(user_id, purpose);