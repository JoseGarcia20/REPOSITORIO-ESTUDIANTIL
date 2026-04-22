import { Module } from '@nestjs/common';
import { RolesController } from './controladores/roles.controller';
import { RolesService } from './servicios/roles.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}