import { Module } from '@nestjs/common';
import { RutaAprendizajeController } from './controladores/rutaAprendizaje.controller';
import { RutaAprendizajeService } from './servicios/rutaAprendizaje.service';

@Module({
  controllers: [RutaAprendizajeController],
  providers: [RutaAprendizajeService],
})
export class RutaAprendizajeModule {}