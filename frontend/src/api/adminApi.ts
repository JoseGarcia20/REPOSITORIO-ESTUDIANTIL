export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000';

export type InstitucionCatalogo = {
  id: number;
  nombre: string;
  estado?: boolean;
};

export type Rol = {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: boolean;
};

export type Categoria = {
  id: number;
  nombre: string;
  descripcion: string;
  color?: string;
  estado: boolean;
  institucionId: number;
};

export type TipoRecurso = {
  id: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  estado: boolean;
};

export type GradoEscolar = {
  id: number;
  nombre: string;
  codigo: string;
  orden: number;
  estado: boolean;
};

export type UsuarioAdmin = {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  tipoDocumento: string;
  documento: string;
  fechaNacimiento: string;
  genero: string;
  foto?: string;
  activo: boolean;
  institucionId: number;
  rolId: number;
  gradoEscolarId?: number;
  gradoEscolar?: GradoEscolar | null;
};

export type Recurso = {
  id: number;
  titulo: string;
  palabrasClave?: string;
  contenidoResumen?: string;
  rutaRecurso?: string;
  urlRecurso?: string;
  fuente?: string;
  autorNombre?: string;
  nivelAcademico?: string;
  gradoEscolarId?: number;
  foroOrigenId?: number;
  comentarioForoId?: number;
  estado: boolean;
  publicado: boolean;
  institucionId: number;
  categoriaId: number;
  tipoRecursoId: number;
  usuarioCreadorId: number;
  institucion?: {
    id: number;
    nombre: string;
  };
  categoria?: {
    id: number;
    nombre: string;
  };
  tipoRecurso?: {
    id: number;
    nombre: string;
  };
  usuarioCreador?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  gradoEscolar?: GradoEscolar | null;
  foroOrigen?: {
    id: number;
    titulo: string;
    publico: boolean;
  } | null;
  comentarioForo?: {
    id: number;
    contenido: string;
  } | null;
};

export type EstudianteAula = {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  institucionId: number;
  rolId: number;
  gradoEscolarId?: number;
  gradoEscolar?: GradoEscolar | null;
};

export type UsuarioSesion = {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  documento: string;
  rol: {
    id: number;
    nombre: string;
  };
  permisos?: string[];
  institucion: {
    id: number;
    nombre: string;
    logo?: string;
  };
  gradoEscolar?: GradoEscolar | null;
};

export type CrearUsuarioPayload = {
  nombres: string;
  apellidos: string;
  correo: string;
  tipoDocumento: string;
  documento: string;
  fechaNacimiento: string;
  genero: string;
  contrasena: string;
  institucionId: number;
  rolId: number;
  gradoEscolarId?: number;
};

export type ActualizarUsuarioPayload = Omit<CrearUsuarioPayload, 'contrasena'>;

export type CategoriaPayload = {
  nombre: string;
  descripcion: string;
  color: string;
  institucionId?: number;
};

export type TipoRecursoPayload = {
  nombre: string;
  descripcion?: string;
  icono?: string;
};

export type RolPayload = {
  nombre: string;
  descripcion?: string;
};

export type RecursoPayload = {
  titulo: string;
  palabrasClave?: string;
  contenidoResumen?: string;
  rutaRecurso?: string;
  urlRecurso?: string;
  fuente?: string;
  autorNombre?: string;
  nivelAcademico?: string;
  gradoEscolarId?: number;
  publicado?: boolean;
  institucionId?: number;
  categoriaId?: number;
  tipoRecursoId?: number;
  usuarioCreadorId?: number;
};

export type ComentarioForo = {
  id: number;
  contenido: string;
  estado: boolean;
  createdAt: string;
  usuario: {
    id: number;
    nombres: string;
    apellidos: string;
    rol?: {
      nombre: string;
    };
    institucion?: {
      id: number;
      nombre: string;
    };
  };
  recursos?: Recurso[];
};

export type ForoCategoria = {
  categoriaId: number;
  categoria: {
    id: number;
    nombre: string;
    color?: string;
  };
};

export type ForoAcademico = {
  id: number;
  titulo: string;
  descripcion: string;
  estado: boolean;
  publico: boolean;
  cerrado: boolean;
  fechaCierre?: string;
  createdAt: string;
  institucionId: number;
  categoriaId: number;
  usuarioId: number;
  institucion?: {
    id: number;
    nombre: string;
  };
  categoria?: {
    id: number;
    nombre: string;
    color?: string;
  };
  usuario?: {
    id: number;
    nombres: string;
    apellidos: string;
    rol?: {
      nombre: string;
    };
    institucion?: {
      id: number;
      nombre: string;
    };
  };
  categorias?: ForoCategoria[];
  comentarios: ComentarioForo[];
  recursos?: Recurso[];
};

export type CrearForoPayload = {
  titulo: string;
  descripcion: string;
  publico?: boolean;
  institucionId?: number;
  categoriaId?: number;
  categoriaIds?: number[];
};

export type SubirRecursoForoPayload = {
  archivo: File;
  contexto: string;
  titulo?: string;
  gradoEscolarId?: string;
  publicado?: boolean;
};

export type ComentarForoConRecursoPayload = {
  contenido: string;
  archivo: File;
  titulo?: string;
  gradoEscolarId?: string;
};

export type ComentarForoConRecursoExistentePayload = {
  contenido: string;
  recursoId: number;
};

export type RolProyectoAula = 'lider' | 'investigador' | 'expositor';

export type IntegranteProyectoAula = {
  id: number;
  rolProyecto: RolProyectoAula | string;
  estado: boolean;
  usuarioId: number;
  usuario: EstudianteAula & {
    rol?: {
      nombre: string;
    };
  };
};

export type EvidenciaAula = {
  id: number;
  comentario?: string;
  rutaArchivo: string;
  nombreArchivo: string;
  mimeType?: string;
  estado: boolean;
  createdAt: string;
  usuario: {
    id: number;
    nombres: string;
    apellidos: string;
  };
};

export type ActividadAula = {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: string;
  fechaLimite?: string;
  createdAt: string;
  responsableId?: number;
  responsable?: {
    id: number;
    nombres: string;
    apellidos: string;
  } | null;
  creador?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  evidencias: EvidenciaAula[];
};

export type EntregaAula = {
  id: number;
  comentario?: string;
  rutaArchivo: string;
  nombreArchivo: string;
  mimeType?: string;
  estado: string;
  calificacion?: number;
  comentariosDocente?: string;
  fechaRevision?: string;
  createdAt: string;
  recursoId?: number;
  usuario: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  recurso?: {
    id: number;
    titulo: string;
    palabrasClave?: string;
  } | null;
};

