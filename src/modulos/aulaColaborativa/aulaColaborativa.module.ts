import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecursoModule } from '../recursos/recurso.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AulaColaborativaController } from './controladores/aulaColaborativa.controller';
import { AulaColaborativaService } from './servicios/aulaColaborativa.service';

@Module({
  imports: [AuthModule, RecursoModule, AuditoriaModule],
  controllers: [AulaColaborativaController],
  providers: [AulaColaborativaService],
})
export class AulaColaborativaModule {}
