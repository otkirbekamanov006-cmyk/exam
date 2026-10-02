-- Boshlang'ich kategoriyalar
INSERT INTO categories (name) VALUES
  ('Hujjatlar'),
  ('Telefon'),
  ('Hamyon'),
  ('Kalitlar'),
  ('Sumka'),
  ('Kiyim'),
  ('Elektronika'),
  ('Boshqa')
ON CONFLICT (name) DO NOTHING;

-- Admin foydalanuvchi
-- Parol: Admin123! (bcrypt bilan hash qilingan, saltRounds=10)
INSERT INTO users (full_name, email, phone, password, role, is_verified)
VALUES (
  'Admin User',
  'admin@topildi.uz',
  '+998901234567',
  '$2b$10$w1q9I9X4kK/7CshL9P1C.e1oAox0rG8c28Mv0gM3kCgZkWx5L3G0m',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;