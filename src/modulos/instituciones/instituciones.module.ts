import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { InstitucionesController } from './controladores/instituciones.controller';
import { InstitucionesService } from './servicios/instituciones.service';

@Module({
  imports: [AuthModule, AuditoriaModule],
  controllers: [InstitucionesController],
  providers: [InstitucionesService],
})
export class InstitucionesModule {}