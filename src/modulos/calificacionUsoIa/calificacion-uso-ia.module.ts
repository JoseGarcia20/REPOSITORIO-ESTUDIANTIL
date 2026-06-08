import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AuthModule } from '../auth/auth.module';
import { CalificacionUsoIaController } from './controladores/calificacion-uso-ia.controller';
import { CalificacionUsoIaService } from './servicios/calificacion-uso-ia.service';

@Module({
  imports: [AuthModule, AuditoriaModule],
  controllers: [CalificacionUsoIaController],
  providers: [CalificacionUsoIaService],
  exports: [CalificacionUsoIaService],
})
export class CalificacionUsoIaModule {}
