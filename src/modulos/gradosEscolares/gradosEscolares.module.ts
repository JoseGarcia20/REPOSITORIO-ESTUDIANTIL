import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GradosEscolaresController } from './controladores/gradosEscolares.controller';
import { GradosEscolaresService } from './servicios/gradosEscolares.service';

@Module({
  imports: [AuthModule],
  controllers: [GradosEscolaresController],
  providers: [GradosEscolaresService],
})
export class GradosEscolaresModule {}
