INSERT INTO "permisos" ("codigo", "descripcion", "createdAt", "updatedAt")
VALUES (
  'preparador_ia.usar',
  'Usar el preparador académico con inteligencia artificial',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("codigo") DO UPDATE
SET
  "descripcion" = EXCLUDED."descripcion",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permisos" p ON p."codigo" = 'preparador_ia.usar'
WHERE r."nombre" IN (
  'superadministrador',
  'administrador',
  'docente',
  'usuario administrativo'
)
ON CONFLICT DO NOTHING;
