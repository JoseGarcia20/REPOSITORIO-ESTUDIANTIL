import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecursoModule } from '../recursos/recurso.module';
import { PreparadorIaController } from './controladores/preparador-ia.controller';
import { PreparadorIaService } from './servicios/preparador-ia.service';

@Module({
  imports: [AuthModule, RecursoModule],
  controllers: [PreparadorIaController],
  providers: [PreparadorIaService],
})
export class PreparadorIaModule {}
