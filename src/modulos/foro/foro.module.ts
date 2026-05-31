import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ForoController } from './controladores/foro.controller';
import { ForoService } from './servicios/foro.service';

@Module({
  imports: [AuthModule, AuditoriaModule],
  controllers: [ForoController],
  providers: [ForoService],
})
export class ForoModule {}
