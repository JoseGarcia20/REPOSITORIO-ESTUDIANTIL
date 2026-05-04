import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsuarioController } from './controladores/usuario.controller';
import { UsuarioService } from './servicios/usuario.service';

@Module({
  imports: [AuthModule],
  controllers: [UsuarioController],
  providers: [UsuarioService],
})
export class UsuarioModule {}