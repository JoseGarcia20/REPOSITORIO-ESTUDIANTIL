import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AsistenteController } from './controladores/asistente.controller';
import { AsistenteService } from './servicios/asistente.service';

@Module({
  imports: [AuthModule],
  controllers: [AsistenteController],
  providers: [AsistenteService],
})
export class AsistenteModule {}
