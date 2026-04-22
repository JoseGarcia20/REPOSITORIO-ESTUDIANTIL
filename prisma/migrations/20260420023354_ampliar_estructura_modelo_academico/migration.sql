-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "foto" DROP NOT NULL;

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

    CONSTRAINT "foros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_foro" (
    "id" SERIAL NOT NULL,
    "contenido" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "foroId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "respuestas_foro_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "recursos_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "calificaciones_recurso_usuarioId_recursoId_key" ON "calificaciones_recurso"("usuarioId", "recursoId");

-- CreateIndex
CREATE UNIQUE INDEX "detalles_diagnostico_aprendizaje_diagnosticoAprendizajeId_t_key" ON "detalles_diagnostico_aprendizaje"("diagnosticoAprendizajeId", "tipoAprendizajeId");

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foros" ADD CONSTRAINT "foros_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foros" ADD CONSTRAINT "foros_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foros" ADD CONSTRAINT "foros_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_foro" ADD CONSTRAINT "respuestas_foro_foroId_fkey" FOREIGN KEY ("foroId") REFERENCES "foros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_foro" ADD CONSTRAINT "respuestas_foro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_tipoRecursoId_fkey" FOREIGN KEY ("tipoRecursoId") REFERENCES "tipos_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones_recurso" ADD CONSTRAINT "calificaciones_recurso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones_recurso" ADD CONSTRAINT "calificaciones_recurso_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas_aprendizaje" ADD CONSTRAINT "rutas_aprendizaje_tipoAprendizajeId_fkey" FOREIGN KEY ("tipoAprendizajeId") REFERENCES "tipos_aprendizaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_ruta_aprendizaje" ADD CONSTRAINT "detalles_ruta_aprendizaje_rutaAprendizajeId_fkey" FOREIGN KEY ("rutaAprendizajeId") REFERENCES "rutas_aprendizaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_ruta_aprendizaje" ADD CONSTRAINT "detalles_ruta_aprendizaje_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_ruta_aprendizaje" ADD CONSTRAINT "asignaciones_ruta_aprendizaje_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_ruta_aprendizaje" ADD CONSTRAINT "asignaciones_ruta_aprendizaje_rutaAprendizajeId_fkey" FOREIGN KEY ("rutaAprendizajeId") REFERENCES "rutas_aprendizaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_aprendizaje" ADD CONSTRAINT "diagnosticos_aprendizaje_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_aprendizaje" ADD CONSTRAINT "diagnosticos_aprendizaje_tipoAprendizajeId_fkey" FOREIGN KEY ("tipoAprendizajeId") REFERENCES "tipos_aprendizaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_diagnostico_aprendizaje" ADD CONSTRAINT "detalles_diagnostico_aprendizaje_diagnosticoAprendizajeId_fkey" FOREIGN KEY ("diagnosticoAprendizajeId") REFERENCES "diagnosticos_aprendizaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_diagnostico_aprendizaje" ADD CONSTRAINT "detalles_diagnostico_aprendizaje_tipoAprendizajeId_fkey" FOREIGN KEY ("tipoAprendizajeId") REFERENCES "tipos_aprendizaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