export type ProyectoAula = {
  id: number;
  titulo: string;
  descripcion: string;
  objetivo: string;
  curso?: string;
  instrucciones?: string;
  fechaLimite: string;
  estado: string;
  comentariosCierre?: string;
  calificacion?: number;
  fechaCierre?: string;
  createdAt: string;
  institucionId: number;
  docenteId: number;
  gradoEscolarId?: number;
  categoriaId?: number;
  institucion?: {
    id: number;
    nombre: string;
  };
  docente?: {
    id: number;
    nombres: string;
    apellidos: string;
    rol?: {
      nombre: string;
    };
  };
  gradoEscolar?: GradoEscolar | null;
  categoria?: {
    id: number;
    nombre: string;
    color?: string;
  } | null;
  integrantes: IntegranteProyectoAula[];
  actividades: ActividadAula[];
  entregas: EntregaAula[];
};

export type CatalogosAula = {
  instituciones: InstitucionCatalogo[];
  categorias: Categoria[];
  gradosEscolares: GradoEscolar[];
  estudiantes: EstudianteAula[];
};

export type CrearProyectoAulaPayload = {
  titulo: string;
  descripcion: string;
  objetivo: string;
  curso?: string;
  instrucciones?: string;
  fechaLimite: string;
  institucionId?: number;
  gradoEscolarId?: number;
  categoriaId?: number;
  integrantes: Array<{
    usuarioId: number;
    rolProyecto: RolProyectoAula | string;
  }>;
};

export type CrearActividadAulaPayload = {
  titulo: string;
  descripcion?: string;
  fechaLimite?: string;
  responsableId?: number;
};

type RutaEstado = 'inactivar' | 'reactivar';

export type ConsultaPaginada = {
  pagina?: number;
  limite?: number | string;
  busqueda?: string;
  estado?: string;
  institucionId?: number | string;
  rolId?: number | string;
  rolIds?: number | string;
  categoriaId?: number | string;
  categoriaIds?: number | string;
  tipoRecursoId?: number | string;
  tipoArchivo?: string;
  gradoEscolarId?: number | string;
  recursoId?: number | string;
  excluirRecursoId?: number | string;
  publicado?: string;
  publico?: string;
  cerrado?: string;
  tema?: string;
};

export type RespuestaPaginada<T> = {
  data: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
};

export type RecursoAsistente = {
  id: number;
  titulo: string;
  resumen?: string;
  palabrasClave?: string;
  categoria?: string;
  tipoRecurso?: string;
  gradoEscolar?: string;
  puntaje?: number;
  motivos?: string[];
  promedioCalificacion?: number;
  totalCalificaciones?: number;
  rutaRepositorio: string;
};

export type FuenteWebAsistente = {
  titulo: string;
  enlace: string;
  resumen: string;
  fuente: string | null;
};

export type RespuestaAsistente = {
  mensaje: string;
  busquedaSugerida: string;
  recursos: RecursoAsistente[];
  fuentesWeb?: FuenteWebAsistente[];
  conversacionId: number | null;
  temas: string[];
};

export type ConversacionChatDTO = {
  id: number;
  titulo: string | null;
  resumen: string | null;
  temas: string[] | null;
  createdAt: string;
  updatedAt: string;
};

export type InteresUsuarioDTO = {
  id: number;
  tema: string;
  peso: number;
  ultimaConsulta: string;
};

export type RespuestaRecomendacionesRecursos = {
  tema: string;
  terminos: string[];
  recursos: RecursoAsistente[];
};

export type DashboardKpi = {
  key: string;
  label: string;
  value: number;
  detail?: string;
};

export type DashboardLogReciente = {
  id: string;
  entidad: string;
  accion: string;
  createdAt: string;
  usuario: string;
  institucion: string;
  detalle: string;
};

export type DashboardInstitucionResumen = {
  institucionId: number;
  nombre: string;
  usuarios: number;
  recursos: number;
  actividad: number;
};

export type DashboardDistribucionGlobal = {
  superadministrador: number;
  administrador: number;
  docente: number;
  estudiante: number;
  usuarioAdministrativo: number;
};

export type DashboardDistribucionInstitucion = {
  estudiantes: number;
  docentes: number;
  administrativos: number;
};

export type DashboardSerie = {
  id: number;
  nombre: string;
  total: number;
};

export type DashboardForoReciente = {
  id: number;
  titulo: string;
  createdAt: string;
  publico: boolean;
  cerrado: boolean;
  comentarios: number;
  autor: string;
};

export type DashboardRecursoDocente = {
  id: number;
  titulo: string;
  createdAt: string;
  promedioCalificacion: number;
  totalCalificaciones: number;
};

export type DashboardForoDocente = {
  id: number;
  titulo: string;
  createdAt: string;
  publico: boolean;
  comentarios: number;
};

export type DashboardProyectoDocente = {
  id: number;
  titulo: string;
  estado: string;
  estadoLabel: string;
  fechaLimite: string;
  integrantes: number;
  actividades: number;
  entregas: number;
};

export type DashboardEntregaPendienteRevision = {
  id: number;
  nombreArchivo: string;
  createdAt: string;
  estudiante: string;
  proyectoId: number;
  proyectoTitulo: string;
  estadoProyecto: string;
  fechaLimiteProyecto: string;
};

export type DashboardProyectoEstudiante = {
  id: number;
  proyectoId: number;
  titulo: string;
  estado: string;
  estadoLabel: string;
  fechaLimite: string;
  rolProyecto: string;
  docente: string;
};

export type DashboardForoGradoEstudiante = {
  id: number;
  titulo: string;
  createdAt: string;
  publico: boolean;
  categoria: string;
  comentarios: number;
};

export type DashboardRutaEstudiante = {
  id: number;
  rutaId: number;
  titulo: string;
  temaObjetivo: string;
  nivelDificultad: string;
  estado: string;
  porcentajeAvance: number;
  fechaAsignacion: string;
  fechaFinalizacion: string | null;
};

export type DashboardRutaAdaptativa = {
  id: number;
  tema: string;
  estado: string;
  estadoLabel: string;
  fechaAsignacion: string;
  fechaLimite: string | null;
  fechaRutaGenerada: string | null;
  fechaFinalizacion: string | null;
  progreso: number;
  estudiante: string;
  docente: string;
  tipoAprendizaje: string;
  nivelDificultad: string;
  duracionEstimada: string;
  justificacion: string;
};

export type DashboardDiagnosticoAdaptativo = {
  id: number;
  tema: string;
  estudiante: string;
  docente: string;
  tipoAprendizaje: string;
  nivelDificultad: string;
  duracionEstimada: string;
  justificacion: string;
  fechaGeneracion: string;
  estado: string;
  progreso: number;
};

export type DashboardUltimoDiagnostico = {
  id: number;
  puntajeFinal: number;
  resultadoFinal: string;
  createdAt: string;
  tipoAprendizaje: string;
} | null;

export type DashboardCategoriaPublicacion = {
  id: number;
  nombre: string;
  publicados: number;
  borradores: number;
  total: number;
};

