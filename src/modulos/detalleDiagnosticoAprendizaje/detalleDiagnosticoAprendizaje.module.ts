import { Module } from '@nestjs/common';
import { DetalleDiagnosticoAprendizajeController } from './controladores/detalleDiagnosticoAprendizaje.controller';
import { DetalleDiagnosticoAprendizajeService } from './servicios/detalleDiagnosticoAprendizaje.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DetalleDiagnosticoAprendizajeController],
  providers: [DetalleDiagnosticoAprendizajeService],
})
export class DetalleDiagnosticoAprendizajeModule {}
