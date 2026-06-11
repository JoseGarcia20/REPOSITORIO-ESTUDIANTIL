import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  API_URL,
  actualizarPasoAprendizajeAdaptativo,
  aprobarAsignacionAprendizajeAdaptativo,
  calificarAprendizajeAdaptativoComoDocente,
  calificarAprendizajeAdaptativoComoEstudiante,
  cerrarEvaluacionAprendizajeAdaptativo,
  construirUrlArchivoProtegido,
  crearAsignacionAprendizajeAdaptativo,
  enviarEvaluacionAprendizajeAdaptativo,
  guardarParcialEvaluacionAprendizajeAdaptativo,
  iniciarEvaluacionAprendizajeAdaptativo,
  iniciarRutaAprendizajeAdaptativo,
  listarAsignacionesAprendizajeAdaptativo,
  obtenerCatalogosAprendizajeAdaptativo,
  obtenerUsuarioAutenticado,
  regenerarRutaAprendizajeAdaptativo,
  responderEntrevistaAprendizajeAdaptativo,
  revisarAsignacionAprendizajeAdaptativo,
} from '../../api/adminApi';
import { PantallaCarga } from '../../componentes/carga/pantallaCarga';
import type {
  AsignacionAprendizajeAdaptativo,
  CatalogosAprendizajeAdaptativo,
} from '../../api/adminApi';
import './aprendizajeAdaptativo.css';

type FormularioAsignacion = {
  estudianteId: string;
  docenteId: string;
  tema: string;
  objetivo: string;
  nivelSolicitado: string;
  fechaLimite: string;
};

type RespuestasTexto = Record<string, string>;

type RecursoRuta = {
  tipo?: string;
  titulo?: string;
  url?: string;
  embedUrl?: string;
  descripcion?: string;
  contenido?: string;
};

type PasoRuta = {
  id?: string;
  orden?: number;
  titulo?: string;
  objetivo?: string;
  categoriaPaso?: 'recurso' | 'actividad';
  estrategia?: string;
  tipoActividad?: string;
  descripcion?: string;
  actividad?: string;
  evidenciaEsperada?: string;
  recursos?: RecursoRuta[];
  completado?: boolean;
};

type Pregunta = {
  id: string;
  pregunta: string;
  criterio?: string;
  puntajeMaximo?: number;
};

const formularioInicial: FormularioAsignacion = {
  estudianteId: '',
  docenteId: '',
  tema: '',
  objetivo: '',
  nivelSolicitado: '',
  fechaLimite: '',
};

const etiquetasEstado: Record<string, string> = {
  asignada: 'Asignada',
  entrevista: 'Entrevista',
  ruta_generada: 'Ruta generada',
  en_curso: 'En curso',
  evaluacion: 'Evaluación',
  evaluada: 'Evaluada',
  revisada: 'Revisada',
  completada: 'Completada',
  reasignada: 'Reasignada',
};

const fasesRuta = [
  { estado: 'asignada', label: 'Asignación' },
  { estado: 'entrevista', label: 'Entrevista' },
  { estado: 'ruta_generada', label: 'Ruta' },
  { estado: 'en_curso', label: 'Estudio' },
  { estado: 'evaluacion', label: 'Evaluación' },
  { estado: 'evaluada', label: 'Revisión' },
  { estado: 'completada', label: 'Cierre' },
];

const CLAVE_EVALUACION_ACTIVA = 'nexora_evaluacion_adaptativa_activa';
type SubmoduloAdaptativo = 'asignar' | 'rutas';

function formatearFecha(valor?: string | null) {
  if (!valor) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
  }).format(new Date(valor));
}

function nombreUsuario(usuario?: {
  nombres?: string;
  apellidos?: string;
  correo?: string;
}) {
  const nombre = [usuario?.nombres, usuario?.apellidos]
    .filter(Boolean)
    .join(' ')
    .trim();

  return nombre || usuario?.correo || 'Usuario';
}

function obtenerPreguntasEntrevista(
  asignacion?: AsignacionAprendizajeAdaptativo | null,
): Pregunta[] {
  const preguntas = asignacion?.entrevistaPreguntas;
  return Array.isArray(preguntas)
    ? preguntas.map((pregunta) => ({
        id: String(pregunta.id),
        pregunta: String(pregunta.pregunta),
      }))
    : [];
}

function obtenerPasos(
  asignacion?: AsignacionAprendizajeAdaptativo | null,
): PasoRuta[] {
  const pasos = asignacion?.ruta?.pasos;
  return Array.isArray(pasos) ? pasos : [];
}

function obtenerPasoActual(
  asignacion?: AsignacionAprendizajeAdaptativo | null,
) {
  const pasos = obtenerPasos(asignacion);
  if (pasos.length === 0) {
    return 0;
  }

  if (
    asignacion?.estado === 'evaluacion' ||
    asignacion?.estado === 'evaluada'
  ) {
    return pasos.length;
  }

  const pasoActualRuta = Number(asignacion?.ruta?.pasoActual ?? -1);
  if (Number.isFinite(pasoActualRuta) && pasoActualRuta >= 0) {
    return Math.min(pasoActualRuta, pasos.length);
  }

  const primerPendiente = pasos.findIndex((paso) => !paso.completado);
  return primerPendiente >= 0 ? primerPendiente : pasos.length;
}

function obtenerRecursoPrincipal(paso?: PasoRuta | null) {
  const recursos = Array.isArray(paso?.recursos) ? paso?.recursos : [];
  return recursos[0] || null;
}

function esPasoActividad(paso?: PasoRuta | null, indice = 0) {
  if (paso?.categoriaPaso) {
    return paso.categoriaPaso === 'actividad';
  }

  return indice === 1 || indice === 3;
}

function etiquetaTipoRecurso(recurso?: RecursoRuta | null) {
  switch (recurso?.tipo) {
    case 'youtube':
      return 'Video guiado';
    case 'web':
      return 'Lectura externa';
    case 'mapa':
      return 'Mapa conceptual';
    case 'lectura':
      return 'Lectura guiada';
    case 'actividad':
      return 'Actividad';
    default:
      return 'Material';
  }
}

function etiquetaAccionRecurso(recurso?: RecursoRuta | null) {
  if (recurso?.tipo === 'web' || recurso?.tipo === 'lectura') {
    return 'Ver recurso aquí';
  }

  if (recurso?.tipo === 'youtube') {
    return 'Abrir en YouTube';
  }

  return 'Abrir recurso';
}

function descripcionPlazo(asignacion?: AsignacionAprendizajeAdaptativo | null) {
  if (asignacion?.ruta?.duracionEstimada) {
    return String(asignacion.ruta.duracionEstimada);
  }

  if (asignacion?.tiempoDisponible) {
    return String(asignacion.tiempoDisponible);
  }

  if (asignacion?.fechaLimite) {
    const hoy = new Date();
    const limite = new Date(asignacion.fechaLimite);
    hoy.setHours(0, 0, 0, 0);
    limite.setHours(0, 0, 0, 0);
    const dias = Math.max(
      1,
      Math.ceil((limite.getTime() - hoy.getTime()) / 86400000),
    );
    return dias === 1 ? '1 día disponible' : `${dias} días disponibles`;
  }

  return 'Tiempo flexible';
}

function descripcionPlazoDesdeFechaLimite(fechaLimite?: string) {
  if (!fechaLimite) {
    return '';
  }

  return descripcionPlazo({
    id: 0,
    tema: '',
    estado: 'asignada',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    institucionId: 0,
    docenteId: 0,
    estudianteId: 0,
    fechaLimite,
  } as AsignacionAprendizajeAdaptativo);
}

function obtenerPreguntasEvaluacion(
  asignacion?: AsignacionAprendizajeAdaptativo | null,
): Pregunta[] {
  const preguntas = asignacion?.evaluacion?.preguntas;
  return Array.isArray(preguntas)
    ? preguntas.map((pregunta) => ({
        id: String(pregunta.id),
        pregunta: String(pregunta.pregunta),
        criterio: pregunta.criterio ? String(pregunta.criterio) : undefined,
        puntajeMaximo: Number(pregunta.puntajeMaximo || 0),
      }))
    : [];
}

function obtenerEstadoEvaluacion(
  asignacion?: AsignacionAprendizajeAdaptativo | null,
) {
  const base =
    asignacion?.evaluacion &&
    typeof asignacion.evaluacion === 'object' &&
    !Array.isArray(asignacion.evaluacion)
      ? asignacion.evaluacion
      : {};

  return {
    ...base,
    preguntas: obtenerPreguntasEvaluacion(asignacion),
    tiempoMaximoMinutos: Number(base.tiempoMaximoMinutos || 30),
    iniciadaEn: base.iniciadaEn ? String(base.iniciadaEn) : null,
    limiteEn: base.limiteEn ? String(base.limiteEn) : null,
    cerradaEn: base.cerradaEn ? String(base.cerradaEn) : null,
    cierreMotivo: base.cierreMotivo ? String(base.cierreMotivo) : null,
    estado: base.estado ? String(base.estado) : 'pendiente',
    instrucciones: base.instrucciones
      ? String(base.instrucciones)
      : 'Responde con tus palabras y justifica cada respuesta.',
  };
}

