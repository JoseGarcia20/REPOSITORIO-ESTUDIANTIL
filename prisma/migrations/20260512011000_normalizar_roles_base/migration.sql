-- Normaliza roles existentes a los nombres base oficiales sin perder usuarios ni permisos.
-- PostgreSQL permite valores únicos que difieren solo en mayúsculas/minúsculas, por eso
-- esta migración fusiona duplicados creados durante la transición a RBAC.

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT keep."id", rp."permisoId"
FROM "roles" duplicate
JOIN "roles" keep ON keep."nombre" = 'Superadministrador'
JOIN "rol_permisos" rp ON rp."rolId" = duplicate."id"
WHERE duplicate."nombre" = 'superadministrador'
ON CONFLICT DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT keep."id", rp."permisoId"
FROM "roles" duplicate
JOIN "roles" keep ON keep."nombre" = 'Administrador'
JOIN "rol_permisos" rp ON rp."rolId" = duplicate."id"
WHERE duplicate."nombre" = 'administrador'
ON CONFLICT DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT keep."id", rp."permisoId"
FROM "roles" duplicate
JOIN "roles" keep ON keep."nombre" = 'Docente'
JOIN "rol_permisos" rp ON rp."rolId" = duplicate."id"
WHERE duplicate."nombre" = 'docente'
ON CONFLICT DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT keep."id", rp."permisoId"
FROM "roles" duplicate
JOIN "roles" keep ON keep."nombre" = 'Estudiante'
JOIN "rol_permisos" rp ON rp."rolId" = duplicate."id"
WHERE duplicate."nombre" = 'estudiante'
ON CONFLICT DO NOTHING;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT keep."id", rp."permisoId"
FROM "roles" duplicate
JOIN "roles" keep ON keep."nombre" = 'Empleados Administrativos'
JOIN "rol_permisos" rp ON rp."rolId" = duplicate."id"
WHERE duplicate."nombre" = 'usuario administrativo'
ON CONFLICT DO NOTHING;

DELETE FROM "roles" duplicate
WHERE duplicate."nombre" = 'superadministrador'
  AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u."rolId" = duplicate."id")
  AND EXISTS (SELECT 1 FROM "roles" keep WHERE keep."nombre" = 'Superadministrador');

DELETE FROM "roles" duplicate
WHERE duplicate."nombre" = 'administrador'
  AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u."rolId" = duplicate."id")
  AND EXISTS (SELECT 1 FROM "roles" keep WHERE keep."nombre" = 'Administrador');

DELETE FROM "roles" duplicate
WHERE duplicate."nombre" = 'docente'
  AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u."rolId" = duplicate."id")
  AND EXISTS (SELECT 1 FROM "roles" keep WHERE keep."nombre" = 'Docente');

DELETE FROM "roles" duplicate
WHERE duplicate."nombre" = 'estudiante'
  AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u."rolId" = duplicate."id")
  AND EXISTS (SELECT 1 FROM "roles" keep WHERE keep."nombre" = 'Estudiante');

DELETE FROM "roles" duplicate
WHERE duplicate."nombre" = 'usuario administrativo'
  AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u."rolId" = duplicate."id")
  AND EXISTS (SELECT 1 FROM "roles" keep WHERE keep."nombre" = 'Empleados Administrativos');

UPDATE "roles"
SET "nombre" = 'superadministrador',
    "descripcion" = COALESCE("descripcion", 'Acceso total al sistema'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "nombre" = 'Superadministrador';

UPDATE "roles"
SET "nombre" = 'administrador',
    "descripcion" = COALESCE("descripcion", 'Administrador de una institución'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "nombre" = 'Administrador';

UPDATE "roles"
SET "nombre" = 'docente',
    "descripcion" = COALESCE("descripcion", 'Docente de una institución'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "nombre" = 'Docente';

UPDATE "roles"
SET "nombre" = 'estudiante',
    "descripcion" = COALESCE("descripcion", 'Estudiante de una institución'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "nombre" = 'Estudiante';

UPDATE "roles"
SET "nombre" = 'usuario administrativo',
    "descripcion" = COALESCE("descripcion", 'Usuario administrativo para reportes'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "nombre" = 'Empleados Administrativos';
