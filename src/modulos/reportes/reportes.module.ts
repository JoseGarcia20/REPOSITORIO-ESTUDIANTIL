import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReportesController } from './controladores/reportes.controller';
import { ReportesService } from './servicios/reportes.service';

@Module({
  imports: [AuthModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
