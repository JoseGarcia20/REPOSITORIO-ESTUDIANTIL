import { Module } from '@nestjs/common';
import { DiagnosticoAprendizajeController } from './controladores/diagnosticoAprendizaje.controller';
import { DiagnosticoAprendizajeService } from './servicios/diagnosticoAprendizaje.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DiagnosticoAprendizajeController],
  providers: [DiagnosticoAprendizajeService],
})
export class DiagnosticoAprendizajeModule {}
