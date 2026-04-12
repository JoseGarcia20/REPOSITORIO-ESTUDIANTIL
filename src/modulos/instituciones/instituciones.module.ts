import { Module } from '@nestjs/common';
import { InstitucionesService } from './servicios/instituciones/instituciones.service';

@Module({
  providers: [InstitucionesService]
})
export class InstitucionesModule {}
