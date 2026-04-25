import { Module } from '@nestjs/common';
import { CalificacionRecursoController } from './controladores/calificacionRecurso.controller';
import { CalificacionRecursoService } from './servicios/calificacionRecurso.service';

@Module({
  controllers: [CalificacionRecursoController],
  providers: [CalificacionRecursoService],
})
export class CalificacionRecursoModule {}