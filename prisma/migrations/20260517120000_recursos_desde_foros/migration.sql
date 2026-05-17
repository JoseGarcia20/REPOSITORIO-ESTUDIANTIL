ALTER TABLE "recursos" ADD COLUMN "foroOrigenId" INTEGER;

ALTER TABLE "recursos"
ADD CONSTRAINT "recursos_foroOrigenId_fkey"
FOREIGN KEY ("foroOrigenId") REFERENCES "foros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "permisos" ("codigo", "descripcion", "createdAt", "updatedAt")
VALUES
  ('foros.subir_recurso', 'Subir archivos desde foros y convertirlos en recursos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("codigo") DO UPDATE
SET "descripcion" = EXCLUDED."descripcion",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "rol_permisos" ("rolId", "permisoId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permisos" p ON p."codigo" = 'foros.subir_recurso'
WHERE LOWER(r."nombre") IN (
  'superadministrador',
  'administrador',
  'administrador institucional',
  'docente',
  'usuario administrativo'
)
ON CONFLICT DO NOTHING;
