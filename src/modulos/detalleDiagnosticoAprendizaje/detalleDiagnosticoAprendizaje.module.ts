import { Module } from '@nestjs/common';
import { DetalleDiagnosticoAprendizajeController } from './controladores/detalleDiagnosticoAprendizaje.controller';
import { DetalleDiagnosticoAprendizajeService } from './servicios/detalleDiagnosticoAprendizaje.service';

@Module({
  controllers: [DetalleDiagnosticoAprendizajeController],
  providers: [DetalleDiagnosticoAprendizajeService],
})
export class DetalleDiagnosticoAprendizajeModule {}