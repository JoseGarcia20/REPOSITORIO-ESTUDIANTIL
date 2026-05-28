import { Module } from '@nestjs/common';
import { AsistenteModule } from './modulos/asistente/asistente.module';
import { PrismaModule } from './baseDatos/prisma/prisma.module';
import { InstitucionesModule } from './modulos/instituciones/instituciones.module';
import { UsuarioModule } from './modulos/usuarios/usuario.module';
import { RolesModule } from './modulos/roles/roles.module';
import { CategoriasModule } from './modulos/categorias/categorias.module';
import { TiposAprendizajeModule } from './modulos/tiposAprendizaje/tiposAprendizajes.module';
import { TiposRecursosModule } from './modulos/tiposRecursos/tiposRecursos.module';
import { RecursoModule } from './modulos/recursos/recurso.module';
import { ForoModule } from './modulos/foro/foro.module';
import { AulaColaborativaModule } from './modulos/aulaColaborativa/aulaColaborativa.module';
import { GradosEscolaresModule } from './modulos/gradosEscolares/gradosEscolares.module';
import { DiagnosticoAprendizajeModule } from './modulos/diagnosticoAprendizaje/diagnosticoAprendizaje.module';
import { RutaAprendizajeModule } from './modulos/rutaAprendizaje/rutaAprendizaje.module';
import { CalificacionRecursoModule } from './modulos/calificacionRecurso/calificacionRecurso.module';
import { DetalleRutaAprendizajeModule } from './modulos/detalleRutaAprendizaje/detalleRutaAprendizaje.module';
import { DetalleDiagnosticoAprendizajeModule } from './modulos/detalleDiagnosticoAprendizaje/detalleDiagnosticoAprendizaje.module';
import { AuthModule } from './modulos/auth/auth.module';
import { RecomendacionesModule } from './modulos/recomendaciones/recomendaciones.module';
import { ReportesModule } from './modulos/reportes/reportes.module';
import { PreparadorIaModule } from './modulos/preparadorIa/preparador-ia.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    AsistenteModule,
    PrismaModule,
    InstitucionesModule,
    AuthModule,
    UsuarioModule,
    RolesModule,
    CategoriasModule,
    TiposAprendizajeModule,
    TiposRecursosModule,
    RecursoModule,
    ForoModule,
    AulaColaborativaModule,
    GradosEscolaresModule,
    DiagnosticoAprendizajeModule,
    RutaAprendizajeModule,
    CalificacionRecursoModule,
    RecomendacionesModule,
    ReportesModule,
    PreparadorIaModule,
    DetalleRutaAprendizajeModule,
    DetalleDiagnosticoAprendizajeModule,
  ],

  controllers: [],
  providers: [],
})
export class AppModule {}
