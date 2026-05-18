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

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_colaborativo_integrantes_proyectoId_usuarioId_key" ON "proyecto_colaborativo_integrantes"("proyectoId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_colaborativo_entregas_recursoId_key" ON "proyecto_colaborativo_entregas"("recursoId");

-- AddForeignKey
ALTER TABLE "proyectos_colaborativos" ADD CONSTRAINT "proyectos_colaborativos_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "instituciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_colaborativos" ADD CONSTRAINT "proyectos_colaborativos_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_colaborativos" ADD CONSTRAINT "proyectos_colaborativos_gradoEscolarId_fkey" FOREIGN KEY ("gradoEscolarId") REFERENCES "grados_escolares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_colaborativos" ADD CONSTRAINT "proyectos_colaborativos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_integrantes" ADD CONSTRAINT "proyecto_colaborativo_integrantes_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos_colaborativos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_integrantes" ADD CONSTRAINT "proyecto_colaborativo_integrantes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_actividades" ADD CONSTRAINT "proyecto_colaborativo_actividades_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos_colaborativos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_actividades" ADD CONSTRAINT "proyecto_colaborativo_actividades_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_actividades" ADD CONSTRAINT "proyecto_colaborativo_actividades_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_evidencias" ADD CONSTRAINT "proyecto_colaborativo_evidencias_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "proyecto_colaborativo_actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_evidencias" ADD CONSTRAINT "proyecto_colaborativo_evidencias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_entregas" ADD CONSTRAINT "proyecto_colaborativo_entregas_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos_colaborativos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_entregas" ADD CONSTRAINT "proyecto_colaborativo_entregas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_colaborativo_entregas" ADD CONSTRAINT "proyecto_colaborativo_entregas_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
