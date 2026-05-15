CREATE TABLE "grados_escolares" (
  "id" SERIAL NOT NULL,
  "nombre" TEXT NOT NULL,
  "codigo" TEXT NOT NULL,
  "orden" INTEGER NOT NULL,
  "estado" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "grados_escolares_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "grados_escolares_nombre_key" ON "grados_escolares"("nombre");
CREATE UNIQUE INDEX "grados_escolares_codigo_key" ON "grados_escolares"("codigo");
CREATE UNIQUE INDEX "grados_escolares_orden_key" ON "grados_escolares"("orden");

INSERT INTO "grados_escolares" ("nombre", "codigo", "orden", "estado", "createdAt", "updatedAt")
VALUES
  ('Sexto', 'SEXTO', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Séptimo', 'SEPTIMO', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Octavo', 'OCTAVO', 8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Noveno', 'NOVENO', 9, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Décimo', 'DECIMO', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Once', 'ONCE', 11, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("codigo") DO NOTHING;

ALTER TABLE "usuarios" ADD COLUMN "gradoEscolarId" INTEGER;
ALTER TABLE "recursos" ADD COLUMN "gradoEscolarId" INTEGER;

ALTER TABLE "usuarios"
ADD CONSTRAINT "usuarios_gradoEscolarId_fkey"
FOREIGN KEY ("gradoEscolarId") REFERENCES "grados_escolares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "recursos"
ADD CONSTRAINT "recursos_gradoEscolarId_fkey"
FOREIGN KEY ("gradoEscolarId") REFERENCES "grados_escolares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "recursos" r
SET "gradoEscolarId" = g."id"
FROM "grados_escolares" g
WHERE LOWER(TRIM(COALESCE(r."nivelAcademico", ''))) IN (
  LOWER(g."nombre"),
  LOWER(g."codigo")
)
OR (
  g."codigo" = 'SEXTO'
  AND LOWER(TRIM(COALESCE(r."nivelAcademico", ''))) IN ('6', '6°', 'sexto grado', 'grado sexto')
)
OR (
  g."codigo" = 'SEPTIMO'
  AND LOWER(TRIM(COALESCE(r."nivelAcademico", ''))) IN ('7', '7°', 'septimo', 'séptimo grado', 'septimo grado', 'grado septimo', 'grado séptimo')
)
OR (
  g."codigo" = 'OCTAVO'
  AND LOWER(TRIM(COALESCE(r."nivelAcademico", ''))) IN ('8', '8°', 'octavo grado', 'grado octavo')
)
OR (
  g."codigo" = 'NOVENO'
  AND LOWER(TRIM(COALESCE(r."nivelAcademico", ''))) IN ('9', '9°', 'noveno grado', 'grado noveno')
)
OR (
  g."codigo" = 'DECIMO'
  AND LOWER(TRIM(COALESCE(r."nivelAcademico", ''))) IN ('10', '10°', 'decimo', 'décimo grado', 'decimo grado', 'grado decimo', 'grado décimo')
)
OR (
  g."codigo" = 'ONCE'
  AND LOWER(TRIM(COALESCE(r."nivelAcademico", ''))) IN ('11', '11°', 'once grado', 'grado once')
);

INSERT INTO "permisos" ("codigo", "descripcion", "createdAt", "updatedAt")
VALUES
  ('recursos.ver_todos_grados', 'Ver recursos publicados de todos los grados escolares', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("codigo") DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permisos" p ON p."codigo" = 'recursos.ver_todos_grados'
WHERE LOWER(r."nombre") IN (
  'superadministrador',
  'administrador',
  'administrador institucional',
  'docente',
  'usuario administrativo'
)
ON CONFLICT DO NOTHING;
