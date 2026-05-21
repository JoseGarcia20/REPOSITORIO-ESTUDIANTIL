import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecomendacionesController } from './controladores/recomendaciones.controller';
import { RecomendacionesService } from './servicios/recomendaciones.service';

@Module({
  imports: [AuthModule],
  controllers: [RecomendacionesController],
  providers: [RecomendacionesService],
  exports: [RecomendacionesService],
})
export class RecomendacionesModule {}