export type ResumenDashboard = {
  alcance:
    | 'global'
    | 'institucion'
    | 'docente'
    | 'estudiante'
    | 'administrativo';
  institucion?: {
    id: number;
    nombre: string;
  };
  gradoEscolar?: {
    id: number;
    nombre: string;
    codigo: string;
  } | null;
  kpis: DashboardKpi[];
  distribucionUsuarios?:
    | DashboardDistribucionGlobal
    | DashboardDistribucionInstitucion;
  usuariosPorInstitucion?: DashboardInstitucionResumen[];
  institucionesSinActividad?: DashboardInstitucionResumen[];
  institucionesConMasActividad?: DashboardInstitucionResumen[];
  recursosPorCategoria?: DashboardSerie[];
  recursosPorGrado?: DashboardSerie[];
  forosRecientes?: DashboardForoReciente[];
  misRecursosRecientes?: DashboardRecursoDocente[];
  misForosAbiertos?: DashboardForoDocente[];
  proyectosDocente?: DashboardProyectoDocente[];
  entregasPendientesRevision?: DashboardEntregaPendienteRevision[];
  misProyectos?: DashboardProyectoEstudiante[];
  forosDirigidosGrado?: DashboardForoGradoEstudiante[];
  misRutasAprendizaje?: DashboardRutaEstudiante[];
  ultimoDiagnostico?: DashboardUltimoDiagnostico;
  rutasAprendizajeAdaptativo?: DashboardRutaAdaptativa[];
  ultimosDiagnosticosAdaptativos?: DashboardDiagnosticoAdaptativo[];
  recursosPublicadosVsBorradores?: DashboardCategoriaPublicacion[];
  logsRecientes: DashboardLogReciente[];
};

export type TipoReporte =
  | 'recursos-institucion'
  | 'trabajos-colaborativos'
  | 'recursos-uso'
  | 'calificaciones-ia';

export type PayloadReporte = {
  tipo: TipoReporte;
  fechaInicio?: string;
  fechaFin?: string;
  institucionId?: string;
  categoriaId?: string;
  gradoEscolarId?: string;
  estadoProyecto?: string;
  moduloUso?: string;
  moduloIa?: string;
  limite?: string;
};

export type CatalogosReportes = {
  instituciones: Array<{
    id: number;
    nombre: string;
    logo?: string | null;
  }>;
  categorias: Array<{
    id: number;
    nombre: string;
    institucion?: {
      id: number;
      nombre: string;
    };
  }>;
  gradosEscolares: Array<{
    id: number;
    nombre: string;
    orden: number;
  }>;
};

export type ReporteGenerado = {
  tipo: TipoReporte;
  titulo: string;
  descripcion: string;
  generadoEn: string;
  periodo: string;
  encabezado: {
    software: boolean;
    nombreEmisor: string;
    nit?: string;
    ubicacion?: string;
    logo?: string;
    generadoPor: string;
    rolGenerador?: string;
  };
  filtros: Array<{
    label: string;
    value: string;
  }>;
  metricas: Array<{
    label: string;
    value: string | number;
    detail?: string;
  }>;
  columnas: Array<{
    key: string;
    label: string;
    align?: 'left' | 'right' | 'center';
  }>;
  filas: Array<Record<string, string | number>>;
  notas?: string[];
};

export type CatalogosAprendizajeAdaptativo = {
  estados: string[];
  tiposAprendizaje: Array<{
    id: number;
    nombre: string;
    descripcion?: string | null;
    estrategias: Array<{
      id: number;
      nombre: string;
      descripcion?: string | null;
      pesoSugerido: number;
    }>;
  }>;
  estudiantes: Array<{
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
    nombreCompleto: string;
    gradoEscolar?: { id: number; nombre: string } | null;
  }>;
  docentes: Array<{
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
    nombreCompleto: string;
  }>;
  puedeGestionar: boolean;
  esEstudiante: boolean;
};

export type AsignacionAprendizajeAdaptativo = {
  id: number;
  tema: string;
  objetivo?: string | null;
  nivelSolicitado?: string | null;
  tiempoDisponible?: string | null;
  estado: string;
  entrevistaPreguntas?: any;
  entrevistaRespuestas?: any;
  perfilAprendizaje?: any;
  diagnostico?: any;
  ruta?: any;
  evaluacion?: any;
  respuestasEvaluacion?: any;
  resultadoEvaluacion?: any;
  revisionDocente?: any;
  calificacionEstudianteIA?: number | null;
  comentarioEstudianteIA?: string | null;
  fechaCalificacionEstudianteIA?: string | null;
  calificacionDocenteIA?: number | null;
  comentarioDocenteIA?: string | null;
  fechaCalificacionDocenteIA?: string | null;
  conclusionesPdf?: string | null;
  fechaLimite?: string | null;
  fechaAprobacion?: string | null;
  fechaRutaGenerada?: string | null;
  fechaFinalizacion?: string | null;
  fechaRevision?: string | null;
  createdAt: string;
  updatedAt: string;
  institucionId: number;
  docenteId: number;
  estudianteId: number;
  gradoEscolarId?: number | null;
  institucion?: {
    id: number;
    nombre: string;
    logo?: string | null;
  };
  docente?: {
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
  };
  estudiante?: {
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
    gradoEscolar?: { id: number; nombre: string; codigo: string } | null;
  };
  gradoEscolar?: { id: number; nombre: string; codigo: string } | null;
};

export type PayloadTipoAprendizajeAdaptativo = {
  nombre: string;
  descripcion?: string;
  estrategias?: string[];
};

export type TipoMaterialIa =
  | 'guia_clase'
  | 'taller'
  | 'quiz'
  | 'lectura'
  | 'evaluacion'
  | 'resumen';

export type ExtensionMaterialIa = 'breve' | 'normal' | 'extenso';
export type OrigenMaterialIa = 'tema_web' | 'recurso_repositorio';

export type CatalogosPreparadorIa = {
  instituciones: Array<{
    id: number;
    nombre: string;
  }>;
  categorias: Array<{
    id: number;
    nombre: string;
    institucionId: number;
    institucion?: {
      id: number;
      nombre: string;
    };
  }>;
  gradosEscolares: GradoEscolar[];
  tiposRecursos: Array<{
    id: number;
    nombre: string;
  }>;
};

export type PayloadGenerarMaterialIa = {
  tema: string;
  gradoEscolarId: string;
  institucionId?: string;
  categoriaId?: string;
  tipoMaterial?: TipoMaterialIa;
  extension?: ExtensionMaterialIa;
  instruccionesAdicionales?: string;
  origenContenido?: OrigenMaterialIa;
  recursoFuenteId?: string;
};

export type FuenteMaterialIa = {
  titulo: string;
  url: string;
};

export type SeccionMaterialIa = {
  titulo: string;
  contenido: string;
};

