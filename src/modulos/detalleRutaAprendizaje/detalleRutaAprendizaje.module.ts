import { Module } from '@nestjs/common';
import { DetalleRutaAprendizajeController } from './controladores/detalleRutaAprendizaje.controller';
import { DetalleRutaAprendizajeService } from './servicios/detalleRutaAprendizaje.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DetalleRutaAprendizajeController],
  providers: [DetalleRutaAprendizajeService],
})
export class DetalleRutaAprendizajeModule {}
