CREATE TABLE "comentarios_foro_recursos" (
  "comentarioForoId" INTEGER NOT NULL,
  "recursoId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "comentarios_foro_recursos_pkey" PRIMARY KEY ("comentarioForoId", "recursoId")
);

ALTER TABLE "comentarios_foro_recursos"
ADD CONSTRAINT "comentarios_foro_recursos_comentarioForoId_fkey"
FOREIGN KEY ("comentarioForoId") REFERENCES "comentarios_foro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comentarios_foro_recursos"
ADD CONSTRAINT "comentarios_foro_recursos_recursoId_fkey"
FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