export type MaterialIaGenerado = {
  titulo: string;
  tema: string;
  gradoEscolarId: string;
  gradoEscolar: string;
  categoriaId?: string;
  categoria?: string;
  tipoMaterial: TipoMaterialIa;
  extension: ExtensionMaterialIa;
  introduccion: string;
  objetivos: string[];
  conceptosClave: string[];
  secciones: SeccionMaterialIa[];
  actividadClase: string;
  preguntasComprension: string[];
  cierre: string;
  palabrasClave: string[];
  fuentes: FuenteMaterialIa[];
  busquedas: string[];
  modelo: string;
  generadoEn: string;
};

export type PayloadGuardarMaterialIa = {
  titulo: string;
  tema: string;
  gradoEscolarId: string;
  institucionId?: string;
  categoriaId?: string;
  tipoRecursoId?: string;
  tipoMaterial: TipoMaterialIa;
  extension: ExtensionMaterialIa;
  introduccion: string;
  objetivos: string[];
  conceptosClave: string[];
  secciones: SeccionMaterialIa[];
  actividadClase: string;
  preguntasComprension: string[];
  cierre: string;
  palabrasClave: string[];
  fuentes: FuenteMaterialIa[];
  publicado?: boolean;
};

export type RespuestaGuardarMaterialIa = {
  mensaje: string;
  archivo: {
    nombreArchivo: string;
    rutaPublica: string;
    mimeType: string;
  };
  recurso: Recurso;
};

export const PERMISOS = {
  SISTEMA_TOTAL: 'sistema.total',
  INSTITUCIONES_VER: 'instituciones.ver',
  INSTITUCIONES_CREAR: 'instituciones.crear',
  INSTITUCIONES_EDITAR: 'instituciones.editar',
  INSTITUCIONES_CAMBIAR_ESTADO: 'instituciones.cambiar_estado',
  ROLES_VER: 'roles.ver',
  ROLES_CREAR: 'roles.crear',
  ROLES_EDITAR: 'roles.editar',
  ROLES_CAMBIAR_ESTADO: 'roles.cambiar_estado',
  USUARIOS_VER: 'usuarios.ver',
  USUARIOS_CREAR: 'usuarios.crear',
  USUARIOS_EDITAR: 'usuarios.editar',
  USUARIOS_CAMBIAR_ESTADO: 'usuarios.cambiar_estado',
  ESTUDIANTES_VER: 'estudiantes.ver',
  CATEGORIAS_VER: 'categorias.ver',
  CATEGORIAS_CREAR: 'categorias.crear',
  CATEGORIAS_EDITAR: 'categorias.editar',
  CATEGORIAS_CAMBIAR_ESTADO: 'categorias.cambiar_estado',
  TIPOS_RECURSOS_VER: 'tipos_recursos.ver',
  TIPOS_RECURSOS_CREAR: 'tipos_recursos.crear',
  TIPOS_RECURSOS_EDITAR: 'tipos_recursos.editar',
  TIPOS_RECURSOS_CAMBIAR_ESTADO: 'tipos_recursos.cambiar_estado',
  RECURSOS_VER: 'recursos.ver',
  RECURSOS_VER_TODOS_GRADOS: 'recursos.ver_todos_grados',
  RECURSOS_CREAR: 'recursos.crear',
  RECURSOS_EDITAR: 'recursos.editar',
  RECURSOS_CAMBIAR_ESTADO: 'recursos.cambiar_estado',
  RECURSOS_SUBIR_ARCHIVO: 'recursos.subir_archivo',
  FOROS_VER: 'foros.ver',
  FOROS_CREAR: 'foros.crear',
  FOROS_CREAR_PUBLICO: 'foros.crear_publico',
  FOROS_COMENTAR: 'foros.comentar',
  FOROS_CERRAR: 'foros.cerrar',
  FOROS_SUBIR_RECURSO: 'foros.subir_recurso',
  AULA_COLABORATIVA_VER: 'aula_colaborativa.ver',
  AULA_COLABORATIVA_CREAR: 'aula_colaborativa.crear',
  AULA_COLABORATIVA_GESTIONAR: 'aula_colaborativa.gestionar',
  AULA_COLABORATIVA_PARTICIPAR: 'aula_colaborativa.participar',
  AULA_COLABORATIVA_REVISAR: 'aula_colaborativa.revisar',
  REPORTES_VER: 'reportes.ver',
  PREPARADOR_IA_USAR: 'preparador_ia.usar',
  AUDITORIA_VER: 'auditoria.ver',
} as const;

function obtenerToken(): string {
  return localStorage.getItem('token') || '';
}

export function construirUrlArchivoProtegido(ruta?: string | null): string {
  if (!ruta) {
    return '';
  }

  if (/^https?:\/\//i.test(ruta)) {
    return anexarTokenSiEsUpload(ruta);
  }

  const url = `${API_URL}${ruta}`;
  if (!ruta.startsWith('/uploads/')) {
    return url;
  }

  return anexarTokenSiEsUpload(url);
}

function anexarTokenSiEsUpload(url: string): string {
  let esUpload = false;
  let tieneToken = false;

  try {
    const urlParseada = new URL(url);
    esUpload = urlParseada.pathname.startsWith('/uploads/');
    tieneToken = urlParseada.searchParams.has('token');
  } catch {
    esUpload = url.startsWith('/uploads/');
    tieneToken = /[?&]token=/.test(url);
  }

  if (!esUpload || tieneToken) {
    return url;
  }

  const token = obtenerToken();
  if (!token) {
    return url;
  }

  const separador = url.includes('?') ? '&' : '?';
  return `${url}${separador}token=${encodeURIComponent(token)}`;
}

function construirHeadersAutorizados(incluirJson = true): HeadersInit {
  const token = obtenerToken();

  return {
    ...(incluirJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function procesarRespuesta<T>(
  respuesta: Response,
  mensajeError: string,
): Promise<T> {
  if (!respuesta.ok) {
    let mensajeDetalle = '';

    try {
      const detalle = await respuesta.json();
      mensajeDetalle = Array.isArray(detalle?.message)
        ? detalle.message.join(', ')
        : detalle?.message || detalle?.error;
    } catch {
      mensajeDetalle = '';
    }

    throw new Error(
      mensajeDetalle ? `${mensajeError}: ${mensajeDetalle}` : mensajeError,
    );
  }

  return respuesta.json() as Promise<T>;
}

async function get<T>(path: string, mensajeError: string): Promise<T> {
  const respuesta = await fetch(`${API_URL}${path}`, {
    headers: construirHeadersAutorizados(false),
  });

  return procesarRespuesta<T>(respuesta, mensajeError);
}

async function post<T>(
  path: string,
  data: unknown,
  mensajeError: string,
): Promise<T> {
  const respuesta = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: construirHeadersAutorizados(),
    body: JSON.stringify(data),
  });

  return procesarRespuesta<T>(respuesta, mensajeError);
}

async function put<T>(
  path: string,
  data: unknown,
  mensajeError: string,
): Promise<T> {
  const respuesta = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: construirHeadersAutorizados(),
    body: JSON.stringify(data),
  });

  return procesarRespuesta<T>(respuesta, mensajeError);
}

