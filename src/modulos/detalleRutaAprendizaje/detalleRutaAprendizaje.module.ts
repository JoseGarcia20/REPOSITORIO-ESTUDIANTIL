import { Module } from '@nestjs/common';
import { DetalleRutaAprendizajeController } from './controladores/detalleRutaAprendizaje.controller';
import { DetalleRutaAprendizajeService } from './servicios/detalleRutaAprendizaje.service';

@Module({
  controllers: [DetalleRutaAprendizajeController],
  providers: [DetalleRutaAprendizajeService],
})
export class DetalleRutaAprendizajeModule {}