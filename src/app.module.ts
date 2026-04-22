import { Module } from '@nestjs/common';
import { PrismaModule } from './baseDatos/prisma/prisma.module';
import { InstitucionesModule } from './modulos/instituciones/instituciones.module';
import { UsuarioModule } from './modulos/usuarios/usuario.module';
import { RolesModule } from './modulos/roles/roles.module';
import { CategoriasModule } from './modulos/categorias/categorias.module';
import { TiposAprendizajeModule } from './modulos/tiposAprendizaje/tiposAprendizajes.module';

@Module({
  imports: [PrismaModule,InstitucionesModule,UsuarioModule,RolesModule,CategoriasModule,TiposAprendizajeModule],
  controllers: [],
  providers: [],
})

export class AppModule {}