async function patch<T>(path: string, mensajeError: string): Promise<T> {
  const respuesta = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: construirHeadersAutorizados(false),
  });

  return procesarRespuesta<T>(respuesta, mensajeError);
}

async function patchJson<T>(
  path: string,
  data: unknown,
  mensajeError: string,
): Promise<T> {
  const respuesta = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: construirHeadersAutorizados(),
    body: JSON.stringify(data),
  });

  return procesarRespuesta<T>(respuesta, mensajeError);
}

async function del<T>(path: string, mensajeError: string): Promise<T> {
  const respuesta = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: construirHeadersAutorizados(false),
  });

  return procesarRespuesta<T>(respuesta, mensajeError);
}

function cambiarEstado<T>(
  path: string,
  id: number,
  accion: RutaEstado,
): Promise<T> {
  return patch<T>(
    `${path}/${id}/${accion}`,
    'Error al cambiar el estado del registro',
  );
}

function construirQueryString(query: ConsultaPaginada = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null || valor === '') {
      return;
    }

    params.set(clave, String(valor));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

function conQuery(path: string, query?: ConsultaPaginada) {
  return `${path}${construirQueryString(query)}`;
}

export function obtenerUsuarioAutenticado(): UsuarioSesion | null {
  const usuarioGuardado = localStorage.getItem('usuario');

  if (!usuarioGuardado) {
    return null;
  }

  try {
    return JSON.parse(usuarioGuardado) as UsuarioSesion;
  } catch {
    return null;
  }
}

export function obtenerRutaLoginSegunUsuario(
  usuario: UsuarioSesion | null = obtenerUsuarioAutenticado(),
): string {
  const rol = usuario?.rol?.nombre?.toLowerCase() || '';
  const permisos = usuario?.permisos || [];

  if (
    permisos.includes(PERMISOS.SISTEMA_TOTAL) ||
    rol.includes('superadministrador')
  ) {
    return '/superadmin/login';
  }

  return '/login';
}

export function esSuperadministrador(): boolean {
  return usuarioTienePermiso(PERMISOS.SISTEMA_TOTAL);
}

export function usuarioTienePermiso(permiso: string): boolean {
  const usuario = obtenerUsuarioAutenticado();
  const permisos = usuario?.permisos || [];
  return (
    permisos.includes(PERMISOS.SISTEMA_TOTAL) || permisos.includes(permiso)
  );
}

export function obtenerInstitucionesAdmin() {
  return get<InstitucionCatalogo[]>(
    '/instituciones/todas',
    'Error al obtener instituciones',
  );
}

export function obtenerRolesAdmin() {
  return get<Rol[]>('/roles/todos', 'Error al obtener roles');
}

export function obtenerRolesAsignablesAdmin() {
  return get<Rol[]>('/roles/asignables', 'Error al obtener roles asignables');
}

export function crearRol(data: RolPayload) {
  return post<Rol>('/roles', data, 'Error al crear rol');
}

export function actualizarRol(id: number, data: RolPayload) {
  return put<Rol>(`/roles/${id}`, data, 'Error al actualizar rol');
}

export function inactivarRol(id: number) {
  return cambiarEstado<Rol>('/roles', id, 'inactivar');
}

export function reactivarRol(id: number) {
  return cambiarEstado<Rol>('/roles', id, 'reactivar');
}

export function obtenerCategoriasAdmin() {
  return get<Categoria[]>('/categorias/todas', 'Error al obtener categorías');
}

export function crearCategoria(data: CategoriaPayload) {
  return post<Categoria>('/categorias', data, 'Error al crear categoría');
}

export function actualizarCategoria(id: number, data: CategoriaPayload) {
  return put<Categoria>(
    `/categorias/${id}`,
    data,
    'Error al actualizar categoría',
  );
}

export function inactivarCategoria(id: number) {
  return cambiarEstado<Categoria>('/categorias', id, 'inactivar');
}

export function reactivarCategoria(id: number) {
  return cambiarEstado<Categoria>('/categorias', id, 'reactivar');
}

export function obtenerTiposRecursosAdmin() {
  return get<TipoRecurso[]>(
    '/tipos-recursos/todos',
    'Error al obtener tipos de recursos',
  );
}

export function crearTipoRecurso(data: TipoRecursoPayload) {
  return post<TipoRecurso>(
    '/tipos-recursos',
    data,
    'Error al crear tipo de recurso',
  );
}

export function actualizarTipoRecurso(id: number, data: TipoRecursoPayload) {
  return put<TipoRecurso>(
    `/tipos-recursos/${id}`,
    data,
    'Error al actualizar tipo de recurso',
  );
}

export function inactivarTipoRecurso(id: number) {
  return cambiarEstado<TipoRecurso>('/tipos-recursos', id, 'inactivar');
}

export function reactivarTipoRecurso(id: number) {
  return cambiarEstado<TipoRecurso>('/tipos-recursos', id, 'reactivar');
}

export function obtenerGradosEscolares() {
  return get<GradoEscolar[]>(
    '/grados-escolares',
    'Error al obtener grados escolares',
  );
}

export function obtenerUsuariosAdmin(query?: ConsultaPaginada) {
  return get<RespuestaPaginada<UsuarioAdmin>>(
    conQuery('/usuarios/todos', query),
    'Error al obtener usuarios',
  );
}

export function crearUsuarioAdmin(data: CrearUsuarioPayload) {
  return post<UsuarioAdmin>('/usuarios', data, 'Error al crear usuario');
}

export function actualizarUsuarioAdmin(
  id: number,
  data: ActualizarUsuarioPayload,
) {
  return put<UsuarioAdmin>(
    `/usuarios/${id}`,
    data,
    'Error al actualizar usuario',
  );
}

export function inactivarUsuarioAdmin(id: number) {
  return cambiarEstado<UsuarioAdmin>('/usuarios', id, 'inactivar');
}

export function reactivarUsuarioAdmin(id: number) {
  return cambiarEstado<UsuarioAdmin>('/usuarios', id, 'reactivar');
}

export function obtenerRecursosAdmin(query?: ConsultaPaginada) {
  return get<RespuestaPaginada<Recurso>>(
    conQuery('/recursos/todos', query),
    'Error al obtener recursos',
  );
}

export function obtenerRecursosRepositorio(query?: ConsultaPaginada) {
  return get<RespuestaPaginada<Recurso>>(
    conQuery('/recursos', {
      ...query,
      publicado: 'true',
    }),
    'Error al obtener recursos del repositorio',
  );
}

