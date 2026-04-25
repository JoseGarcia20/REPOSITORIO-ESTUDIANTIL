import { Module } from '@nestjs/common';
import { TiposRecursosController } from './controladores/tiposRecursos.controller';
import { TiposRecursosService } from './servicios/tiposRecursos.service';

@Module({
  controllers: [TiposRecursosController],
  providers: [TiposRecursosService],
})
export class TiposRecursosModule {}