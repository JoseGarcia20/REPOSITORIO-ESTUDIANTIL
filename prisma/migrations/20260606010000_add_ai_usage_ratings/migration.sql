CREATE TABLE "calificaciones_uso_ia" (
  "id" SERIAL NOT NULL,
  "modulo" TEXT NOT NULL,
  "funcionalidad" TEXT NOT NULL,
  "entidadTipo" TEXT,
  "entidadId" INTEGER,
  "calificacion" INTEGER NOT NULL,
  "comentario" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usuarioId" INTEGER NOT NULL,
  "institucionId" INTEGER,

  CONSTRAINT "calificaciones_uso_ia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "calificaciones_uso_ia_modulo_funcionalidad_idx"
  ON "calificaciones_uso_ia"("modulo", "funcionalidad");

CREATE INDEX "calificaciones_uso_ia_entidadTipo_entidadId_idx"
  ON "calificaciones_uso_ia"("entidadTipo", "entidadId");

CREATE INDEX "calificaciones_uso_ia_usuarioId_createdAt_idx"
  ON "calificaciones_uso_ia"("usuarioId", "createdAt");

CREATE INDEX "calificaciones_uso_ia_institucionId_createdAt_idx"
  ON "calificaciones_uso_ia"("institucionId", "createdAt");

ALTER TABLE "calificaciones_uso_ia"
  ADD CONSTRAINT "calificaciones_uso_ia_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "calificaciones_uso_ia"
  ADD CONSTRAINT "calificaciones_uso_ia_institucionId_fkey"
  FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
