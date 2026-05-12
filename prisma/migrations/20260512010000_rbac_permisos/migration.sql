-- Roles base oficiales. Se mantiene compatibilidad con "administrador institucional".
INSERT INTO "roles" ("nombre", "descripcion", "estado", "createdAt", "updatedAt")
VALUES
  ('superadministrador', 'Acceso total al sistema', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('administrador', 'Administrador de una institución', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('docente', 'Docente de una institución', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('estudiante', 'Estudiante de una institución', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usuario administrativo', 'Usuario administrativo para reportes', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("nombre") DO NOTHING;

CREATE TABLE "permisos" (
  "id" SERIAL NOT NULL,
  "codigo" TEXT NOT NULL,
  "descripcion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

CREATE TABLE "rol_permisos" (
  "rolId" INTEGER NOT NULL,
  "permisoId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("rolId", "permisoId")
);

ALTER TABLE "rol_permisos"
ADD CONSTRAINT "rol_permisos_rolId_fkey"
FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rol_permisos"
ADD CONSTRAINT "rol_permisos_permisoId_fkey"
FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "permisos" ("codigo", "descripcion", "createdAt", "updatedAt")
VALUES
  ('sistema.total', 'Acceso total sin restricción institucional', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('instituciones.ver', 'Ver instituciones permitidas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('instituciones.crear', 'Crear instituciones', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('instituciones.editar', 'Editar instituciones', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('instituciones.cambiar_estado', 'Inactivar o reactivar instituciones', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('roles.ver', 'Ver roles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('roles.crear', 'Crear roles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('roles.editar', 'Editar roles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('roles.cambiar_estado', 'Inactivar o reactivar roles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usuarios.ver', 'Ver usuarios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usuarios.crear', 'Crear usuarios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usuarios.editar', 'Editar usuarios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usuarios.cambiar_estado', 'Inactivar o reactivar usuarios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('estudiantes.ver', 'Ver estudiantes de la institución', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('categorias.ver', 'Ver categorías', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('categorias.crear', 'Crear categorías', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('categorias.editar', 'Editar categorías', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('categorias.cambiar_estado', 'Inactivar o reactivar categorías', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tipos_recursos.ver', 'Ver tipos de recursos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tipos_recursos.crear', 'Crear tipos de recursos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tipos_recursos.editar', 'Editar tipos de recursos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tipos_recursos.cambiar_estado', 'Inactivar o reactivar tipos de recursos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('recursos.ver', 'Ver recursos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('recursos.crear', 'Crear recursos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('recursos.editar', 'Editar recursos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('recursos.cambiar_estado', 'Inactivar o reactivar recursos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('recursos.subir_archivo', 'Subir archivos de recursos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('reportes.ver', 'Ver reportes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("codigo") DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permisos" p
WHERE LOWER(r."nombre") = 'superadministrador'
ON CONFLICT DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permisos" p ON p."codigo" IN (
  'instituciones.ver',
  'usuarios.ver',
  'usuarios.crear',
  'usuarios.editar',
  'usuarios.cambiar_estado',
  'estudiantes.ver',
  'categorias.ver',
  'categorias.crear',
  'categorias.editar',
  'categorias.cambiar_estado',
  'tipos_recursos.ver',
  'tipos_recursos.crear',
  'tipos_recursos.editar',
  'tipos_recursos.cambiar_estado',
  'recursos.ver',
  'recursos.crear',
  'recursos.editar',
  'recursos.cambiar_estado',
  'recursos.subir_archivo',
  'reportes.ver'
)
WHERE LOWER(r."nombre") IN ('administrador', 'administrador institucional')
ON CONFLICT DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permisos" p ON p."codigo" IN ('recursos.ver', 'estudiantes.ver')
WHERE LOWER(r."nombre") = 'docente'
ON CONFLICT DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permisos" p ON p."codigo" IN ('recursos.ver')
WHERE LOWER(r."nombre") = 'estudiante'
ON CONFLICT DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permisos" p ON p."codigo" IN ('reportes.ver')
WHERE LOWER(r."nombre") = 'usuario administrativo'
ON CONFLICT DO NOTHING;
