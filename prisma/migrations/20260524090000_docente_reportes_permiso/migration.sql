INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permisos" p ON p."codigo" = 'reportes.ver'
WHERE r."nombre" = 'docente'
ON CONFLICT DO NOTHING;
