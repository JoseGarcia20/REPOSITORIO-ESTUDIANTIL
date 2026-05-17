CREATE TABLE "foro_categorias" (
  "foroId" INTEGER NOT NULL,
  "categoriaId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "foro_categorias_pkey" PRIMARY KEY ("foroId", "categoriaId")
);

ALTER TABLE "foro_categorias"
ADD CONSTRAINT "foro_categorias_foroId_fkey"
FOREIGN KEY ("foroId") REFERENCES "foros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "foro_categorias"
ADD CONSTRAINT "foro_categorias_categoriaId_fkey"
FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "foro_categorias" ("foroId", "categoriaId", "createdAt")
SELECT "id", "categoriaId", CURRENT_TIMESTAMP
FROM "foros"
ON CONFLICT DO NOTHING;

ALTER TABLE "recursos" ADD COLUMN "comentarioForoId" INTEGER;

ALTER TABLE "recursos"
ADD CONSTRAINT "recursos_comentarioForoId_fkey"
FOREIGN KEY ("comentarioForoId") REFERENCES "comentarios_foro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
