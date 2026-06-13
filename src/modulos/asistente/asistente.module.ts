import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecomendacionesModule } from '../recomendaciones/recomendaciones.module';
import { AsistenteController } from './controladores/asistente.controller';
import { AsistenteService } from './servicios/asistente.service';
import { GeminiAsistenteService } from './servicios/gemini-asistente.service';
import { ConversacionService } from './servicios/conversacion.service';
import { BusquedaWebAsistenteService } from './servicios/busqueda-web-asistente.service';

@Module({
  imports: [AuthModule, RecomendacionesModule],
  controllers: [AsistenteController],
  providers: [
    AsistenteService,
    GeminiAsistenteService,
    ConversacionService,
    BusquedaWebAsistenteService,
  ],
})
export class AsistenteModule {}
