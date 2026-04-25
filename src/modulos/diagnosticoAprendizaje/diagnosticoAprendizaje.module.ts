import { Module } from '@nestjs/common';
import { DiagnosticoAprendizajeController } from './controladores/diagnosticoAprendizaje.controller';
import { DiagnosticoAprendizajeService } from './servicios/diagnosticoAprendizaje.service';

@Module({
  controllers: [DiagnosticoAprendizajeController],
  providers: [DiagnosticoAprendizajeService],
})
export class DiagnosticoAprendizajeModule {}