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
