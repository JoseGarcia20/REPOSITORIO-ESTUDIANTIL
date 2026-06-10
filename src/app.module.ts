import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { AuditoriaModule } from './modulos/auditoria/auditoria.module';
import { DashboardModule } from './modulos/dashboard/dashboard.module';
import { AprendizajeAdaptativoModule } from './modulos/aprendizajeAdaptativo/aprendizaje-adaptativo.module';
import { CalificacionUsoIaModule } from './modulos/calificacionUsoIa/calificacion-uso-ia.module';

function formatearTiempoEspera(segundos: number) {
  if (segundos <= 1) {
    return '1 segundo';
  }

  if (segundos < 60) {
    return `${segundos} segundos`;
  }

  const minutos = Math.ceil(segundos / 60);
  return minutos === 1 ? '1 minuto' : `${minutos} minutos`;
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      errorMessage: (_context, detalle) => {
        const segundos = Math.max(1, Math.ceil(detalle.timeToBlockExpire || 1));
        return `Has realizado demasiadas solicitudes. Podrás volver a intentarlo en ${formatearTiempoEspera(segundos)}.`;
      },
      throttlers: [
        {
          ttl: 60000,
          limit: 120,
        },
      ],
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
    AuditoriaModule,
    DashboardModule,
    AprendizajeAdaptativoModule,
    CalificacionUsoIaModule,
  ],

  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
