import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AprendizajeAdaptativoController } from './controladores/aprendizaje-adaptativo.controller';
import { AprendizajeAdaptativoService } from './servicios/aprendizaje-adaptativo.service';
import { CorreoAprendizajeAdaptativoService } from './servicios/correo-aprendizaje-adaptativo.service';

@Module({
  imports: [AuthModule, AuditoriaModule],
  controllers: [AprendizajeAdaptativoController],
  providers: [AprendizajeAdaptativoService, CorreoAprendizajeAdaptativoService],
})
export class AprendizajeAdaptativoModule {}
