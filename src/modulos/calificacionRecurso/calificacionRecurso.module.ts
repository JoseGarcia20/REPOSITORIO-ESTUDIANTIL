import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CalificacionRecursoController } from './controladores/calificacionRecurso.controller';
import { CalificacionRecursoService } from './servicios/calificacionRecurso.service';

@Module({
  imports: [AuthModule],
  controllers: [CalificacionRecursoController],
  providers: [CalificacionRecursoService],
})
export class CalificacionRecursoModule {}
