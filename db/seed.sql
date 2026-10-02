<<<<<<< HEAD
-- =====================================================
-- Boshlang'ich ma'lumotlar: kategoriyalar va administrator hisobi.
-- Admin: admin@topildi.uz / Admin1234
-- =====================================================

=======
-- Boshlang'ich kategoriyalar
>>>>>>> 76df369 (faylni ozgartrdim)
INSERT INTO categories (name) VALUES
  ('Hujjatlar'),
  ('Telefon'),
  ('Hamyon'),
  ('Kalitlar'),
  ('Sumka'),
<<<<<<< HEAD
=======
  ('Kiyim'),
>>>>>>> 76df369 (faylni ozgartrdim)
  ('Elektronika'),
  ('Boshqa')
ON CONFLICT (name) DO NOTHING;

<<<<<<< HEAD
-- Administrator paroli: Admin1234 (bcrypt orqali, cost qiymati 10 bilan xeshlangan).
INSERT INTO users (full_name, email, phone, password, role, is_verified) VALUES
  ('Bosh Admin', 'admin@topildi.uz', '+998901234567',
   '$2a$10$ER9skvhDNiva.H1kF5ZRyeIgfvLsq65RhbMkWL5Vf1OkpoB1SrE0C', 'admin', true)
ON CONFLICT (email) DO NOTHING;
=======
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
>>>>>>> 76df369 (faylni ozgartrdim)
