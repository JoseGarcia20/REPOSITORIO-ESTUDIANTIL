import { Module } from '@nestjs/common';
import { UsuarioController } from './controladores/usuario.controller';
import { UsuarioService } from './servicios/usuario.service';

@Module({
  controllers: [UsuarioController],
  providers: [UsuarioService],
})
export class UsuarioModule {}