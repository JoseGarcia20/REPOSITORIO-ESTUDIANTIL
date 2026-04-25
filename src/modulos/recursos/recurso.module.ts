import { Module } from '@nestjs/common';
import { RecursoController } from './controladores/recurso.controller';
import { RecursoService } from './servicios/recurso.service';

@Module({
  controllers: [RecursoController],
  providers: [RecursoService],
})
export class RecursoModule {}