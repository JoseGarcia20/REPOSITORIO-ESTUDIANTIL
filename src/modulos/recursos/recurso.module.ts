import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecursoController } from './controladores/recurso.controller';
import { RecursoService } from './servicios/recurso.service';

@Module({
  imports: [AuthModule],
  controllers: [RecursoController],
  providers: [RecursoService],
  exports: [RecursoService],
})
export class RecursoModule {}
