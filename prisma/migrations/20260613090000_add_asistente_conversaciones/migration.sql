CREATE TABLE IF NOT EXISTS "conversaciones_chat" (
  "id" SERIAL NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "institucionId" INTEGER NOT NULL,
  "titulo" TEXT,
  "resumen" TEXT,
  "temas" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversaciones_chat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "intereses_usuarios" (
  "id" SERIAL NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "tema" TEXT NOT NULL,
  "peso" INTEGER NOT NULL DEFAULT 1,
  "ultimaConsulta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "intereses_usuarios_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "conversaciones_chat"
  DROP CONSTRAINT IF EXISTS "conversaciones_chat_usuarioId_fkey";

ALTER TABLE "conversaciones_chat"
  ADD CONSTRAINT "conversaciones_chat_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversaciones_chat"
  DROP CONSTRAINT IF EXISTS "conversaciones_chat_institucionId_fkey";

ALTER TABLE "conversaciones_chat"
  ADD CONSTRAINT "conversaciones_chat_institucionId_fkey"
  FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "intereses_usuarios"
  DROP CONSTRAINT IF EXISTS "intereses_usuarios_usuarioId_fkey";

ALTER TABLE "intereses_usuarios"
  ADD CONSTRAINT "intereses_usuarios_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "conversaciones_chat_usuarioId_updatedAt_idx"
  ON "conversaciones_chat"("usuarioId", "updatedAt");

CREATE INDEX IF NOT EXISTS "conversaciones_chat_institucionId_createdAt_idx"
  ON "conversaciones_chat"("institucionId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "intereses_usuarios_usuarioId_tema_key"
  ON "intereses_usuarios"("usuarioId", "tema");

CREATE INDEX IF NOT EXISTS "intereses_usuarios_usuarioId_peso_idx"
  ON "intereses_usuarios"("usuarioId", "peso");
