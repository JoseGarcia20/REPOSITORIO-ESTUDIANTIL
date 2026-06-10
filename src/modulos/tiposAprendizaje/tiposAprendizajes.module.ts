import { Module } from '@nestjs/common';
import { TiposAprendizajeController } from './controladores/tiposAprendizaje.controller';
import { TiposAprendizajeService } from './servicios/tiposAprendizaje.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TiposAprendizajeController],
  providers: [TiposAprendizajeService],
})
export class TiposAprendizajeModule {}
