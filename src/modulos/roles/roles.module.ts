import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RolesController } from './controladores/roles.controller';
import { RolesService } from './servicios/roles.service';

@Module({
  imports: [AuthModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}