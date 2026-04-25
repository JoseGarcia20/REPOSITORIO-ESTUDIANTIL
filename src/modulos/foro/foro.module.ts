import { Module } from '@nestjs/common';
import { ForoController } from './controladores/foro.controller';
import { ForoService } from './servicios/foro.service';

@Module({
  controllers: [ForoController],
  providers: [ForoService],
})
export class ForoModule {}