import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TiposRecursosController } from './controladores/tiposRecursos.controller';
import { TiposRecursosService } from './servicios/tiposRecursos.service';

@Module({
  imports: [AuthModule],
  controllers: [TiposRecursosController],
  providers: [TiposRecursosService],
})
export class TiposRecursosModule {}