import { Module } from '@nestjs/common';
import { TiposAprendizajeController } from './controladores/tiposAprendizaje.controller';
import { TiposAprendizajeService } from './servicios/tiposAprendizaje.service';

@Module({
  controllers: [TiposAprendizajeController],
  providers: [TiposAprendizajeService],
})
export class TiposAprendizajeModule {}