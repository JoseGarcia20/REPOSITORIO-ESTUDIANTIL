ALTER TABLE "foros"
ADD COLUMN "publico" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cerrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "fechaCierre" TIMESTAMP(3);

CREATE TABLE "comentarios_foro" (
  "id" SERIAL NOT NULL,
  "contenido" TEXT NOT NULL,
  "estado" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "foroId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,

  CONSTRAINT "comentarios_foro_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "comentarios_foro"
ADD CONSTRAINT "comentarios_foro_foroId_fkey"
FOREIGN KEY ("foroId") REFERENCES "foros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comentarios_foro"
ADD CONSTRAINT "comentarios_foro_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "permisos" ("codigo", "descripcion", "createdAt", "updatedAt")
VALUES
  ('foros.ver', 'Ver foros académicos disponibles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foros.crear', 'Crear foros académicos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foros.crear_publico', 'Crear foros visibles para todas las instituciones', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foros.comentar', 'Comentar foros académicos publicados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foros.cerrar', 'Cerrar foros para impedir nuevos comentarios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("codigo") DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permisos" p
WHERE LOWER(r."nombre") = 'superadministrador'
  AND p."codigo" IN (
    'foros.ver',
    'foros.crear',
    'foros.crear_publico',
    'foros.comentar',
    'foros.cerrar'
  )
ON CONFLICT DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permisos" p ON p."codigo" IN (
  'foros.ver',
  'foros.crear',
  'foros.crear_publico',
  'foros.comentar',
  'foros.cerrar'
)
WHERE LOWER(r."nombre") IN ('administrador', 'docente')
ON CONFLICT DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permisos" p ON p."codigo" IN (
  'foros.ver',
  'foros.crear',
  'foros.comentar',
  'foros.cerrar'
)
WHERE LOWER(r."nombre") = 'estudiante'
ON CONFLICT DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permisos" p ON p."codigo" IN (
  'foros.ver',
  'foros.comentar'
)
WHERE LOWER(r."nombre") = 'usuario administrativo'
ON CONFLICT DO NOTHING;
