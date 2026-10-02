-- =====================================================
-- Boshlang'ich ma'lumotlar: kategoriyalar va administrator hisobi.
-- Admin: admin@topildi.uz / Admin1234
-- =====================================================

INSERT INTO categories (name) VALUES
  ('Hujjatlar'),
  ('Telefon'),
  ('Hamyon'),
  ('Kalitlar'),
  ('Sumka'),
  ('Elektronika'),
  ('Boshqa')
ON CONFLICT (name) DO NOTHING;

-- Administrator paroli: Admin1234 (bcrypt orqali, cost qiymati 10 bilan xeshlangan).
INSERT INTO users (full_name, email, phone, password, role, is_verified) VALUES
  ('Bosh Admin', 'admin@topildi.uz', '+998901234567',
   '$2a$10$ER9skvhDNiva.H1kF5ZRyeIgfvLsq65RhbMkWL5Vf1OkpoB1SrE0C', 'admin', true)
ON CONFLICT (email) DO NOTHING;
