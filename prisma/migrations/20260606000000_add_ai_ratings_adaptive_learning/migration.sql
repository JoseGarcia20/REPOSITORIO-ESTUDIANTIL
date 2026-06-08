ALTER TABLE "asignaciones_aprendizaje_adaptativo"
ADD COLUMN "calificacionEstudianteIA" INTEGER,
ADD COLUMN "comentarioEstudianteIA" TEXT,
ADD COLUMN "fechaCalificacionEstudianteIA" TIMESTAMP(3),
ADD COLUMN "calificacionDocenteIA" INTEGER,
ADD COLUMN "comentarioDocenteIA" TEXT,
ADD COLUMN "fechaCalificacionDocenteIA" TIMESTAMP(3);
