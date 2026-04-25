import { Module } from '@nestjs/common';
import { RespuestaForoController } from './controladores/respuestaForo.controller';
import { RespuestaForoService } from './servicios/respuestaForo.service';

@Module({
  controllers: [RespuestaForoController],
  providers: [RespuestaForoService],
})
export class RespuestaForoModule {}