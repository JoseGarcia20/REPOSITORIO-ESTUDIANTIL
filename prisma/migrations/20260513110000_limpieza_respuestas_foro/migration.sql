DO $$
BEGIN
  IF to_regclass('public.respuestas_foro') IS NOT NULL THEN
    INSERT INTO "comentarios_foro" (
      "contenido",
      "estado",
      "createdAt",
      "updatedAt",
      "foroId",
      "usuarioId"
    )
    SELECT
      respuesta."contenido",
      respuesta."estado",
      respuesta."createdAt",
      respuesta."updatedAt",
      respuesta."foroId",
      respuesta."usuarioId"
    FROM "respuestas_foro" respuesta
    WHERE NOT EXISTS (
      SELECT 1
      FROM "comentarios_foro" comentario
      WHERE comentario."contenido" = respuesta."contenido"
        AND comentario."foroId" = respuesta."foroId"
        AND comentario."usuarioId" = respuesta."usuarioId"
        AND comentario."createdAt" = respuesta."createdAt"
    );
  END IF;
END $$;

DROP TABLE IF EXISTS "respuestas_foro";
