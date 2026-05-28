import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecursoController } from './controladores/recurso.controller';
import { ExtractorTextoRecursoService } from './servicios/extractor-texto-recurso.service';
import { RecursoService } from './servicios/recurso.service';
import { ResumenIaRecursoService } from './servicios/resumen-ia-recurso.service';

@Module({
  imports: [AuthModule],
  controllers: [RecursoController],
  providers: [
    RecursoService,
    ExtractorTextoRecursoService,
    ResumenIaRecursoService,
  ],
  exports: [RecursoService, ExtractorTextoRecursoService],
})
export class RecursoModule {}