function obtenerPorcentajes(
  asignacion?: AsignacionAprendizajeAdaptativo | null,
) {
  const porcentajes = asignacion?.perfilAprendizaje?.porcentajes;
  return Array.isArray(porcentajes) ? porcentajes : [];
}

function calcularAvance(asignacion: AsignacionAprendizajeAdaptativo) {
  const pasos = obtenerPasos(asignacion);
  if (pasos.length === 0) {
    return 0;
  }

  const completados = pasos.filter((paso) => paso.completado).length;
  return Math.round((completados / pasos.length) * 100);
}

function normalizarEstado(estado: string) {
  return etiquetasEstado[estado] || estado;
}

function indiceFase(estado: string) {
  if (estado === 'reasignada') {
    return 0;
  }

  const indice = fasesRuta.findIndex((fase) => fase.estado === estado);
  return indice >= 0 ? indice : 0;
}

function construirUrlDocumento(ruta?: string | null) {
  return construirUrlArchivoProtegido(ruta);
}

function formatearCuentaRegresiva(segundos: number) {
  const minutos = Math.floor(Math.max(0, segundos) / 60);
  const resto = Math.max(0, segundos) % 60;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

export function AprendizajeAdaptativo() {
  const usuario = obtenerUsuarioAutenticado();
  const esDocente = usuario?.rol?.nombre?.toLowerCase().includes('docente');
  const paginaEvaluacionIdRef = useRef(
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  );
  const [catalogos, setCatalogos] =
    useState<CatalogosAprendizajeAdaptativo | null>(null);
  const [asignaciones, setAsignaciones] = useState<
    AsignacionAprendizajeAdaptativo[]
  >([]);
  const [asignacionSeleccionadaId, setAsignacionSeleccionadaId] = useState<
    number | null
  >(null);
  const [formulario, setFormulario] =
    useState<FormularioAsignacion>(formularioInicial);
  const [respuestasEntrevista, setRespuestasEntrevista] =
    useState<RespuestasTexto>({});
  const [respuestasEvaluacion, setRespuestasEvaluacion] =
    useState<RespuestasTexto>({});
  const [revision, setRevision] = useState({
    decision: 'completada' as 'completada' | 'reasignada',
    observaciones: '',
  });
  const [valoracionEstudianteIA, setValoracionEstudianteIA] = useState(0);
  const [comentarioEstudianteIA, setComentarioEstudianteIA] = useState('');
  const [valoracionDocenteIA, setValoracionDocenteIA] = useState(0);
  const [comentarioDocenteIA, setComentarioDocenteIA] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [filtroGradoEstudiante, setFiltroGradoEstudiante] = useState('');
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(
    null,
  );
  const [evaluacionModalAbierta, setEvaluacionModalAbierta] = useState(false);
  const [confirmacionEvaluacionAbierta, setConfirmacionEvaluacionAbierta] =
    useState(false);
  const [submoduloActivo, setSubmoduloActivo] =
    useState<SubmoduloAdaptativo>('rutas');
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [rutaModalAbierta, setRutaModalAbierta] = useState(false);
  const [pasoRutaActivo, setPasoRutaActivo] = useState(0);
  const cierreAutomaticoRef = useRef<string>('');
  const cierreRecuperacionRef = useRef<number | null>(null);

  const puedeGestionar = Boolean(catalogos?.puedeGestionar);
  const esEstudiante = Boolean(catalogos?.esEstudiante);
  const estudiantesDisponibles = catalogos?.estudiantes || [];

  const gradosEstudiantesDisponibles = useMemo(() => {
    const grados = new Map<number, { id: number; nombre: string }>();

    estudiantesDisponibles.forEach((estudiante) => {
      if (estudiante.gradoEscolar) {
        grados.set(estudiante.gradoEscolar.id, estudiante.gradoEscolar);
      }
    });

    return Array.from(grados.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es'),
    );
  }, [estudiantesDisponibles]);

  const estudiantesFiltrados = useMemo(() => {
    const termino = busquedaEstudiante.trim().toLowerCase();

    return estudiantesDisponibles.filter((estudiante) => {
      const coincideGrado =
        !filtroGradoEstudiante ||
        String(estudiante.gradoEscolar?.id || '') === filtroGradoEstudiante;
      const texto = [
        estudiante.nombreCompleto,
        estudiante.correo,
        estudiante.gradoEscolar?.nombre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return coincideGrado && (!termino || texto.includes(termino));
    });
  }, [busquedaEstudiante, estudiantesDisponibles, filtroGradoEstudiante]);

  const asignacionesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) {
      return asignaciones;
    }

    return asignaciones.filter((asignacion) => {
      const texto = [
        asignacion.tema,
        asignacion.estado,
        nombreUsuario(asignacion.estudiante),
        nombreUsuario(asignacion.docente),
      ]
        .join(' ')
        .toLowerCase();

      return texto.includes(termino);
    });
  }, [asignaciones, busqueda]);

  const asignacionSeleccionada = useMemo(
    () =>
      asignaciones.find(
        (asignacion) => asignacion.id === asignacionSeleccionadaId,
      ) ||
      asignacionesFiltradas[0] ||
      null,
    [asignaciones, asignacionSeleccionadaId, asignacionesFiltradas],
  );
  const estadoEvaluacionSeleccionada = useMemo(
    () => obtenerEstadoEvaluacion(asignacionSeleccionada),
    [asignacionSeleccionada],
  );
  const evaluacionEnCurso = Boolean(
    asignacionSeleccionada &&
    asignacionSeleccionada.estado === 'evaluacion' &&
    estadoEvaluacionSeleccionada.iniciadaEn &&
    !estadoEvaluacionSeleccionada.cerradaEn,
  );
  const pasosSeleccionados = useMemo(
    () => obtenerPasos(asignacionSeleccionada),
    [asignacionSeleccionada],
  );
  const pasoActualSeleccionado = useMemo(
    () => obtenerPasoActual(asignacionSeleccionada),
    [asignacionSeleccionada],
  );
  const pasoRutaActual =
    rutaModalAbierta && pasoRutaActivo < pasosSeleccionados.length
      ? pasosSeleccionados[pasoRutaActivo]
      : null;
  const recursoPasoActual = obtenerRecursoPrincipal(pasoRutaActual);

  const indicadores = useMemo(() => {
    const activas = asignaciones.filter((item) =>
      ['entrevista', 'ruta_generada', 'en_curso', 'evaluacion'].includes(
        item.estado,
      ),
    ).length;
    const porRevisar = asignaciones.filter(
      (item) => item.estado === 'evaluada',
    ).length;
    const completadas = asignaciones.filter(
      (item) => item.estado === 'completada',
    ).length;

    return [
      { label: 'Rutas totales', value: asignaciones.length },
      { label: 'En proceso', value: activas },
      { label: 'Por revisar', value: porRevisar },
      { label: 'Completadas', value: completadas },
    ];
  }, [asignaciones]);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!asignacionSeleccionada) {
      return;
    }

    const entrevista = Array.isArray(
      asignacionSeleccionada.entrevistaRespuestas,
    )
      ? asignacionSeleccionada.entrevistaRespuestas.reduce(
          (acumulado: RespuestasTexto, item: any) => ({
            ...acumulado,
            [String(item.preguntaId)]: String(item.respuesta || ''),
          }),
          {},
        )
      : {};
    const evaluacion = Array.isArray(
      asignacionSeleccionada.respuestasEvaluacion,
    )
      ? asignacionSeleccionada.respuestasEvaluacion.reduce(
          (acumulado: RespuestasTexto, item: any) => ({
            ...acumulado,
            [String(item.preguntaId)]: String(item.respuesta || ''),
          }),
          {},
        )
      : {};

    setRespuestasEntrevista(entrevista);
    setRespuestasEvaluacion(evaluacion);
    setRevision({
      decision: 'completada',
      observaciones:
        asignacionSeleccionada.revisionDocente?.observaciones || '',
    });
    setValoracionEstudianteIA(
      Number(asignacionSeleccionada.calificacionEstudianteIA || 0),
    );
    setComentarioEstudianteIA(
      asignacionSeleccionada.comentarioEstudianteIA || '',
    );
    setValoracionDocenteIA(
      Number(asignacionSeleccionada.calificacionDocenteIA || 0),
    );
    setComentarioDocenteIA(asignacionSeleccionada.comentarioDocenteIA || '');
  }, [asignacionSeleccionada?.id]);

  useEffect(() => {
    if (!evaluacionEnCurso || !estadoEvaluacionSeleccionada.limiteEn) {
      setSegundosRestantes(null);
      cierreAutomaticoRef.current = '';
      return;
    }

    const actualizar = () => {
      const limite = new Date(
        estadoEvaluacionSeleccionada.limiteEn || '',
      ).getTime();
      const faltan = Math.floor((limite - Date.now()) / 1000);
      setSegundosRestantes(Math.max(0, faltan));
    };

    actualizar();
    const intervalo = window.setInterval(actualizar, 1000);
    return () => window.clearInterval(intervalo);
  }, [evaluacionEnCurso, estadoEvaluacionSeleccionada.limiteEn]);

  useEffect(() => {
    if (
      !evaluacionEnCurso ||
      !asignacionSeleccionada ||
      segundosRestantes !== 0
    ) {
      return;
    }

    if (cierreAutomaticoRef.current === String(asignacionSeleccionada.id)) {
      return;
    }
    cierreAutomaticoRef.current = String(asignacionSeleccionada.id);
    cerrarEvaluacionSilenciosa('tiempo');
  }, [evaluacionEnCurso, segundosRestantes, asignacionSeleccionada?.id]);

  useEffect(() => {
    if (!evaluacionEnCurso || !asignacionSeleccionada || !esEstudiante) {
      setEvaluacionModalAbierta(false);
      localStorage.removeItem(CLAVE_EVALUACION_ACTIVA);
      return;
    }

    localStorage.setItem(
      CLAVE_EVALUACION_ACTIVA,
      JSON.stringify({
        asignacionId: asignacionSeleccionada.id,
        paginaId: paginaEvaluacionIdRef.current,
        respuestas: Object.entries(respuestasEvaluacion).map(
          ([preguntaId, respuesta]) => ({
            preguntaId,
            respuesta,
          }),
        ),
      }),
    );
  }, [
    evaluacionEnCurso,
    esEstudiante,
    asignacionSeleccionada?.id,
    respuestasEvaluacion,
  ]);

  useEffect(() => {
    if (!evaluacionEnCurso || !asignacionSeleccionada || !esEstudiante) {
      return;
    }

    const intervalo = window.setInterval(() => {
      guardarParcialSilenciosa();
    }, 10000);

    return () => window.clearInterval(intervalo);
  }, [
    evaluacionEnCurso,
    esEstudiante,
    asignacionSeleccionada?.id,
    respuestasEvaluacion,
  ]);

  useEffect(() => {
    if (!evaluacionEnCurso || !asignacionSeleccionada || !esEstudiante) {
      return;
    }

    const cerrarAntesDeSalir = () => {
      const token = localStorage.getItem('token') || '';
      const respuestas = construirRespuestasEvaluacion();
      fetch(
        `${API_URL}/aprendizaje-adaptativo/${asignacionSeleccionada.id}/evaluacion/cerrar`,
        {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ respuestas, motivo: 'abandono' }),
        },
      ).catch(() => undefined);
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      cerrarAntesDeSalir();
    };
    const onPageHide = () => cerrarAntesDeSalir();
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [
    evaluacionEnCurso,
    esEstudiante,
    asignacionSeleccionada?.id,
    respuestasEvaluacion,
  ]);

  useEffect(() => {
    return () => {
      if (!evaluacionEnCurso || !asignacionSeleccionada || !esEstudiante) {
        return;
      }

      const token = localStorage.getItem('token') || '';
      if (!token) {
        return;
      }

      fetch(
        `${API_URL}/aprendizaje-adaptativo/${asignacionSeleccionada.id}/evaluacion/cerrar`,
        {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            respuestas: construirRespuestasEvaluacion(),
            motivo: 'abandono',
          }),
        },
      ).catch(() => undefined);
    };
  }, [evaluacionEnCurso, esEstudiante, asignacionSeleccionada?.id]);

  useEffect(() => {
    if (cargando || !esEstudiante || asignaciones.length === 0) {
      return;
    }

    const guardada = localStorage.getItem(CLAVE_EVALUACION_ACTIVA);
    if (!guardada) {
      return;
    }

    let payload: {
      asignacionId: number;
      paginaId?: string;
      respuestas?: Array<{ preguntaId: string; respuesta: string }>;
    } | null = null;

    try {
      payload = JSON.parse(guardada);
    } catch {
      localStorage.removeItem(CLAVE_EVALUACION_ACTIVA);
      return;
    }

    if (!payload?.asignacionId) {
      localStorage.removeItem(CLAVE_EVALUACION_ACTIVA);
      return;
    }

    if (payload.paginaId === paginaEvaluacionIdRef.current) {
      return;
    }

    if (cierreRecuperacionRef.current === payload.asignacionId) {
      return;
    }
    cierreRecuperacionRef.current = payload.asignacionId;

    const asignacionPendiente = asignaciones.find(
      (asignacion) => asignacion.id === Number(payload?.asignacionId),
    );

    if (!asignacionPendiente || asignacionPendiente.estado !== 'evaluacion') {
      localStorage.removeItem(CLAVE_EVALUACION_ACTIVA);
      return;
    }

    cerrarEvaluacionAprendizajeAdaptativo(asignacionPendiente.id, {
      respuestas: Array.isArray(payload.respuestas) ? payload.respuestas : [],
      motivo: 'abandono',
    })
      .then((actualizado) => {
        registrarAsignacionActualizada(actualizado);
        localStorage.removeItem(CLAVE_EVALUACION_ACTIVA);
        setMensaje(
          'Se detectó una evaluación activa previa y quedó cerrada automáticamente.',
        );
      })
      .catch(() => undefined);
  }, [cargando, esEstudiante, asignaciones]);

  useEffect(() => {
    if (evaluacionEnCurso) {
      setEvaluacionModalAbierta(true);
      return;
    }

    setEvaluacionModalAbierta(false);
  }, [evaluacionEnCurso]);

  useEffect(() => {
    if (!asignacionSeleccionada) {
      setDetalleAbierto(false);
      setRutaModalAbierta(false);
      return;
    }

    setPasoRutaActivo(obtenerPasoActual(asignacionSeleccionada));
  }, [asignacionSeleccionada?.id, asignacionSeleccionada?.updatedAt]);

  function construirRespuestasEvaluacion() {
    if (!asignacionSeleccionada) {
      return [];
    }

    return obtenerPreguntasEvaluacion(asignacionSeleccionada).map(
      (pregunta) => ({
        preguntaId: pregunta.id,
        respuesta: respuestasEvaluacion[pregunta.id] || '',
      }),
    );
  }

  async function guardarParcialSilenciosa() {
    if (!asignacionSeleccionada || !evaluacionEnCurso || !esEstudiante) {
      return;
    }

    const respuestas = construirRespuestasEvaluacion();
    if (respuestas.length === 0) {
      return;
    }

    try {
      await guardarParcialEvaluacionAprendizajeAdaptativo(
        asignacionSeleccionada.id,
        respuestas,
      );
    } catch {
      // Evita interrumpir la experiencia por fallos transitorios de red.
    }
  }

  async function cerrarEvaluacionSilenciosa(motivo: string) {
    if (!asignacionSeleccionada || !esEstudiante) {
      return;
    }

    try {
      const actualizado = await cerrarEvaluacionAprendizajeAdaptativo(
        asignacionSeleccionada.id,
        {
          respuestas: construirRespuestasEvaluacion(),
          motivo,
        },
      );
      registrarAsignacionActualizada(actualizado);
      localStorage.removeItem(CLAVE_EVALUACION_ACTIVA);
      setEvaluacionModalAbierta(false);
      if (motivo === 'tiempo') {
        setMensaje(
          'El tiempo de la evaluación terminó. Se cerró y se envió para revisión docente.',
        );
      }
    } catch {
      // El cierre se reintentará al siguiente ingreso del estudiante.
    }
  }

  function abrirDetalleAsignacion(asignacionId: number) {
    setAsignacionSeleccionadaId(asignacionId);
    setDetalleAbierto(true);
  }

  function cerrarDetalleAsignacion() {
    setDetalleAbierto(false);
  }

  async function abrirRutaGuiada() {
    if (!asignacionSeleccionada) {
      return;
    }

    try {
      setError('');
      let actualizada = asignacionSeleccionada;

      if (asignacionSeleccionada.estado === 'ruta_generada') {
        setProcesando('iniciar');
        actualizada = await iniciarRutaAprendizajeAdaptativo(
          asignacionSeleccionada.id,
        );
        registrarAsignacionActualizada(actualizada);
      }

      setPasoRutaActivo(obtenerPasoActual(actualizada));
      setRutaModalAbierta(true);
      setDetalleAbierto(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo iniciar la ruta.',
      );
    } finally {
      setProcesando('');
    }
  }

  async function guardarProgresoRutaActual() {
    if (!asignacionSeleccionada || !rutaModalAbierta) {
      return;
    }

    const pasos = obtenerPasos(asignacionSeleccionada);
    if (pasoRutaActivo >= pasos.length || !pasos[pasoRutaActivo]) {
      return;
    }

    try {
      const actualizada = await actualizarPasoAprendizajeAdaptativo(
        asignacionSeleccionada.id,
        pasoRutaActivo,
        Boolean(pasos[pasoRutaActivo].completado),
        pasoRutaActivo,
      );
      registrarAsignacionActualizada(actualizada);
    } catch {
      // Mantiene la experiencia fluida si la red falla en un cierre manual.
    }
  }

  async function cerrarRutaGuiada() {
    await guardarProgresoRutaActual();
    setRutaModalAbierta(false);
  }

  async function avanzarPasoGuiado() {
    if (!asignacionSeleccionada) {
      return;
    }

    const pasos = obtenerPasos(asignacionSeleccionada);
    if (!pasos[pasoRutaActivo]) {
      return;
    }

    try {
      setProcesando(`paso-${pasoRutaActivo}`);
      const siguientePaso = Math.min(pasoRutaActivo + 1, pasos.length);
      const actualizada = await actualizarPasoAprendizajeAdaptativo(
        asignacionSeleccionada.id,
        pasoRutaActivo,
        true,
        siguientePaso,
      );
      registrarAsignacionActualizada(actualizada);

      if (actualizada.estado === 'evaluacion') {
        setPasoRutaActivo(obtenerPasoActual(actualizada));
        return;
      }

      setPasoRutaActivo(siguientePaso);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo avanzar el paso.',
      );
    } finally {
      setProcesando('');
    }
  }

  async function irPasoAnterior() {
    if (!asignacionSeleccionada || pasoRutaActivo === 0) {
      return;
    }

    const pasos = obtenerPasos(asignacionSeleccionada);
    const nuevoPaso = Math.max(0, pasoRutaActivo - 1);

    try {
      const actualizada = await actualizarPasoAprendizajeAdaptativo(
        asignacionSeleccionada.id,
        pasoRutaActivo,
        Boolean(pasos[pasoRutaActivo]?.completado),
        nuevoPaso,
      );
      registrarAsignacionActualizada(actualizada);
      setPasoRutaActivo(nuevoPaso);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el progreso.',
      );
    }
  }

  async function cargarDatos() {
    try {
      setCargando(true);
      setError('');
      const [catalogosData, asignacionesData] = await Promise.all([
        obtenerCatalogosAprendizajeAdaptativo(),
        listarAsignacionesAprendizajeAdaptativo(),
      ]);

      setCatalogos(catalogosData);
      setAsignaciones(asignacionesData);
      setAsignacionSeleccionadaId(
        (actual) => actual || asignacionesData[0]?.id || null,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar aprendizaje adaptativo',
      );
    } finally {
      setCargando(false);
    }
  }

  function actualizarFormulario(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  }

  function registrarAsignacionActualizada(
    asignacion: AsignacionAprendizajeAdaptativo,
  ) {
    setAsignaciones((prev) => {
      const existe = prev.some((item) => item.id === asignacion.id);
      if (!existe) {
        return [asignacion, ...prev];
      }

      return prev.map((item) =>
        item.id === asignacion.id ? asignacion : item,
      );
    });
    setAsignacionSeleccionadaId(asignacion.id);
  }

  async function crearAsignacion(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMensaje('');

    if (!formulario.estudianteId || !formulario.tema.trim()) {
      setError('Selecciona un estudiante y escribe el tema de la ruta.');
      return;
    }

    if (!esDocente && !formulario.docenteId) {
      setError('Selecciona el docente responsable de la ruta.');
      return;
    }

    try {
      setProcesando('crear-asignacion');
      const asignacion = await crearAsignacionAprendizajeAdaptativo({
        estudianteId: Number(formulario.estudianteId),
        docenteId: formulario.docenteId
          ? Number(formulario.docenteId)
          : undefined,
        tema: formulario.tema.trim(),
        objetivo: formulario.objetivo.trim() || undefined,
        nivelSolicitado: formulario.nivelSolicitado || undefined,
        fechaLimite: formulario.fechaLimite || undefined,
      });

      registrarAsignacionActualizada(asignacion);
      setFormulario(formularioInicial);
      setMensaje('Ruta asignada correctamente.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo crear la ruta.',
      );
    } finally {
      setProcesando('');
    }
  }

  async function aprobarAsignacion() {
    if (!asignacionSeleccionada) {
      return;
    }

    try {
      setProcesando('aprobar');
      const asignacion = await aprobarAsignacionAprendizajeAdaptativo(
        asignacionSeleccionada.id,
      );
      registrarAsignacionActualizada(asignacion);
      setMensaje('Asignación aprobada. La entrevista está lista.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aprobar.');
    } finally {
      setProcesando('');
    }
  }

  async function enviarEntrevista(event: FormEvent) {
    event.preventDefault();
    if (!asignacionSeleccionada) {
      return;
    }

    const preguntas = obtenerPreguntasEntrevista(asignacionSeleccionada);
    const respuestas = preguntas.map((pregunta) => ({
      preguntaId: pregunta.id,
      respuesta: respuestasEntrevista[pregunta.id]?.trim() || '',
    }));

    if (respuestas.some((respuesta) => !respuesta.respuesta)) {
      setError('Responde todas las preguntas de la entrevista.');
      return;
    }

    try {
      setProcesando('entrevista');
      setError('');
      const asignacion = await responderEntrevistaAprendizajeAdaptativo(
        asignacionSeleccionada.id,
        respuestas,
      );
      registrarAsignacionActualizada(asignacion);
      setMensaje('Entrevista registrada. La ruta adaptativa quedó generada.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo registrar la entrevista.',
      );
    } finally {
      setProcesando('');
    }
  }

  async function iniciarEvaluacion() {
    if (!asignacionSeleccionada) {
      return;
    }

    try {
      setProcesando('iniciar-evaluacion');
      setError('');
      const asignacion = await iniciarEvaluacionAprendizajeAdaptativo(
        asignacionSeleccionada.id,
      );
      registrarAsignacionActualizada(asignacion);
      setConfirmacionEvaluacionAbierta(false);
      setEvaluacionModalAbierta(true);
      setMensaje('Evaluación iniciada. Dispones de 30 minutos.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar la evaluación.',
      );
    } finally {
      setProcesando('');
    }
  }

  async function regenerarRuta() {
    if (!asignacionSeleccionada) {
      return;
    }

    try {
      setProcesando('regenerar-ruta');
      setError('');
      const asignacion = await regenerarRutaAprendizajeAdaptativo(
        asignacionSeleccionada.id,
      );
      registrarAsignacionActualizada(asignacion);
      setMensaje('Ruta regenerada correctamente.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo regenerar la ruta.',
      );
    } finally {
      setProcesando('');
    }
  }

  async function enviarEvaluacion(event: FormEvent) {
    event.preventDefault();
    if (!asignacionSeleccionada) {
      return;
    }

    const respuestas = construirRespuestasEvaluacion().map((respuesta) => ({
      ...respuesta,
      respuesta: respuesta.respuesta.trim(),
    }));

    if (respuestas.some((respuesta) => !respuesta.respuesta)) {
      setError('Responde todas las preguntas de la evaluación.');
      return;
    }

    try {
      setProcesando('evaluacion');
      setError('');
      const asignacion = await enviarEvaluacionAprendizajeAdaptativo(
        asignacionSeleccionada.id,
        respuestas,
      );
      registrarAsignacionActualizada(asignacion);
      localStorage.removeItem(CLAVE_EVALUACION_ACTIVA);
      setEvaluacionModalAbierta(false);
      setMensaje('Evaluación enviada. El docente ya puede revisarla.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo enviar la evaluación.',
      );
    } finally {
      setProcesando('');
    }
  }

  async function revisarAsignacion(event: FormEvent) {
    event.preventDefault();
    if (!asignacionSeleccionada) {
      return;
    }

    try {
      setProcesando('revision');
      const asignacion = await revisarAsignacionAprendizajeAdaptativo(
        asignacionSeleccionada.id,
        {
          decision: revision.decision,
          observaciones: revision.observaciones.trim() || undefined,
        },
      );
      registrarAsignacionActualizada(asignacion);
      setMensaje('Revisión registrada correctamente.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo revisar la ruta.',
      );
    } finally {
      setProcesando('');
    }
  }

  async function enviarCalificacionEstudiante(event: FormEvent) {
    event.preventDefault();
    if (!asignacionSeleccionada || valoracionEstudianteIA < 1) {
      setError(
        'Selecciona una calificación para la ruta generada antes de guardar.',
      );
      return;
    }

    try {
      setProcesando('calificacion-estudiante');
      setError('');
      const asignacion = await calificarAprendizajeAdaptativoComoEstudiante(
        asignacionSeleccionada.id,
        {
          calificacion: valoracionEstudianteIA,
          comentario: comentarioEstudianteIA.trim() || undefined,
        },
      );
      registrarAsignacionActualizada(asignacion);
      setMensaje('Tu valoración de la ruta generada quedó registrada.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar la calificación.',
      );
    } finally {
      setProcesando('');
    }
  }

  async function enviarCalificacionDocente(event: FormEvent) {
    event.preventDefault();
    if (!asignacionSeleccionada || valoracionDocenteIA < 1) {
      setError(
        'Selecciona una calificación para el resultado generado antes de guardar.',
      );
      return;
    }

    try {
      setProcesando('calificacion-docente');
      setError('');
      const asignacion = await calificarAprendizajeAdaptativoComoDocente(
        asignacionSeleccionada.id,
        {
          calificacion: valoracionDocenteIA,
          comentario: comentarioDocenteIA.trim() || undefined,
        },
      );
      registrarAsignacionActualizada(asignacion);
      setMensaje(
        'La valoración docente del resultado generado quedó registrada.',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar la calificación.',
      );
    } finally {
      setProcesando('');
    }
  }

  function renderResultadoEvaluacion() {
    if (!asignacionSeleccionada?.resultadoEvaluacion) {
      return null;
    }

    return (
      <section className="adaptativo-section">
        <div className="adaptativo-section-title">
          <h3>Resultado de IA</h3>
          <p>{asignacionSeleccionada.resultadoEvaluacion.veredicto}</p>
        </div>
        <div className="adaptativo-score">
          <strong>
            {asignacionSeleccionada.resultadoEvaluacion.puntaje || 0}
          </strong>
          <span>/100</span>
        </div>
        <div className="adaptativo-two-columns">
          <div>
            <h4>Fortalezas</h4>
            <ul>
              {(
                asignacionSeleccionada.resultadoEvaluacion.fortalezas || []
              ).map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Oportunidades</h4>
            <ul>
              {(
                asignacionSeleccionada.resultadoEvaluacion.oportunidades || []
              ).map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="adaptativo-text">
          {asignacionSeleccionada.resultadoEvaluacion.recomendacion}
        </p>
        {asignacionSeleccionada.conclusionesPdf && (
          <a
            className="adaptativo-pdf-link"
            href={construirUrlDocumento(asignacionSeleccionada.conclusionesPdf)}
            target="_blank"
            rel="noreferrer"
          >
            Ver PDF de conclusiones
          </a>
        )}
        {esEstudiante &&
          Number(asignacionSeleccionada.estudianteId) ===
            Number(usuario?.id) && (
            <form
              className="adaptativo-section adaptativo-rating-panel"
              onSubmit={enviarCalificacionEstudiante}
            >
              <div className="adaptativo-section-title">
                <h3>Calificar la ruta generada con AI</h3>
                <p>
                  Valora si el diagnóstico, los pasos y la evaluación te
                  ayudaron a aprender el tema.
                </p>
              </div>
              <div className="adaptativo-rating-stars">
                {[1, 2, 3, 4, 5].map((valor) => (
                  <button
                    key={valor}
                    type="button"
                    className={valoracionEstudianteIA >= valor ? 'active' : ''}
                    onClick={() => setValoracionEstudianteIA(valor)}
                  >
                    {valor}
                  </button>
                ))}
              </div>
              {asignacionSeleccionada.calificacionEstudianteIA ? (
                <p className="adaptativo-rating-note">
                  Calificación registrada:{' '}
                  {asignacionSeleccionada.calificacionEstudianteIA}/5
                </p>
              ) : null}
              <label className="adaptativo-field full">
                <span>Comentario opcional</span>
                <textarea
                  rows={3}
                  value={comentarioEstudianteIA}
                  onChange={(event) =>
                    setComentarioEstudianteIA(event.target.value)
                  }
                  maxLength={1000}
                />
              </label>
              <button
                className="primary-button adaptativo-rating-submit"
                type="submit"
                disabled={procesando === 'calificacion-estudiante'}
              >
                Guardar valoración
              </button>
            </form>
          )}
      </section>
    );
  }

  function renderRevisionDocente() {
    if (!asignacionSeleccionada) {
      return null;
    }

    const puedeRevisar =
      puedeGestionar &&
      ['evaluada', 'revisada'].includes(asignacionSeleccionada.estado);

    if (!puedeRevisar) {
      return null;
    }

    return (
      <>
        <form className="adaptativo-section" onSubmit={revisarAsignacion}>
          <div className="adaptativo-section-title">
            <h3>Revisión docente</h3>
            <p>Cierre o reasignación de la ruta</p>
          </div>
          <div className="adaptativo-form-grid compact">
            <label className="adaptativo-field">
              <span>Decisión</span>
              <select
                value={revision.decision}
                onChange={(event) =>
                  setRevision((prev) => ({
                    ...prev,
                    decision: event.target.value as 'completada' | 'reasignada',
                  }))
                }
              >
                <option value="completada">Completada</option>
                <option value="reasignada">Reasignar refuerzo</option>
              </select>
            </label>
            <label className="adaptativo-field full">
              <span>Observaciones</span>
              <textarea
                rows={4}
                value={revision.observaciones}
                onChange={(event) =>
                  setRevision((prev) => ({
                    ...prev,
                    observaciones: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <button
            className="primary-button"
            type="submit"
            disabled={Boolean(procesando)}
          >
            Registrar revisión
          </button>
        </form>

        <form
          className="adaptativo-section adaptativo-rating-panel"
          onSubmit={enviarCalificacionDocente}
        >
          <div className="adaptativo-section-title">
            <h3>Calificar el resultado generado con AI</h3>
            <p>
              Valora la calidad del diagnóstico, la ruta y la evaluación
              entregada al estudiante.
            </p>
          </div>
          <div className="adaptativo-rating-stars">
            {[1, 2, 3, 4, 5].map((valor) => (
              <button
                key={valor}
                type="button"
                className={valoracionDocenteIA >= valor ? 'active' : ''}
                onClick={() => setValoracionDocenteIA(valor)}
              >
                {valor}
              </button>
            ))}
          </div>
          {asignacionSeleccionada.calificacionDocenteIA ? (
            <p className="adaptativo-rating-note">
              Calificación registrada:{' '}
              {asignacionSeleccionada.calificacionDocenteIA}/5
            </p>
          ) : null}
          <label className="adaptativo-field full">
            <span>Comentario opcional</span>
            <textarea
              rows={3}
              value={comentarioDocenteIA}
              onChange={(event) => setComentarioDocenteIA(event.target.value)}
              maxLength={1000}
            />
          </label>
          <button
            className="primary-button adaptativo-rating-submit"
            type="submit"
            disabled={procesando === 'calificacion-docente'}
          >
            Guardar valoración
          </button>
        </form>
      </>
    );
  }

  function renderDetalleAsignacion() {
    if (!asignacionSeleccionada) {
      return null;
    }

    const preguntasEntrevista = obtenerPreguntasEntrevista(
      asignacionSeleccionada,
    );
    const porcentajes = obtenerPorcentajes(asignacionSeleccionada);
    const puedeResponder =
      esEstudiante &&
      Number(asignacionSeleccionada.estudianteId) === Number(usuario?.id);
    const avance = calcularAvance(asignacionSeleccionada);
    const faseActual = indiceFase(asignacionSeleccionada.estado);
    const estadoEvaluacion = estadoEvaluacionSeleccionada;
    const puedeIniciarEvaluacion =
      puedeResponder &&
      asignacionSeleccionada.estado === 'evaluacion' &&
      !estadoEvaluacion.iniciadaEn &&
      !estadoEvaluacion.cerradaEn;

    return (
      <>
        <div className="adaptativo-modal-head adaptativo-detail-modal-head">
          <div>
            <span
              className={`adaptativo-status status-${asignacionSeleccionada.estado}`}
            >
              {normalizarEstado(asignacionSeleccionada.estado)}
            </span>
            <h3>{asignacionSeleccionada.tema}</h3>
            <p>
              {asignacionSeleccionada.objetivo ||
                'Ruta personalizada de aprendizaje.'}
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={cerrarDetalleAsignacion}
          >
            Cerrar
          </button>
        </div>

        <section className="adaptativo-section">
          <div className="adaptativo-detail-summary">
            <div className="adaptativo-progress">
              <span>{avance}%</span>
              <div>
                <i style={{ width: `${avance}%` }} />
              </div>
            </div>
            <div className="adaptativo-meta-grid">
              <div>
                <span>Estudiante</span>
                <strong>
                  {nombreUsuario(asignacionSeleccionada.estudiante)}
                </strong>
              </div>
              <div>
                <span>Docente</span>
                <strong>{nombreUsuario(asignacionSeleccionada.docente)}</strong>
              </div>
              <div>
                <span>Grado</span>
                <strong>
                  {asignacionSeleccionada.gradoEscolar?.nombre || 'Sin grado'}
                </strong>
              </div>
              <div>
                <span>Fecha límite</span>
                <strong>
                  {formatearFecha(asignacionSeleccionada.fechaLimite)}
                </strong>
              </div>
            </div>
          </div>
          <div className="adaptativo-phase-strip">
            {fasesRuta.map((fase, indice) => (
              <div
                key={fase.estado}
                className={
                  indice <= faseActual
                    ? 'adaptativo-phase active'
                    : 'adaptativo-phase'
                }
              >
                <span>{indice + 1}</span>
                <strong>{fase.label}</strong>
              </div>
            ))}
          </div>
        </section>

        {(porcentajes.length > 0 || asignacionSeleccionada.diagnostico) && (
          <div className="adaptativo-detail-grid">
            {porcentajes.length > 0 && (
              <section className="adaptativo-section">
                <div className="adaptativo-section-title">
                  <h3>Perfil de aprendizaje</h3>
                  <p>
                    {asignacionSeleccionada.perfilAprendizaje?.principal ||
                      'Perfil mixto'}
                  </p>
                </div>
                <div className="adaptativo-profile-bars">
                  {porcentajes.map((perfil: any) => (
                    <div key={perfil.tipo} className="adaptativo-profile-row">
                      <span>{perfil.tipo}</span>
                      <div>
                        <i
                          style={{
                            width: `${Number(perfil.porcentaje || 0)}%`,
                          }}
                        />
                      </div>
                      <strong>{perfil.porcentaje}%</strong>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {asignacionSeleccionada.diagnostico && (
              <section className="adaptativo-section">
                <div className="adaptativo-section-title">
                  <h3>Diagnóstico</h3>
                  <p>{asignacionSeleccionada.diagnostico.duracionEstimada}</p>
                </div>
                <p className="adaptativo-text">
                  {asignacionSeleccionada.diagnostico.justificacion}
                </p>
                <div className="adaptativo-tags">
                  <span>
                    {asignacionSeleccionada.diagnostico.nivelDificultad}
                  </span>
                  <span>{descripcionPlazo(asignacionSeleccionada)}</span>
                </div>
              </section>
            )}
          </div>
        )}

        {puedeResponder &&
          ['asignada', 'reasignada'].includes(
            asignacionSeleccionada.estado,
          ) && (
            <section className="adaptativo-action-panel">
              <h3>Aprobar asignación</h3>
              <p>
                Al aprobar, se abrirá la entrevista para construir la ruta
                personalizada.
              </p>
              <button
                className="primary-button"
                onClick={aprobarAsignacion}
                disabled={Boolean(procesando)}
              >
                Aprobar e iniciar entrevista
              </button>
            </section>
          )}

        {puedeResponder && asignacionSeleccionada.estado === 'entrevista' && (
          <form className="adaptativo-section" onSubmit={enviarEntrevista}>
            <div className="adaptativo-section-title">
              <h3>Entrevista adaptativa</h3>
              <p>5 preguntas para personalizar la ruta</p>
            </div>
            <div className="adaptativo-question-list">
              {preguntasEntrevista.map((pregunta) => (
                <label key={pregunta.id} className="adaptativo-field">
                  <span>{pregunta.pregunta}</span>
                  <textarea
                    value={respuestasEntrevista[pregunta.id] || ''}
                    onChange={(event) =>
                      setRespuestasEntrevista((prev) => ({
                        ...prev,
                        [pregunta.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    maxLength={1200}
                  />
                </label>
              ))}
            </div>
            <button
              className="primary-button"
              type="submit"
              disabled={Boolean(procesando)}
            >
              Generar ruta con IA
            </button>
          </form>
        )}

        {pasosSeleccionados.length === 0 &&
          Array.isArray(asignacionSeleccionada.entrevistaRespuestas) &&
          asignacionSeleccionada.entrevistaRespuestas.length > 0 && (
            <section className="adaptativo-action-panel">
              <h3>Ruta pendiente por estructurar</h3>
              <p>
                La entrevista ya está registrada. Puedes generar nuevamente el
                perfil, los 5 pasos de estudio y la evaluación final.
              </p>
              <button
                className="primary-button"
                type="button"
                onClick={regenerarRuta}
                disabled={Boolean(procesando)}
              >
                Regenerar ruta adaptativa
              </button>
            </section>
          )}

        {pasosSeleccionados.length > 0 && (
          <section className="adaptativo-section">
            <div className="adaptativo-section-title">
              <div>
                <h3>
                  {asignacionSeleccionada.ruta?.titulo || 'Ruta adaptativa'}
                </h3>
                <p>
                  {asignacionSeleccionada.ruta?.duracionEstimada}
                  {asignacionSeleccionada.estado === 'en_curso' &&
                    ` · retomando desde el paso ${Math.min(
                      pasoActualSeleccionado + 1,
                      pasosSeleccionados.length,
                    )}`}
                </p>
              </div>
              {puedeResponder && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={abrirRutaGuiada}
                  disabled={Boolean(procesando)}
                >
                  {asignacionSeleccionada.estado === 'ruta_generada'
                    ? 'Iniciar ruta'
                    : asignacionSeleccionada.estado === 'en_curso'
                      ? 'Continuar ruta'
                      : asignacionSeleccionada.estado === 'evaluacion' &&
                          !estadoEvaluacion.iniciadaEn &&
                          !estadoEvaluacion.cerradaEn
                        ? 'Abrir paso final'
                        : 'Ver recorrido'}
                </button>
              )}
            </div>
            <div className="adaptativo-step-outline">
              {pasosSeleccionados.map((paso, indice) => {
                const recurso = obtenerRecursoPrincipal(paso);
                return (
                  <article
                    key={paso.id || indice}
                    className={`adaptativo-step adaptativo-step-outline-card ${
                      paso.completado ? 'done' : ''
                    }`}
                  >
                    <div className="adaptativo-step-head">
                      <span>{indice + 1}</span>
                      <div>
                        <h4>{paso.titulo}</h4>
                        <p>{paso.objetivo}</p>
                      </div>
                    </div>
                    <div className="adaptativo-tags">
                      <span>
                        {esPasoActividad(paso, indice)
                          ? 'Actividad'
                          : 'Recurso'}
                      </span>
                      <span>{paso.tipoActividad || 'Bloque guiado'}</span>
                    </div>
                    <p className="adaptativo-text">{paso.descripcion}</p>
                    <div className="adaptativo-outline-resource">
                      <strong>{recurso?.titulo || 'Material del paso'}</strong>
                      <small>{etiquetaTipoRecurso(recurso)}</small>
                    </div>
                  </article>
                );
              })}
              <article
                className={`adaptativo-step adaptativo-step-outline-card ${
                  asignacionSeleccionada.estado === 'evaluada' ||
                  asignacionSeleccionada.estado === 'completada'
                    ? 'done'
                    : ''
                }`}
              >
                <div className="adaptativo-step-head">
                  <span>6</span>
                  <div>
                    <h4>Evaluación final</h4>
                    <p>Validación de comprensión del tema completo.</p>
                  </div>
                </div>
                <div className="adaptativo-tags">
                  <span>Evaluación</span>
                  <span>30 minutos</span>
                </div>
                <p className="adaptativo-text">
                  Este paso se habilita cuando el estudiante completa los cinco
                  bloques de la ruta.
                </p>
              </article>
            </div>
          </section>
        )}

        {puedeIniciarEvaluacion && (
          <section className="adaptativo-action-panel">
            <h3>Evaluación final disponible</h3>
            <p>
              Ya completaste todos los pasos. La evaluación se abrirá en una
              vista dedicada con 30 minutos para responder.
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setDetalleAbierto(false);
                setConfirmacionEvaluacionAbierta(true);
              }}
              disabled={Boolean(procesando)}
            >
              Realizar evaluación
            </button>
          </section>
        )}

        {evaluacionEnCurso && !evaluacionModalAbierta && (
          <section className="adaptativo-action-panel">
            <h3>Evaluación en curso</h3>
            <p>
              La evaluación ya fue iniciada. Tienes{' '}
              {formatearCuentaRegresiva(segundosRestantes || 0)} para
              completarla.
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setDetalleAbierto(false);
                setEvaluacionModalAbierta(true);
              }}
            >
              Volver a la evaluación
            </button>
          </section>
        )}

        {puedeResponder &&
          asignacionSeleccionada.estado === 'evaluacion' &&
          estadoEvaluacion.cerradaEn &&
          !evaluacionEnCurso && (
            <section className="adaptativo-action-panel">
              <h3>Evaluación cerrada</h3>
              <p>
                La evaluación ya fue cerrada y enviada para revisión docente.
              </p>
            </section>
          )}

        {renderResultadoEvaluacion()}
        {renderRevisionDocente()}
      </>
    );
  }

  if (cargando) {
    return (
      <PantallaCarga
        mensaje="Cargando aprendizaje adaptativo"
        detalle="Estamos preparando rutas, perfiles y asignaciones."
      />
    );
  }

  return (
    <div className="adaptativo-page">
      <header className="adaptativo-header">
        <div>
          <span className="section-label">Herramientas IA</span>
          <h1>Aprendizaje adaptativo</h1>
          <p>
            Rutas personalizadas por perfil de aprendizaje, entrevista inicial,
            recursos externos y evaluación asistida por IA.
          </p>
        </div>
      </header>

      {(error || mensaje) && (
        <div className={`adaptativo-alert ${error ? 'error' : 'success'}`}>
          {error || mensaje}
        </div>
      )}

      {procesando && (
        <div className="adaptativo-alert info">
          {procesando === 'entrevista' || procesando === 'regenerar-ruta'
            ? 'La IA está definiendo el perfil de aprendizaje y estructurando la ruta paso a paso.'
            : 'Procesando la acción solicitada.'}
        </div>
      )}

      <section className="adaptativo-kpis">
        {indicadores.map((indicador) => (
          <article key={indicador.label}>
            <span>{indicador.label}</span>
            <strong>{indicador.value}</strong>
          </article>
        ))}
      </section>

      <section className="adaptativo-tabs">
        {puedeGestionar && (
          <button
            type="button"
            className={submoduloActivo === 'asignar' ? 'active' : ''}
            onClick={() => setSubmoduloActivo('asignar')}
          >
            Asignar ruta
          </button>
        )}
        <button
          type="button"
          className={submoduloActivo === 'rutas' ? 'active' : ''}
          onClick={() => setSubmoduloActivo('rutas')}
        >
          Rutas asignadas
        </button>
      </section>

      {puedeGestionar && submoduloActivo === 'asignar' && (
        <section className="adaptativo-panel">
          <div className="adaptativo-section-title">
            <h2>Asignar nueva ruta</h2>
          </div>
          <form className="adaptativo-form-grid" onSubmit={crearAsignacion}>
            <div className="adaptativo-field full adaptativo-student-picker">
              <span>Estudiante</span>
              <div className="adaptativo-student-picker-tools">
                <input
                  value={busquedaEstudiante}
                  onChange={(event) =>
                    setBusquedaEstudiante(event.target.value)
                  }
                  placeholder="Buscar por nombre o correo"
                />
                <select
                  value={filtroGradoEstudiante}
                  onChange={(event) =>
                    setFiltroGradoEstudiante(event.target.value)
                  }
                >
                  <option value="">Todos los grados</option>
                  {gradosEstudiantesDisponibles.map((grado) => (
                    <option key={grado.id} value={grado.id}>
                      {grado.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="table-responsive adaptativo-student-table-wrap">
                <table className="data-table adaptativo-student-table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Grado</th>
                      <th>Correo</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="empty-table">
                          No hay estudiantes que coincidan con el filtro.
                        </td>
                      </tr>
                    ) : (
                      estudiantesFiltrados.map((estudiante) => {
                        const seleccionado =
                          formulario.estudianteId === String(estudiante.id);

                        return (
                          <tr
                            key={estudiante.id}
                            className={
                              seleccionado ? 'selected-resource-row' : ''
                            }
                          >
                            <td data-label="Estudiante">
                              {estudiante.nombreCompleto}
                            </td>
                            <td data-label="Grado">
                              {estudiante.gradoEscolar?.nombre || 'Sin grado'}
                            </td>
                            <td data-label="Correo">{estudiante.correo}</td>
                            <td data-label="Acción">
                              <button
                                type="button"
                                className="secondary-button ai-resource-select-button"
                                onClick={() =>
                                  setFormulario((prev) => ({
                                    ...prev,
                                    estudianteId: String(estudiante.id),
                                  }))
                                }
                                disabled={seleccionado}
                              >
                                {seleccionado ? 'Seleccionado' : 'Elegir'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <label className="adaptativo-field">
              <span>Docente responsable</span>
              <select
                name="docenteId"
                value={formulario.docenteId}
                onChange={actualizarFormulario}
              >
                <option value="">
                  {esDocente
                    ? 'Yo como docente responsable'
                    : 'Seleccionar docente'}
                </option>
                {catalogos?.docentes.map((docente) => (
                  <option key={docente.id} value={docente.id}>
                    {docente.nombreCompleto}
                  </option>
                ))}
              </select>
            </label>
            <label className="adaptativo-field full">
              <span>Tema específico</span>
              <input
                name="tema"
                value={formulario.tema}
                onChange={actualizarFormulario}
                maxLength={220}
                placeholder="Ej. Ecuaciones cuadráticas con aplicaciones"
              />
            </label>
            <label className="adaptativo-field full">
              <span>Objetivo esperado</span>
              <textarea
                name="objetivo"
                value={formulario.objetivo}
                onChange={actualizarFormulario}
                rows={3}
                maxLength={600}
              />
            </label>
            <label className="adaptativo-field">
              <span>Nivel solicitado</span>
              <select
                name="nivelSolicitado"
                value={formulario.nivelSolicitado}
                onChange={actualizarFormulario}
              >
                <option value="">La IA lo define</option>
                <option value="básico">Básico</option>
                <option value="medio">Medio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </label>
            <label className="adaptativo-field">
              <span>Fecha límite</span>
              <input
                type="date"
                name="fechaLimite"
                value={formulario.fechaLimite}
                onChange={actualizarFormulario}
              />
            </label>
            <label className="adaptativo-field">
              <span>Plazo estimado</span>
              <input
                value={descripcionPlazoDesdeFechaLimite(formulario.fechaLimite)}
                readOnly
              />
            </label>
            <div className="adaptativo-form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={procesando === 'crear-asignacion'}
              >
                Asignar ruta
              </button>
            </div>
          </form>
        </section>
      )}

      {submoduloActivo === 'rutas' && (
        <section className="adaptativo-panel">
          <div className="adaptativo-list-tools adaptativo-list-tools-wide">
            <div>
              <h2>
                {esEstudiante ? 'Mis rutas asignadas' : 'Rutas asignadas'}
              </h2>
              <p className="adaptativo-muted">
                Consulta el estado de cada ruta y abre su detalle en una vista
                dedicada.
              </p>
            </div>
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por tema, estudiante o estado"
            />
          </div>

          {asignacionesFiltradas.length === 0 ? (
            <div className="adaptativo-empty adaptativo-empty-panel">
              <span>AI</span>
              <h2>No hay rutas para mostrar</h2>
              <p>
                Cuando exista una asignación de aprendizaje adaptativo,
                aparecerá aquí con su progreso y estado.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table adaptativo-route-table">
                <thead>
                  <tr>
                    <th>Tema</th>
                    <th>Estudiante</th>
                    <th>Docente</th>
                    <th>Estado</th>
                    <th>Progreso</th>
                    <th>Fecha límite</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {asignacionesFiltradas.map((asignacion) => (
                    <tr key={asignacion.id}>
                      <td data-label="Tema">
                        <strong>{asignacion.tema}</strong>
                        <small>
                          {asignacion.objetivo ||
                            'Ruta personalizada de aprendizaje'}
                        </small>
                      </td>
                      <td data-label="Estudiante">
                        {nombreUsuario(asignacion.estudiante)}
                      </td>
                      <td data-label="Docente">
                        {nombreUsuario(asignacion.docente)}
                      </td>
                      <td data-label="Estado">
                        <span
                          className={`adaptativo-status status-${asignacion.estado}`}
                        >
                          {normalizarEstado(asignacion.estado)}
                        </span>
                      </td>
                      <td data-label="Progreso">
                        {calcularAvance(asignacion)}%
                      </td>
                      <td data-label="Fecha límite">
                        {formatearFecha(asignacion.fechaLimite)}
                      </td>
                      <td data-label="Acción">
                        <button
                          type="button"
                          className="secondary-button adaptativo-route-table-button"
                          onClick={() => abrirDetalleAsignacion(asignacion.id)}
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {detalleAbierto && asignacionSeleccionada && (
        <div
          className="adaptativo-modal-backdrop"
          role="presentation"
          onClick={cerrarDetalleAsignacion}
        >
          <div
            className="adaptativo-modal adaptativo-detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            {renderDetalleAsignacion()}
          </div>
        </div>
      )}

      {rutaModalAbierta && asignacionSeleccionada && (
        <div
          className="adaptativo-modal-backdrop adaptativo-evaluacion-backdrop"
          role="presentation"
          onClick={() => undefined}
        >
          <div
            className="adaptativo-modal adaptativo-route-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="adaptativo-modal-head adaptativo-route-modal-head">
              <div>
                <span className="adaptativo-status status-en_curso">
                  {pasoRutaActivo < pasosSeleccionados.length
                    ? `Paso ${pasoRutaActivo + 1} de ${pasosSeleccionados.length + 1}`
                    : `Paso ${pasosSeleccionados.length + 1} de ${pasosSeleccionados.length + 1}`}
                </span>
                <h3>{asignacionSeleccionada.tema}</h3>
                <p>
                  {pasoRutaActivo < pasosSeleccionados.length
                    ? 'La ruta se desarrolla paso a paso. Si cierras esta ventana, retomaremos desde este bloque.'
                    : 'Terminaste el recorrido de estudio. Solo falta la evaluación final.'}
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={cerrarRutaGuiada}
              >
                Cerrar
              </button>
            </div>

            {pasoRutaActivo < pasosSeleccionados.length && pasoRutaActual ? (
              <div className="adaptativo-route-shell">
                <section className="adaptativo-route-stage">
                  <div className="adaptativo-step-head adaptativo-route-step-head">
                    <span>{pasoRutaActivo + 1}</span>
                    <div className="adaptativo-route-step-copy">
                      <h4>{pasoRutaActual.titulo}</h4>
                      <p>{pasoRutaActual.objetivo}</p>
                    </div>
                  </div>
                  <div className="adaptativo-tags">
                    <span>
                      {esPasoActividad(pasoRutaActual, pasoRutaActivo)
                        ? 'Actividad'
                        : 'Recurso'}
                    </span>
                    <span>
                      {pasoRutaActual.tipoActividad || 'Bloque guiado'}
                    </span>
                    <span>
                      {pasoRutaActual.estrategia ||
                        'Acompañamiento personalizado'}
                    </span>
                  </div>
                  <p className="adaptativo-text">
                    {pasoRutaActual.descripcion}
                  </p>
                  <div className="adaptativo-route-emphasis">
                    <strong>Actividad del paso</strong>
                    <p>{pasoRutaActual.actividad}</p>
                  </div>
                  <div className="adaptativo-route-emphasis">
                    <strong>Evidencia esperada</strong>
                    <p>{pasoRutaActual.evidenciaEsperada}</p>
                  </div>
                </section>

                <section className="adaptativo-route-resource">
                  <div className="adaptativo-section-title adaptativo-route-resource-head">
                    <div className="adaptativo-route-resource-copy">
                      <h3>
                        {recursoPasoActual?.titulo || 'Material del paso'}
                      </h3>
                      <p>{etiquetaTipoRecurso(recursoPasoActual)}</p>
                    </div>
                  </div>

                  {recursoPasoActual?.descripcion && (
                    <p className="adaptativo-text">
                      {recursoPasoActual.descripcion}
                    </p>
                  )}

                  {recursoPasoActual?.tipo === 'youtube' &&
                    recursoPasoActual.embedUrl && (
                      <iframe
                        src={recursoPasoActual.embedUrl}
                        title={recursoPasoActual.titulo || 'Video sugerido'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}

                  {recursoPasoActual?.url &&
                    recursoPasoActual?.tipo !== 'youtube' && (
                      <div className="adaptativo-link-card">
                        <div>
                          <strong>Recurso listo para consultar</strong>
                          <p>
                            Ábrelo en una pestaña aparte para revisar la lectura
                            o referencia completa.
                          </p>
                        </div>
                        <a
                          className="secondary-button adaptativo-resource-link adaptativo-inline-action"
                          href={recursoPasoActual.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {etiquetaAccionRecurso(recursoPasoActual)}
                        </a>
                      </div>
                    )}

                  {recursoPasoActual?.contenido && (
                    <div
                      className={`adaptativo-material-preview adaptativo-route-material tipo-${recursoPasoActual.tipo}`}
                    >
                      {recursoPasoActual.contenido
                        .split('\n')
                        .filter(Boolean)
                        .map((linea) => (
                          <article key={linea}>
                            <span />
                            <p>{linea}</p>
                          </article>
                        ))}
                    </div>
                  )}
                </section>

                <div className="adaptativo-modal-actions adaptativo-route-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={irPasoAnterior}
                    disabled={pasoRutaActivo === 0 || Boolean(procesando)}
                  >
                    Paso anterior
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={avanzarPasoGuiado}
                    disabled={procesando === `paso-${pasoRutaActivo}`}
                  >
                    Marcar paso como listo
                  </button>
                </div>
              </div>
            ) : (
              <div className="adaptativo-route-shell adaptativo-route-shell-final">
                <section className="adaptativo-route-final-card">
                  <div className="adaptativo-route-final-badge">6</div>
                  <div className="adaptativo-route-final-copy">
                    <div>
                      <span className="adaptativo-status status-evaluacion">
                        Evaluación final
                      </span>
                      <h4>Evaluación final</h4>
                      <p>
                        Es el cierre formal de la ruta para verificar
                        comprensión.
                      </p>
                    </div>
                    <div className="adaptativo-route-final-grid">
                      <article>
                        <strong>Recorrido completado</strong>
                        <p>
                          Finalizaste los cinco bloques de estudio. El siguiente
                          paso valida comprensión, aplicación y claridad
                          conceptual.
                        </p>
                      </article>
                      <article>
                        <strong>Tiempo disponible</strong>
                        <p>
                          Tendrás 30 minutos desde el momento en que inicies la
                          evaluación.
                        </p>
                      </article>
                      <article>
                        <strong>Regla de cierre</strong>
                        <p>
                          Si sales de la plataforma, se guardará lo respondido y
                          la evaluación quedará cerrada.
                        </p>
                      </article>
                    </div>
                  </div>
                </section>
                <div className="adaptativo-modal-actions adaptativo-route-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setPasoRutaActivo(
                        Math.max(0, pasosSeleccionados.length - 1),
                      )
                    }
                  >
                    Volver al paso anterior
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setRutaModalAbierta(false);
                      setConfirmacionEvaluacionAbierta(true);
                    }}
                  >
                    Ir a la evaluación
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmacionEvaluacionAbierta && (
        <div
          className="adaptativo-modal-backdrop"
          role="presentation"
          onClick={() => setConfirmacionEvaluacionAbierta(false)}
        >
          <div
            className="adaptativo-modal adaptativo-confirm-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="adaptativo-modal-head">
              <h3>Confirmar evaluación</h3>
            </div>
            <div className="adaptativo-confirm-copy">
              <p>
                Tendrás solo 30 minutos para responder la evaluación completa.
              </p>
              <p>
                Si cierras la página, cambias de módulo o sales de la sesión, se
                guardará lo que lleves respondido y no podrás seguir
                contestando.
              </p>
            </div>
            <div className="adaptativo-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmacionEvaluacionAbierta(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={iniciarEvaluacion}
                disabled={Boolean(procesando)}
              >
                Iniciar ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {evaluacionModalAbierta &&
        evaluacionEnCurso &&
        asignacionSeleccionada && (
          <div className="adaptativo-modal-backdrop adaptativo-evaluacion-backdrop">
            <div
              className="adaptativo-modal adaptativo-evaluacion-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <form
                className="adaptativo-evaluacion-shell"
                onSubmit={enviarEvaluacion}
              >
                <div className="adaptativo-evaluacion-head">
                  <div>
                    <span className="adaptativo-status status-evaluacion">
                      Evaluación en curso
                    </span>
                    <h3>{asignacionSeleccionada.tema}</h3>
                    <p>{estadoEvaluacionSeleccionada.instrucciones}</p>
                  </div>
                  <div className="adaptativo-timer-panel">
                    <strong>
                      Tiempo restante:{' '}
                      {formatearCuentaRegresiva(segundosRestantes || 0)}
                    </strong>
                    <span>
                      Si sales de esta vista, se conservará lo respondido y la
                      evaluación quedará cerrada.
                    </span>
                  </div>
                </div>

                <div className="adaptativo-question-list adaptativo-question-list-modal">
                  {obtenerPreguntasEvaluacion(asignacionSeleccionada).map(
                    (pregunta) => (
                      <label key={pregunta.id} className="adaptativo-field">
                        <span>{pregunta.pregunta}</span>
                        {pregunta.criterio && (
                          <small>Criterio: {pregunta.criterio}</small>
                        )}
                        <textarea
                          value={respuestasEvaluacion[pregunta.id] || ''}
                          onChange={(event) =>
                            setRespuestasEvaluacion((prev) => ({
                              ...prev,
                              [pregunta.id]: event.target.value,
                            }))
                          }
                          rows={5}
                          maxLength={1600}
                        />
                      </label>
                    ),
                  )}
                </div>

                <div className="adaptativo-modal-actions">
                  <button
                    type="submit"
                    className="primary-button adaptativo-evaluacion-submit"
                    disabled={Boolean(procesando)}
                  >
                    Enviar evaluación
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
