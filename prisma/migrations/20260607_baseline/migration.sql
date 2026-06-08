-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "instituciones" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "sitioWeb" TEXT,
    "logo" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instituciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permisos" (
    "rolId" INTEGER NOT NULL,
    "permisoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("rolId","permisoId")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "fechaNacimiento" DATE NOT NULL,
    "genero" TEXT NOT NULL,
    "foto" TEXT,
    "contrasena" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcceso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institucionId" INTEGER NOT NULL,
    "rolId" INTEGER NOT NULL,
    "gradoEscolarId" INTEGER,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grados_escolares" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grados_escolares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "color" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institucionId" INTEGER NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foros" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institucionId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    "fechaCierre" TIMESTAMP(3),

    CONSTRAINT "foros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foro_categorias" (
    "foroId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foro_categorias_pkey" PRIMARY KEY ("foroId","categoriaId")
);

-- CreateTable
CREATE TABLE "comentarios_foro" (
    "id" SERIAL NOT NULL,
    "contenido" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "foroId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "comentarios_foro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_recurso" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "icono" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recursos" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "palabrasClave" TEXT,
    "contenidoResumen" TEXT,
    "rutaRecurso" TEXT,
    "urlRecurso" TEXT,
    "fuente" TEXT,
    "autorNombre" TEXT,
    "nivelAcademico" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institucionId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "tipoRecursoId" INTEGER NOT NULL,
    "usuarioCreadorId" INTEGER NOT NULL,
    "gradoEscolarId" INTEGER,
    "foroOrigenId" INTEGER,
    "comentarioForoId" INTEGER,

    CONSTRAINT "recursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumenes_ia_recursos" (
    "recursoId" INTEGER NOT NULL,
    "resumen" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "extension" TEXT,
    "caracteresAnalizados" INTEGER NOT NULL DEFAULT 0,
    "advertencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumenes_ia_recursos_pkey" PRIMARY KEY ("recursoId")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "comentarios_foro_recursos" (
    "comentarioForoId" INTEGER NOT NULL,
    "recursoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_foro_recursos_pkey" PRIMARY KEY ("comentarioForoId","recursoId")
);

-- CreateTable
CREATE TABLE "proyectos_colaborativos" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "curso" TEXT,
    "instrucciones" TEXT,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "comentariosCierre" TEXT,
    "calificacion" DOUBLE PRECISION,
    "fechaCierre" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institucionId" INTEGER NOT NULL,
    "docenteId" INTEGER NOT NULL,
    "gradoEscolarId" INTEGER,
    "categoriaId" INTEGER,

    CONSTRAINT "proyectos_colaborativos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyecto_colaborativo_integrantes" (
    "id" SERIAL NOT NULL,
    "rolProyecto" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proyectoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "proyecto_colaborativo_integrantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyecto_colaborativo_actividades" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fechaLimite" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proyectoId" INTEGER NOT NULL,
    "responsableId" INTEGER,
    "creadorId" INTEGER NOT NULL,

    CONSTRAINT "proyecto_colaborativo_actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyecto_colaborativo_evidencias" (
    "id" SERIAL NOT NULL,
    "comentario" TEXT,
    "rutaArchivo" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "mimeType" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "proyecto_colaborativo_evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyecto_colaborativo_entregas" (
    "id" SERIAL NOT NULL,
    "comentario" TEXT,
    "rutaArchivo" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "mimeType" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'entregada',
    "calificacion" DOUBLE PRECISION,
    "comentariosDocente" TEXT,
    "fechaRevision" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proyectoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "recursoId" INTEGER,

    CONSTRAINT "proyecto_colaborativo_entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" BIGSERIAL NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" INTEGER,
    "accion" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "institucionId" INTEGER,
    "detalles" JSONB,
    "direccionIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calificaciones_recurso" (
    "id" SERIAL NOT NULL,
    "calificacion" DOUBLE PRECISION NOT NULL,
    "comentario" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "recursoId" INTEGER NOT NULL,

    CONSTRAINT "calificaciones_recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_aprendizaje" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_aprendizaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estrategias_aprendizaje" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estrategias_aprendizaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_aprendizaje_estrategias" (
    "tipoAprendizajeId" INTEGER NOT NULL,
    "estrategiaId" INTEGER NOT NULL,
    "pesoSugerido" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipo_aprendizaje_estrategias_pkey" PRIMARY KEY ("tipoAprendizajeId","estrategiaId")
);

-- CreateTable
CREATE TABLE "rutas_aprendizaje" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "temaObjetivo" TEXT NOT NULL,
    "nivelDificultad" TEXT NOT NULL,
    "duracionEstimada" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tipoAprendizajeId" INTEGER NOT NULL,

    CONSTRAINT "rutas_aprendizaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_ruta_aprendizaje" (
    "id" SERIAL NOT NULL,
    "orden" INTEGER NOT NULL,
    "tituloPaso" TEXT NOT NULL,
    "tipoPaso" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rutaAprendizajeId" INTEGER NOT NULL,
    "recursoId" INTEGER,

    CONSTRAINT "detalles_ruta_aprendizaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_ruta_aprendizaje" (
    "id" SERIAL NOT NULL,
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL,
    "porcentajeAvance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaInicio" TIMESTAMP(3),
    "fechaFinalizacion" TIMESTAMP(3),
    "calificacionObtenida" DOUBLE PRECISION,
    "temaSolicitado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "rutaAprendizajeId" INTEGER NOT NULL,

    CONSTRAINT "asignaciones_ruta_aprendizaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos_aprendizaje" (
    "id" SERIAL NOT NULL,
    "puntajeFinal" DOUBLE PRECISION NOT NULL,
    "resultadoFinal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipoAprendizajeId" INTEGER NOT NULL,

    CONSTRAINT "diagnosticos_aprendizaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_diagnostico_aprendizaje" (
    "id" SERIAL NOT NULL,
    "puntaje" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "diagnosticoAprendizajeId" INTEGER NOT NULL,
    "tipoAprendizajeId" INTEGER NOT NULL,

    CONSTRAINT "detalles_diagnostico_aprendizaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_aprendizaje_adaptativo" (
    "id" SERIAL NOT NULL,
    "tema" TEXT NOT NULL,
    "objetivo" TEXT,
    "nivelSolicitado" TEXT,
    "tiempoDisponible" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'asignada',
    "entrevistaPreguntas" JSONB,
    "entrevistaRespuestas" JSONB,
    "perfilAprendizaje" JSONB,
    "diagnostico" JSONB,
    "ruta" JSONB,
    "evaluacion" JSONB,
    "respuestasEvaluacion" JSONB,
    "resultadoEvaluacion" JSONB,
    "revisionDocente" JSONB,
    "conclusionesPdf" TEXT,
    "fechaLimite" TIMESTAMP(3),
    "fechaAprobacion" TIMESTAMP(3),
    "fechaRutaGenerada" TIMESTAMP(3),
    "fechaFinalizacion" TIMESTAMP(3),
    "fechaRevision" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institucionId" INTEGER NOT NULL,
    "docenteId" INTEGER NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "gradoEscolarId" INTEGER,
    "calificacionEstudianteIA" INTEGER,
    "comentarioEstudianteIA" TEXT,
    "fechaCalificacionEstudianteIA" TIMESTAMP(3),
    "calificacionDocenteIA" INTEGER,
    "comentarioDocenteIA" TEXT,
    "fechaCalificacionDocenteIA" TIMESTAMP(3),

    CONSTRAINT "asignaciones_aprendizaje_adaptativo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instituciones_codigo_key" ON "instituciones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "instituciones_nit_key" ON "instituciones"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_documento_key" ON "usuarios"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "grados_escolares_nombre_key" ON "grados_escolares"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "grados_escolares_codigo_key" ON "grados_escolares"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "grados_escolares_orden_key" ON "grados_escolares"("orden");

-- CreateIndex
CREATE INDEX "calificaciones_uso_ia_modulo_funcionalidad_idx" ON "calificaciones_uso_ia"("modulo", "funcionalidad");

-- CreateIndex
CREATE INDEX "calificaciones_uso_ia_entidadTipo_entidadId_idx" ON "calificaciones_uso_ia"("entidadTipo", "entidadId");

-- CreateIndex
CREATE INDEX "calificaciones_uso_ia_usuarioId_createdAt_idx" ON "calificaciones_uso_ia"("usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "calificaciones_uso_ia_institucionId_createdAt_idx" ON "calificaciones_uso_ia"("institucionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_colaborativo_integrantes_proyectoId_usuarioId_key" ON "proyecto_colaborativo_integrantes"("proyectoId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_colaborativo_entregas_recursoId_key" ON "proyecto_colaborativo_entregas"("recursoId");

-- CreateIndex
CREATE UNIQUE INDEX "calificaciones_recurso_usuarioId_recursoId_key" ON "calificaciones_recurso"("usuarioId", "recursoId");

-- CreateIndex
CREATE UNIQUE INDEX "estrategias_aprendizaje_nombre_key" ON "estrategias_aprendizaje"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "detalles_diagnostico_aprendizaje_diagnosticoAprendizajeId_t_key" ON "detalles_diagnostico_aprendizaje"("diagnosticoAprendizajeId", "tipoAprendizajeId");

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_gradoEscolarId_fkey" FOREIGN KEY ("gradoEscolarId") REFERENCES "grados_escolares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foros" ADD CONSTRAINT "foros_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foros" ADD CONSTRAINT "foros_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foros" ADD CONSTRAINT "foros_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foro_categorias" ADD CONSTRAINT "foro_categorias_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foro_categorias" ADD CONSTRAINT "foro_categorias_foroId_fkey" FOREIGN KEY ("foroId") REFERENCES "foros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_foroId_fkey" FOREIGN KEY ("foroId") REFERENCES "foros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_foro" ADD CONSTRAINT "comentarios_foro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_comentarioForoId_fkey" FOREIGN KEY ("comentarioForoId") REFERENCES "comentarios_foro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_foroOrigenId_fkey" FOREIGN KEY ("foroOrigenId") REFERENCES "foros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_gradoEscolarId_fkey" FOREIGN KEY ("gradoEscolarId") REFERENCES "grados_escolares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_tipoRecursoId_fkey" FOREIGN KEY ("tipoRecursoId") REFERENCES "tipos_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones_uso_ia" ADD CONSTRAINT "calificaciones_uso_ia_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones_uso_ia" ADD CONSTRAINT "calificaciones_uso_ia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_foro_recursos" ADD CONSTRAINT "comentarios_foro_recursos_comentarioForoId_fkey" FOREIGN KEY ("comentarioForoId") REFERENCES "comentarios_foro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_foro_recursos" ADD CONSTRAINT "comentarios_foro_recursos_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_colaborativos" ADD CONSTRAINT "proyectos_colaborativos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_colaborativos" ADD CONSTRAINT "proyectos_colaborativos_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_colaborativos" ADD CONSTRAINT "proyectos_colaborativos_gradoEscolarId_fkey" FOREIGN KEY ("gradoEscolarId") REFERENCES "grados_escolares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_colaborativos" ADD CONSTRAINT "proyectos_colaborativos_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_integrantes" ADD CONSTRAINT "proyecto_colaborativo_integrantes_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos_colaborativos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_integrantes" ADD CONSTRAINT "proyecto_colaborativo_integrantes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_actividades" ADD CONSTRAINT "proyecto_colaborativo_actividades_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_actividades" ADD CONSTRAINT "proyecto_colaborativo_actividades_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos_colaborativos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_actividades" ADD CONSTRAINT "proyecto_colaborativo_actividades_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_evidencias" ADD CONSTRAINT "proyecto_colaborativo_evidencias_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "proyecto_colaborativo_actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_evidencias" ADD CONSTRAINT "proyecto_colaborativo_evidencias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_entregas" ADD CONSTRAINT "proyecto_colaborativo_entregas_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos_colaborativos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_entregas" ADD CONSTRAINT "proyecto_colaborativo_entregas_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_entregas" ADD CONSTRAINT "proyecto_colaborativo_entregas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones_recurso" ADD CONSTRAINT "calificaciones_recurso_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones_recurso" ADD CONSTRAINT "calificaciones_recurso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipo_aprendizaje_estrategias" ADD CONSTRAINT "tipo_aprendizaje_estrategias_estrategiaId_fkey" FOREIGN KEY ("estrategiaId") REFERENCES "estrategias_aprendizaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipo_aprendizaje_estrategias" ADD CONSTRAINT "tipo_aprendizaje_estrategias_tipoAprendizajeId_fkey" FOREIGN KEY ("tipoAprendizajeId") REFERENCES "tipos_aprendizaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas_aprendizaje" ADD CONSTRAINT "rutas_aprendizaje_tipoAprendizajeId_fkey" FOREIGN KEY ("tipoAprendizajeId") REFERENCES "tipos_aprendizaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_ruta_aprendizaje" ADD CONSTRAINT "detalles_ruta_aprendizaje_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_ruta_aprendizaje" ADD CONSTRAINT "detalles_ruta_aprendizaje_rutaAprendizajeId_fkey" FOREIGN KEY ("rutaAprendizajeId") REFERENCES "rutas_aprendizaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_ruta_aprendizaje" ADD CONSTRAINT "asignaciones_ruta_aprendizaje_rutaAprendizajeId_fkey" FOREIGN KEY ("rutaAprendizajeId") REFERENCES "rutas_aprendizaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_ruta_aprendizaje" ADD CONSTRAINT "asignaciones_ruta_aprendizaje_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_aprendizaje" ADD CONSTRAINT "diagnosticos_aprendizaje_tipoAprendizajeId_fkey" FOREIGN KEY ("tipoAprendizajeId") REFERENCES "tipos_aprendizaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_aprendizaje" ADD CONSTRAINT "diagnosticos_aprendizaje_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_diagnostico_aprendizaje" ADD CONSTRAINT "detalles_diagnostico_aprendizaje_diagnosticoAprendizajeId_fkey" FOREIGN KEY ("diagnosticoAprendizajeId") REFERENCES "diagnosticos_aprendizaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_diagnostico_aprendizaje" ADD CONSTRAINT "detalles_diagnostico_aprendizaje_tipoAprendizajeId_fkey" FOREIGN KEY ("tipoAprendizajeId") REFERENCES "tipos_aprendizaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_aprendizaje_adaptativo" ADD CONSTRAINT "asignaciones_aprendizaje_adaptativo_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_aprendizaje_adaptativo" ADD CONSTRAINT "asignaciones_aprendizaje_adaptativo_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_aprendizaje_adaptativo" ADD CONSTRAINT "asignaciones_aprendizaje_adaptativo_gradoEscolarId_fkey" FOREIGN KEY ("gradoEscolarId") REFERENCES "grados_escolares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_aprendizaje_adaptativo" ADD CONSTRAINT "asignaciones_aprendizaje_adaptativo_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

