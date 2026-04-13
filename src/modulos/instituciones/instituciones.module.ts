import { Module } from '@nestjs/common';
import { InstitucionesController } from './controladores/instituciones.controller';
import { InstitucionesService } from './servicios/instituciones.service';

@Module({
  controllers: [InstitucionesController],
  providers: [InstitucionesService],
})
export class InstitucionesModule {}