import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecomendacionesModule } from '../recomendaciones/recomendaciones.module';
import { AsistenteController } from './controladores/asistente.controller';
import { AsistenteService } from './servicios/asistente.service';

@Module({
  imports: [AuthModule, RecomendacionesModule],
  controllers: [AsistenteController],
  providers: [AsistenteService],
})
export class AsistenteModule {}
