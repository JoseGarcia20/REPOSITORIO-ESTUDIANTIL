-- Evita registros huérfanos antes de agregar la relación formal.
DELETE FROM "resumenes_ia_recursos" resumen
WHERE NOT EXISTS (
  SELECT 1 FROM "recursos" recurso WHERE recurso."id" = resumen."recursoId"
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resumenes_ia_recursos_recursoId_fkey'
  ) THEN
    ALTER TABLE "resumenes_ia_recursos"
      ADD CONSTRAINT "resumenes_ia_recursos_recursoId_fkey"
      FOREIGN KEY ("recursoId") REFERENCES "recursos"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "usuarios_institucionId_idx" ON "usuarios"("institucionId");
CREATE INDEX IF NOT EXISTS "usuarios_rolId_idx" ON "usuarios"("rolId");
CREATE INDEX IF NOT EXISTS "usuarios_gradoEscolarId_idx" ON "usuarios"("gradoEscolarId");
CREATE INDEX IF NOT EXISTS "usuarios_activo_idx" ON "usuarios"("activo");
CREATE INDEX IF NOT EXISTS "usuarios_institucionId_rolId_idx" ON "usuarios"("institucionId", "rolId");

CREATE INDEX IF NOT EXISTS "recursos_institucionId_idx" ON "recursos"("institucionId");
CREATE INDEX IF NOT EXISTS "recursos_categoriaId_idx" ON "recursos"("categoriaId");
CREATE INDEX IF NOT EXISTS "recursos_tipoRecursoId_idx" ON "recursos"("tipoRecursoId");
CREATE INDEX IF NOT EXISTS "recursos_usuarioCreadorId_idx" ON "recursos"("usuarioCreadorId");
CREATE INDEX IF NOT EXISTS "recursos_gradoEscolarId_idx" ON "recursos"("gradoEscolarId");
CREATE INDEX IF NOT EXISTS "recursos_publicado_estado_idx" ON "recursos"("publicado", "estado");
CREATE INDEX IF NOT EXISTS "recursos_createdAt_idx" ON "recursos"("createdAt");

CREATE INDEX IF NOT EXISTS "foros_institucionId_idx" ON "foros"("institucionId");
CREATE INDEX IF NOT EXISTS "foros_categoriaId_idx" ON "foros"("categoriaId");
CREATE INDEX IF NOT EXISTS "foros_usuarioId_idx" ON "foros"("usuarioId");
CREATE INDEX IF NOT EXISTS "foros_estado_cerrado_idx" ON "foros"("estado", "cerrado");
CREATE INDEX IF NOT EXISTS "foros_createdAt_idx" ON "foros"("createdAt");

CREATE INDEX IF NOT EXISTS "auditoria_logs_usuarioId_createdAt_idx" ON "auditoria_logs"("usuarioId", "createdAt");
CREATE INDEX IF NOT EXISTS "auditoria_logs_institucionId_createdAt_idx" ON "auditoria_logs"("institucionId", "createdAt");
CREATE INDEX IF NOT EXISTS "auditoria_logs_entidad_entidadId_idx" ON "auditoria_logs"("entidad", "entidadId");
CREATE INDEX IF NOT EXISTS "auditoria_logs_createdAt_idx" ON "auditoria_logs"("createdAt");

CREATE INDEX IF NOT EXISTS "asignaciones_aprendizaje_adaptativo_institucionId_idx" ON "asignaciones_aprendizaje_adaptativo"("institucionId");
CREATE INDEX IF NOT EXISTS "asignaciones_aprendizaje_adaptativo_docenteId_idx" ON "asignaciones_aprendizaje_adaptativo"("docenteId");
CREATE INDEX IF NOT EXISTS "asignaciones_aprendizaje_adaptativo_estudianteId_idx" ON "asignaciones_aprendizaje_adaptativo"("estudianteId");
CREATE INDEX IF NOT EXISTS "asignaciones_aprendizaje_adaptativo_gradoEscolarId_idx" ON "asignaciones_aprendizaje_adaptativo"("gradoEscolarId");
CREATE INDEX IF NOT EXISTS "asignaciones_aprendizaje_adaptativo_estado_idx" ON "asignaciones_aprendizaje_adaptativo"("estado");
CREATE INDEX IF NOT EXISTS "asignaciones_aprendizaje_adaptativo_fechaLimite_idx" ON "asignaciones_aprendizaje_adaptativo"("fechaLimite");
CREATE INDEX IF NOT EXISTS "asignaciones_aprendizaje_adaptativo_createdAt_idx" ON "asignaciones_aprendizaje_adaptativo"("createdAt");
