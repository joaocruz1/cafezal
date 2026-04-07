-- Criar usuário admin no banco (PostgreSQL / Supabase)
-- Email: carlos@porteirademinas.com | Senha: admin123
-- Requer extensão pgcrypto (Supabase já possui).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "User" (id, email, "passwordHash", name, profile, active, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'carlos@porteirademinas.com',
  crypt('admin123', gen_salt('bf')),
  'Carlos',
  'ADMIN',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  name = EXCLUDED.name,
  profile = EXCLUDED.profile,
  active = EXCLUDED.active,
  "updatedAt" = CURRENT_TIMESTAMP;