export function crearRecurso(data: RecursoPayload) {
  return post<Recurso>('/recursos', data, 'Error al crear recurso');
}

export function actualizarRecurso(id: number, data: RecursoPayload) {
  return put<Recurso>(`/recursos/${id}`, data, 'Error al actualizar recurso');
}

export function inactivarRecurso(id: number) {
  return cambiarEstado<Recurso>('/recursos', id, 'inactivar');
}

export function reactivarRecurso(id: number) {
  return cambiarEstado<Recurso>('/recursos', id, 'reactivar');
}

export type ResumenCalificacionRecurso = {
  promedio: number;
  total: number;
  miCalificacion: number | null;
};

export type ResumenIaRecurso = {
  recursoId: number;
  resumen: string;
  proveedor: string;
  modelo: string;
  generadoEn: string;
  desdeCache: boolean;
  caracteresAnalizados: number;
  extension: string;
  advertencia?: string;
};

export type EventoResumenIa =
  | { tipo: 'estado'; mensaje: string }
  | { tipo: 'reiniciar' }
  | { tipo: 'delta'; texto: string }
  | { tipo: 'final'; resumen: ResumenIaRecurso }
  | { tipo: 'error'; mensaje: string };

export type PayloadCalificacionUsoIa = {
  modulo: string;
  funcionalidad: string;
  entidadTipo?: string;
  entidadId?: number;
  calificacion: number;
  comentario?: string;
  metadata?: Record<string, unknown>;
};

export type CalificacionUsoIa = PayloadCalificacionUsoIa & {
  id: number;
  usuarioId: number;
  institucionId?: number | null;
  createdAt: string;
};

export function crearCalificacionUsoIa(data: PayloadCalificacionUsoIa) {
  return post<CalificacionUsoIa>(
    '/calificaciones-ia',
    data,
    'Error al guardar la calificación de la IA',
  );
}

export function obtenerResumenCalificacionRecurso(recursoId: number) {
  return get<ResumenCalificacionRecurso>(
    `/calificacion-recurso/recurso/${recursoId}/resumen`,
    'Error al obtener calificación del recurso',
  );
}

export function calificarRecurso(
  recursoId: number,
  calificacion: number,
  comentario?: string,
) {
  return post(
    `/calificacion-recurso/recurso/${recursoId}`,
    { calificacion, comentario },
    'Error al calificar recurso',
  );
}

export function generarResumenIaRecurso(recursoId: number, forzar = false) {
  return post<ResumenIaRecurso>(
    `/recursos/${recursoId}/resumen-ia`,
    { forzar },
    'Error al generar resumen AI',
  );
}

export async function generarResumenIaRecursoStream(
  recursoId: number,
  forzar: boolean,
  onEvento: (evento: EventoResumenIa) => void,
) {
  const respuesta = await fetch(
    `${API_URL}/recursos/${recursoId}/resumen-ia/stream`,
    {
      method: 'POST',
      headers: construirHeadersAutorizados(),
      body: JSON.stringify({ forzar }),
    },
  );

  if (!respuesta.ok || !respuesta.body) {
    await procesarRespuesta<never>(respuesta, 'Error al generar resumen AI');
    return;
  }

  const reader = respuesta.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const procesarEvento = (eventoCrudo: string) => {
    const payload = eventoCrudo
      .split('\n')
      .map((linea) => linea.trim())
      .filter((linea) => linea.startsWith('data:'))
      .map((linea) => linea.replace(/^data:\s*/, ''))
      .join('\n')
      .trim();

    if (!payload) {
      return;
    }

    const evento = JSON.parse(payload) as EventoResumenIa;
    onEvento(evento);

    if (evento.tipo === 'error') {
      throw new Error(evento.mensaje);
    }
  };

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const eventos = buffer.split('\n\n');
    buffer = eventos.pop() || '';

    eventos.forEach(procesarEvento);
  }

  if (buffer.trim()) {
    procesarEvento(buffer);
  }
}

export function consultarAsistente(
  pregunta: string,
  conversacionId?: number | null,
  historial?: { rol: 'usuario' | 'asistente'; contenido: string }[],
) {
  return post<RespuestaAsistente>(
    '/asistente/chat',
    { pregunta, conversacionId, historial },
    'Error al consultar el asistente',
  );
}

export function listarConversaciones() {
  return get<ConversacionChatDTO[]>(
    '/asistente/conversaciones',
    'Error al listar conversaciones',
  );
}

export function obtenerConversacion(id: number) {
  return get<ConversacionChatDTO>(
    `/asistente/conversaciones/${id}`,
    'Error al obtener la conversación',
  );
}

export function eliminarConversacion(id: number) {
  return del<void>(
    `/asistente/conversaciones/${id}`,
    'Error al eliminar la conversación',
  );
}

export function listarInteresesUsuario() {
  return get<InteresUsuarioDTO[]>(
    '/asistente/intereses',
    'Error al obtener intereses',
  );
}

export function obtenerRecomendacionesRecursos(query?: ConsultaPaginada) {
  return get<RespuestaRecomendacionesRecursos>(
    conQuery('/recomendaciones/recursos', query),
    'Error al obtener recomendaciones de recursos',
  );
}

export function obtenerCatalogosReportes() {
  return get<CatalogosReportes>(
    '/reportes/catalogos',
    'Error al obtener catálogos de reportes',
  );
}

export function obtenerResumenDashboard() {
  return get<ResumenDashboard>(
    '/dashboard/resumen',
    'Error al obtener resumen del dashboard',
  );
}

export function generarReporte(data: PayloadReporte) {
  return post<ReporteGenerado>(
    '/reportes/generar',
    data,
    'Error al generar reporte',
  );
}

