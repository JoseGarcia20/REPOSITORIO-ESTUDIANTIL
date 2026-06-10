import { Module } from '@nestjs/common';
import { RutaAprendizajeController } from './controladores/rutaAprendizaje.controller';
import { RutaAprendizajeService } from './servicios/rutaAprendizaje.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RutaAprendizajeController],
  providers: [RutaAprendizajeService],
})
export class RutaAprendizajeModule {}
