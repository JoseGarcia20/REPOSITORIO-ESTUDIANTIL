import { Module } from '@nestjs/common';
import { PrismaModule } from './baseDatos/prisma/prisma.module';
import { InstitucionesModule } from './modulos/instituciones/instituciones.module';

@Module({
  imports: [PrismaModule,InstitucionesModule],
  controllers: [],
  providers: [],
})

export class AppModule {}