export async function descargarExcelReporte(data: PayloadReporte) {
  const respuesta = await fetch(`${API_URL}/reportes/generar-excel`, {
    method: 'POST',
    headers: construirHeadersAutorizados(),
    body: JSON.stringify(data),
  });

  if (!respuesta.ok) {
    await procesarRespuesta<never>(
      respuesta,
      'Error al descargar el reporte en Excel',
    );
    return;
  }

  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `reporte-${data.tipo}-${Date.now()}.xlsx`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

export function obtenerCatalogosPreparadorIa() {
  return get<CatalogosPreparadorIa>(
    '/preparador-ia/catalogos',
    'Error al obtener catálogos del preparador IA',
  );
}

export function generarMaterialIa(data: PayloadGenerarMaterialIa) {
  return post<MaterialIaGenerado>(
    '/preparador-ia/generar',
    data,
    'Error al generar material con IA',
  );
}

export function guardarMaterialIa(data: PayloadGuardarMaterialIa) {
  return post<RespuestaGuardarMaterialIa>(
    '/preparador-ia/guardar',
    data,
    'Error al guardar material en el repositorio',
  );
}

export function obtenerCatalogosAprendizajeAdaptativo() {
  return get<CatalogosAprendizajeAdaptativo>(
    '/aprendizaje-adaptativo/catalogos',
    'Error al obtener catálogos de aprendizaje adaptativo',
  );
}

export function listarAsignacionesAprendizajeAdaptativo() {
  return get<AsignacionAprendizajeAdaptativo[]>(
    '/aprendizaje-adaptativo/asignaciones',
    'Error al obtener asignaciones de aprendizaje adaptativo',
  );
}

export function crearAsignacionAprendizajeAdaptativo(data: {
  estudianteId: number;
  docenteId?: number;
  tema: string;
  objetivo?: string;
  nivelSolicitado?: string;
  tiempoDisponible?: string;
  fechaLimite?: string;
}) {
  return post<AsignacionAprendizajeAdaptativo>(
    '/aprendizaje-adaptativo/asignaciones',
    data,
    'Error al crear asignación adaptativa',
  );
}

export function aprobarAsignacionAprendizajeAdaptativo(id: number) {
  return post<AsignacionAprendizajeAdaptativo>(
    `/aprendizaje-adaptativo/${id}/aprobar`,
    {},
    'Error al aprobar asignación adaptativa',
  );
}

export function responderEntrevistaAprendizajeAdaptativo(
  id: number,
  respuestas: Array<{ preguntaId: string; respuesta: string }>,
) {
  return post<AsignacionAprendizajeAdaptativo>(
    `/aprendizaje-adaptativo/${id}/entrevista`,
    { respuestas },
    'Error al registrar entrevista adaptativa',
  );
}

export function iniciarRutaAprendizajeAdaptativo(id: number) {
  return post<AsignacionAprendizajeAdaptativo>(
    `/aprendizaje-adaptativo/${id}/iniciar`,
    {},
    'Error al iniciar ruta adaptativa',
  );
}

export function regenerarRutaAprendizajeAdaptativo(id: number) {
  return post<AsignacionAprendizajeAdaptativo>(
    `/aprendizaje-adaptativo/${id}/regenerar-ruta`,
    {},
    'Error al regenerar ruta adaptativa',
  );
}

export function actualizarPasoAprendizajeAdaptativo(
  id: number,
  indice: number,
  completado: boolean,
  pasoActual?: number,
) {
  return patchJson<AsignacionAprendizajeAdaptativo>(
    `/aprendizaje-adaptativo/${id}/pasos/${indice}`,
    { completado, pasoActual },
    'Error al actualizar paso adaptativo',
  );
}

export function enviarEvaluacionAprendizajeAdaptativo(
  id: number,
  respuestas: Array<{ preguntaId: string; respuesta: string }>,
) {
  return post<AsignacionAprendizajeAdaptativo>(
    `/aprendizaje-adaptativo/${id}/evaluacion`,
    { respuestas },
    'Error al enviar evaluación adaptativa',
  );
}

export function iniciarEvaluacionAprendizajeAdaptativo(id: number) {
  return post<AsignacionAprendizajeAdaptativo>(
    `/aprendizaje-adaptativo/${id}/evaluacion/iniciar`,
    {},
    'Error al iniciar evaluación adaptativa',
  );
}

export function guardarParcialEvaluacionAprendizajeAdaptativo(
  id: number,
  respuestas: Array<{ preguntaId: string; respuesta: string }>,
) {
  return post<AsignacionAprendizajeAdaptativo>(
    `/aprendizaje-adaptativo/${id}/evaluacion/parcial`,
    { respuestas },
    'Error al guardar evaluación parcial',
  );
}

export function cerrarEvaluacionAprendizajeAdaptativo(
  id: number,
  data: {
    respuestas?: Array<{ preguntaId: string; respuesta: string }>;
    motivo?: string;
  } = {},
) {
  return post<AsignacionAprendizajeAdaptativo>(
    `/aprendizaje-adaptativo/${id}/evaluacion/cerrar`,
    data,
    'Error al cerrar evaluación adaptativa',
  );
}

export function revisarAsignacionAprendizajeAdaptativo(
  id: number,
  data: { decision: 'completada' | 'reasignada'; observaciones?: string },
) {
  return post<AsignacionAprendizajeAdaptativo>(
    `/aprendizaje-adaptativo/${id}/revisar`,
    data,
    'Error al revisar asignación adaptativa',
  );
}

export function calificarAprendizajeAdaptativoComoEstudiante(
  id: number,
  data: { calificacion: number; comentario?: string },
) {
  return post<AsignacionAprendizajeAdaptativo>(
    `/aprendizaje-adaptativo/${id}/calificacion-estudiante`,
    data,
    'Error al guardar la calificación del estudiante',
  );
}

export function calificarAprendizajeAdaptativoComoDocente(
  id: number,
  data: { calificacion: number; comentario?: string },
) {
  return post<AsignacionAprendizajeAdaptativo>(
    `/aprendizaje-adaptativo/${id}/calificacion-docente`,
    data,
    'Error al guardar la calificación del docente',
  );
}

export function crearTipoAprendizajeAdaptativo(
  data: PayloadTipoAprendizajeAdaptativo,
) {
  return post<CatalogosAprendizajeAdaptativo['tiposAprendizaje'][number]>(
    '/aprendizaje-adaptativo/tipos',
    data,
    'Error al crear tipo de aprendizaje',
  );
}

export function inactivarTipoAprendizajeAdaptativo(id: number) {
  return patch<CatalogosAprendizajeAdaptativo['tiposAprendizaje'][number]>(
    `/aprendizaje-adaptativo/tipos/${id}/inactivar`,
    'Error al inactivar tipo de aprendizaje',
  );
}

export function obtenerForosAcademicos(query?: ConsultaPaginada) {
  return get<RespuestaPaginada<ForoAcademico>>(
    conQuery('/foros', query),
    'Error al obtener foros',
  );
}

export function obtenerCategoriasForo() {
  return get<Categoria[]>('/foros/categorias', 'Error al obtener categorías');
}

export function crearForoAcademico(data: CrearForoPayload) {
  return post<ForoAcademico>('/foros', data, 'Error al crear foro');
}

export function cerrarForoAcademico(id: number) {
  return patch<ForoAcademico>(`/foros/${id}/cerrar`, 'Error al cerrar foro');
}

export function comentarForoAcademico(id: number, contenido: string) {
  return post<ComentarioForo>(
    `/foros/${id}/comentarios`,
    { contenido },
    'Error al comentar foro',
  );
}

export async function comentarForoConRecurso(
  foroId: number,
  payload: ComentarForoConRecursoPayload,
) {
  const formData = new FormData();
  formData.append('contenido', payload.contenido);
  formData.append('archivo', payload.archivo);

  if (payload.titulo) {
    formData.append('titulo', payload.titulo);
  }

  if (payload.gradoEscolarId) {
    formData.append('gradoEscolarId', payload.gradoEscolarId);
  }

  const respuesta = await fetch(
    `${API_URL}/foros/${foroId}/comentarios/recurso`,
    {
      method: 'POST',
      headers: construirHeadersAutorizados(false),
      body: formData,
    },
  );

  return procesarRespuesta<ComentarioForo>(
    respuesta,
    'Error al comentar foro con recurso',
  );
}

export function comentarForoConRecursoExistente(
  foroId: number,
  payload: ComentarForoConRecursoExistentePayload,
) {
  return post<ComentarioForo>(
    `/foros/${foroId}/comentarios/recurso-existente`,
    payload,
    'Error al comentar foro con recurso existente',
  );
}

export async function subirRecursoForo(
  foroId: number,
  payload: SubirRecursoForoPayload,
) {
  const formData = new FormData();
  formData.append('archivo', payload.archivo);
  formData.append('contexto', payload.contexto);

  if (payload.titulo) {
    formData.append('titulo', payload.titulo);
  }

  if (payload.gradoEscolarId) {
    formData.append('gradoEscolarId', payload.gradoEscolarId);
  }

  if (payload.publicado !== undefined) {
    formData.append('publicado', String(payload.publicado));
  }

  const respuesta = await fetch(`${API_URL}/foros/${foroId}/recursos`, {
    method: 'POST',
    headers: construirHeadersAutorizados(false),
    body: formData,
  });

  return procesarRespuesta<{ mensaje: string; recurso: Recurso }>(
    respuesta,
    'Error al subir recurso desde foro',
  );
}

export async function subirArchivoRecurso(archivo: File) {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const respuesta = await fetch(`${API_URL}/recursos/subir-archivo`, {
    method: 'POST',
    headers: construirHeadersAutorizados(false),
    body: formData,
  });

  return procesarRespuesta<{ ruta: string }>(
    respuesta,
    'Error al subir archivo de recurso',
  );
}

export function obtenerCatalogosAulaColaborativa(query?: ConsultaPaginada) {
  return get<CatalogosAula>(
    conQuery('/aula-colaborativa/catalogos', query),
    'Error al obtener catálogos del aula colaborativa',
  );
}

export function obtenerProyectosAulaColaborativa(query?: ConsultaPaginada) {
  return get<RespuestaPaginada<ProyectoAula>>(
    conQuery('/aula-colaborativa', query),
    'Error al obtener proyectos del aula colaborativa',
  );
}

export function obtenerProyectoAulaColaborativa(id: number) {
  return get<ProyectoAula>(
    `/aula-colaborativa/${id}`,
    'Error al obtener proyecto colaborativo',
  );
}

export function crearProyectoAulaColaborativa(data: CrearProyectoAulaPayload) {
  return post<ProyectoAula>(
    '/aula-colaborativa',
    data,
    'Error al crear proyecto colaborativo',
  );
}

export function crearActividadAulaColaborativa(
  proyectoId: number,
  data: CrearActividadAulaPayload,
) {
  return post<ProyectoAula>(
    `/aula-colaborativa/${proyectoId}/actividades`,
    data,
    'Error al crear actividad colaborativa',
  );
}

export function actualizarEstadoActividadAula(
  proyectoId: number,
  actividadId: number,
  estado: string,
) {
  return patchJson<ProyectoAula>(
    `/aula-colaborativa/${proyectoId}/actividades/${actividadId}/estado`,
    { estado },
    'Error al actualizar actividad colaborativa',
  );
}

export async function subirEvidenciaAulaColaborativa(
  proyectoId: number,
  actividadId: number,
  archivo: File,
  comentario?: string,
) {
  const formData = new FormData();
  formData.append('archivo', archivo);

  if (comentario) {
    formData.append('comentario', comentario);
  }

  const respuesta = await fetch(
    `${API_URL}/aula-colaborativa/${proyectoId}/actividades/${actividadId}/evidencias`,
    {
      method: 'POST',
      headers: construirHeadersAutorizados(false),
      body: formData,
    },
  );

  return procesarRespuesta<ProyectoAula>(
    respuesta,
    'Error al subir evidencia colaborativa',
  );
}

export async function crearEntregaAulaColaborativa(
  proyectoId: number,
  archivo: File,
  comentario?: string,
) {
  const formData = new FormData();
  formData.append('archivo', archivo);

  if (comentario) {
    formData.append('comentario', comentario);
  }

  const respuesta = await fetch(
    `${API_URL}/aula-colaborativa/${proyectoId}/entregas`,
    {
      method: 'POST',
      headers: construirHeadersAutorizados(false),
      body: formData,
    },
  );

  return procesarRespuesta<ProyectoAula>(
    respuesta,
    'Error al registrar entrega colaborativa',
  );
}

export function revisarEntregaAulaColaborativa(
  proyectoId: number,
  entregaId: number,
  data: {
    estado: string;
    calificacion?: number;
    comentariosDocente?: string;
  },
) {
  return patchJson<ProyectoAula>(
    `/aula-colaborativa/${proyectoId}/entregas/${entregaId}/revisar`,
    data,
    'Error al revisar entrega colaborativa',
  );
}

export function crudFetch(path: string) {
  return get<any>(path, 'Error al cargar datos');
}

export function crudCreate(path: string, data: any) {
  return post<any>(path, data, 'Error al crear registro');
}

export function crudUpdate(path: string, id: number, data: any) {
  return put<any>(`${path}/${id}`, data, 'Error al actualizar registro');
}

export function crudToggle(path: string, id: number, activar: boolean) {
  return cambiarEstado<any>(path, id, activar ? 'reactivar' : 'inactivar');
}

export type AuditoriaLogItem = {
  id: string;
  entidad: string;
  entidadId: number | null;
  accion: string;
  usuarioId: number;
  institucionId: number | null;
  detalles: Record<string, unknown> | null;
  direccionIp: string | null;
  createdAt: string;
  usuario: {
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
  };
  institucion: {
    id: number;
    nombre: string;
  } | null;
};

export type EntidadAuditoria =
  | ''
  | 'recurso'
  | 'foro'
  | 'proyecto_colaborativo'
  | 'preparador_ia'
  | 'usuario'
  | 'institucion';

export function obtenerAuditoriaLogs(
  query?: ConsultaPaginada & { entidad?: string; entidadId?: string },
) {
  return get<RespuestaPaginada<AuditoriaLogItem>>(
    conQuery('/auditoria', query),
    'Error al obtener registros de auditoría',
  );
}

export async function descargarExcelAuditoria(query?: {
  entidad?: string;
  entidadId?: string;
}) {
  const token = obtenerToken();
  const queryString = construirQueryString(query as ConsultaPaginada);
  const respuesta = await fetch(
    `${API_URL}/auditoria/exportar-excel${queryString}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  if (!respuesta.ok) throw new Error('Error al descargar el archivo Excel');
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `auditoria-${Date.now()}.xlsx`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
