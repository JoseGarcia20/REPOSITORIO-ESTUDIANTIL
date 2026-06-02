import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  API_URL,
  actualizarPasoAprendizajeAdaptativo,
  aprobarAsignacionAprendizajeAdaptativo,
  cerrarEvaluacionAprendizajeAdaptativo,
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
  tiempoDisponible: string;
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

type RecursoAbierto = {
  tipo: string;
  titulo: string;
  descripcion?: string;
  contenido?: string;
};

type PasoRuta = {
  id?: string;
  orden?: number;
  titulo?: string;
  objetivo?: string;
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
  tiempoDisponible: '',
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

function formatearFecha(valor?: string | null) {
  if (!valor) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
  }).format(new Date(valor));
}

function nombreUsuario(usuario?: { nombres?: string; apellidos?: string; correo?: string }) {
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

function obtenerEstadoEvaluacion(asignacion?: AsignacionAprendizajeAdaptativo | null) {
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

function obtenerPorcentajes(asignacion?: AsignacionAprendizajeAdaptativo | null) {
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
  if (!ruta) {
    return '';
  }

  return ruta.startsWith('http') ? ruta : `${API_URL}${ruta}`;
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
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const [recursoAbierto, setRecursoAbierto] = useState<RecursoAbierto | null>(null);
  const [evaluacionModalAbierta, setEvaluacionModalAbierta] = useState(false);
  const [confirmacionEvaluacionAbierta, setConfirmacionEvaluacionAbierta] =
    useState(false);
  const [videosAbiertos, setVideosAbiertos] = useState<Record<string, boolean>>({});
  const cierreAutomaticoRef = useRef<string>('');
  const cierreRecuperacionRef = useRef<number | null>(null);

  const puedeGestionar = Boolean(catalogos?.puedeGestionar);
  const esEstudiante = Boolean(catalogos?.esEstudiante);

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

    const entrevista = Array.isArray(asignacionSeleccionada.entrevistaRespuestas)
      ? asignacionSeleccionada.entrevistaRespuestas.reduce(
          (acumulado: RespuestasTexto, item: any) => ({
            ...acumulado,
            [String(item.preguntaId)]: String(item.respuesta || ''),
          }),
          {},
        )
      : {};
    const evaluacion = Array.isArray(asignacionSeleccionada.respuestasEvaluacion)
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
      observaciones: asignacionSeleccionada.revisionDocente?.observaciones || '',
    });
  }, [asignacionSeleccionada?.id]);

  useEffect(() => {
    if (!evaluacionEnCurso || !estadoEvaluacionSeleccionada.limiteEn) {
      setSegundosRestantes(null);
      cierreAutomaticoRef.current = '';
      return;
    }

    const actualizar = () => {
      const limite = new Date(estadoEvaluacionSeleccionada.limiteEn || '').getTime();
      const faltan = Math.floor((limite - Date.now()) / 1000);
      setSegundosRestantes(Math.max(0, faltan));
    };

    actualizar();
    const intervalo = window.setInterval(actualizar, 1000);
    return () => window.clearInterval(intervalo);
  }, [evaluacionEnCurso, estadoEvaluacionSeleccionada.limiteEn]);

  useEffect(() => {
    if (!evaluacionEnCurso || !asignacionSeleccionada || segundosRestantes !== 0) {
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
        respuestas: Object.entries(respuestasEvaluacion).map(([preguntaId, respuesta]) => ({
          preguntaId,
          respuesta,
        })),
      }),
    );
  }, [evaluacionEnCurso, esEstudiante, asignacionSeleccionada?.id, respuestasEvaluacion]);

  useEffect(() => {
    if (!evaluacionEnCurso || !asignacionSeleccionada || !esEstudiante) {
      return;
    }

    const intervalo = window.setInterval(() => {
      guardarParcialSilenciosa();
    }, 10000);

    return () => window.clearInterval(intervalo);
  }, [evaluacionEnCurso, esEstudiante, asignacionSeleccionada?.id, respuestasEvaluacion]);

  useEffect(() => {
    if (!evaluacionEnCurso || !asignacionSeleccionada || !esEstudiante) {
      return;
    }

    const cerrarAntesDeSalir = () => {
      const token = localStorage.getItem('token') || '';
      const respuestas = construirRespuestasEvaluacion();
      fetch(`${API_URL}/aprendizaje-adaptativo/${asignacionSeleccionada.id}/evaluacion/cerrar`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ respuestas, motivo: 'abandono' }),
      }).catch(() => undefined);
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
  }, [evaluacionEnCurso, esEstudiante, asignacionSeleccionada?.id, respuestasEvaluacion]);

  useEffect(() => {
    return () => {
      if (!evaluacionEnCurso || !asignacionSeleccionada || !esEstudiante) {
        return;
      }

      const token = localStorage.getItem('token') || '';
      if (!token) {
        return;
      }

      fetch(`${API_URL}/aprendizaje-adaptativo/${asignacionSeleccionada.id}/evaluacion/cerrar`, {
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
      }).catch(() => undefined);
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

  function construirRespuestasEvaluacion() {
    if (!asignacionSeleccionada) {
      return [];
    }

    return obtenerPreguntasEvaluacion(asignacionSeleccionada).map((pregunta) => ({
      preguntaId: pregunta.id,
      respuesta: respuestasEvaluacion[pregunta.id] || '',
    }));
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

  function claveRecurso(pasoId: string | undefined, indice: number) {
    return `${pasoId || 'paso'}-${indice}`;
  }

  function alternarVideo(pasoId: string | undefined, indice: number) {
    const clave = claveRecurso(pasoId, indice);
    setVideosAbiertos((prev) => ({ ...prev, [clave]: !prev[clave] }));
  }

  function abrirRecurso(recurso: RecursoRuta) {
    setRecursoAbierto({
      tipo: recurso.tipo || 'material',
      titulo: recurso.titulo || 'Material de apoyo',
      descripcion: recurso.descripcion,
      contenido: recurso.contenido,
    });
  }

  function etiquetaRecurso(recurso: RecursoRuta) {
    if (recurso.tipo === 'mapa') {
      return 'Ver mapa mental';
    }
    if (recurso.tipo === 'lectura') {
      return 'Ver lectura';
    }
    if (recurso.tipo === 'actividad') {
      return 'Ver actividad';
    }
    return 'Ver material';
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
      setAsignacionSeleccionadaId((actual) =>
        actual || asignacionesData[0]?.id || null,
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
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
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

      return prev.map((item) => (item.id === asignacion.id ? asignacion : item));
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
        docenteId: formulario.docenteId ? Number(formulario.docenteId) : undefined,
        tema: formulario.tema.trim(),
        objetivo: formulario.objetivo.trim() || undefined,
        nivelSolicitado: formulario.nivelSolicitado || undefined,
        tiempoDisponible: formulario.tiempoDisponible.trim() || undefined,
        fechaLimite: formulario.fechaLimite || undefined,
      });

      registrarAsignacionActualizada(asignacion);
      setFormulario(formularioInicial);
      setMensaje('Ruta asignada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la ruta.');
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
        err instanceof Error ? err.message : 'No se pudo registrar la entrevista.',
      );
    } finally {
      setProcesando('');
    }
  }

  async function iniciarRuta() {
    if (!asignacionSeleccionada) {
      return;
    }

    try {
      setProcesando('iniciar');
      const asignacion = await iniciarRutaAprendizajeAdaptativo(
        asignacionSeleccionada.id,
      );
      registrarAsignacionActualizada(asignacion);
      setMensaje('Ruta iniciada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la ruta.');
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
        err instanceof Error ? err.message : 'No se pudo iniciar la evaluación.',
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

  async function actualizarPaso(indice: number, completado: boolean) {
    if (!asignacionSeleccionada) {
      return;
    }

    try {
      setProcesando(`paso-${indice}`);
      const asignacion = await actualizarPasoAprendizajeAdaptativo(
        asignacionSeleccionada.id,
        indice,
        completado,
      );
      registrarAsignacionActualizada(asignacion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el paso.');
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
      setError(err instanceof Error ? err.message : 'No se pudo revisar la ruta.');
    } finally {
      setProcesando('');
    }
  }

  function renderAsignacionDetalle() {
    if (!asignacionSeleccionada) {
      return (
        <div className="adaptativo-empty">
          <span>AI</span>
          <h2>No hay rutas adaptativas</h2>
          <p>Cuando exista una asignación, su entrevista, ruta y evaluación aparecerán aquí.</p>
        </div>
      );
    }

    const pasos = obtenerPasos(asignacionSeleccionada);
    const preguntasEntrevista = obtenerPreguntasEntrevista(asignacionSeleccionada);
    const porcentajes = obtenerPorcentajes(asignacionSeleccionada);
    const puedeResponder =
      esEstudiante && Number(asignacionSeleccionada.estudianteId) === Number(usuario?.id);
    const puedeRevisar =
      puedeGestionar && ['evaluada', 'revisada'].includes(asignacionSeleccionada.estado);
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
        <div className="adaptativo-detail-header">
          <div>
            <span className={`adaptativo-status status-${asignacionSeleccionada.estado}`}>
              {normalizarEstado(asignacionSeleccionada.estado)}
            </span>
            <h2>{asignacionSeleccionada.tema}</h2>
            <p>{asignacionSeleccionada.objetivo || 'Ruta personalizada de aprendizaje.'}</p>
          </div>
          <div className="adaptativo-progress">
            <span>{avance}%</span>
            <div>
              <i style={{ width: `${avance}%` }} />
            </div>
          </div>
        </div>

        <div className="adaptativo-meta-grid">
          <div>
            <span>Estudiante</span>
            <strong>{nombreUsuario(asignacionSeleccionada.estudiante)}</strong>
          </div>
          <div>
            <span>Docente</span>
            <strong>{nombreUsuario(asignacionSeleccionada.docente)}</strong>
          </div>
          <div>
            <span>Grado</span>
            <strong>{asignacionSeleccionada.gradoEscolar?.nombre || 'Sin grado'}</strong>
          </div>
          <div>
            <span>Fecha límite</span>
            <strong>{formatearFecha(asignacionSeleccionada.fechaLimite)}</strong>
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

        {porcentajes.length > 0 && (
          <section className="adaptativo-section">
            <div className="adaptativo-section-title">
              <h3>Perfil de aprendizaje</h3>
              <p>{asignacionSeleccionada.perfilAprendizaje?.principal || 'Perfil mixto'}</p>
            </div>
            <div className="adaptativo-profile-bars">
              {porcentajes.map((perfil: any) => (
                <div key={perfil.tipo} className="adaptativo-profile-row">
                  <span>{perfil.tipo}</span>
                  <div>
                    <i style={{ width: `${Number(perfil.porcentaje || 0)}%` }} />
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
              <span>{asignacionSeleccionada.diagnostico.nivelDificultad}</span>
              <span>{asignacionSeleccionada.tiempoDisponible || 'Tiempo flexible'}</span>
            </div>
          </section>
        )}

        {puedeResponder &&
          ['asignada', 'reasignada'].includes(asignacionSeleccionada.estado) && (
            <section className="adaptativo-action-panel">
              <h3>Aprobar asignación</h3>
              <p>Al aprobar, se abre la entrevista para construir tu ruta personalizada.</p>
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
              <p>Máximo 5 respuestas</p>
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

        {pasos.length === 0 &&
          Array.isArray(asignacionSeleccionada.entrevistaRespuestas) &&
          asignacionSeleccionada.entrevistaRespuestas.length > 0 && (
            <section className="adaptativo-action-panel">
              <h3>Ruta pendiente por estructurar</h3>
              <p>
                La entrevista ya está registrada. Puedes generar nuevamente el
                perfil, el paso a paso de estudio y la evaluación.
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

        {pasos.length > 0 && (
          <section className="adaptativo-section">
            <div className="adaptativo-section-title">
              <h3>{asignacionSeleccionada.ruta?.titulo || 'Ruta adaptativa'}</h3>
              <p>{asignacionSeleccionada.ruta?.duracionEstimada}</p>
            </div>
            <div className="adaptativo-steps">
              {pasos.map((paso, indice) => (
                <article
                  className={`adaptativo-step ${paso.completado ? 'done' : ''}`}
                  key={paso.id || indice}
                >
                  <div className="adaptativo-step-head">
                    <span>{paso.orden || indice + 1}</span>
                    <div>
                      <h4>{paso.titulo}</h4>
                      <p>{paso.objetivo}</p>
                    </div>
                    {puedeResponder && asignacionSeleccionada.estado === 'en_curso' && (
                      <label className="adaptativo-step-check">
                        <input
                          type="checkbox"
                          checked={Boolean(paso.completado)}
                          disabled={procesando === `paso-${indice}`}
                          onChange={(event) =>
                            actualizarPaso(indice, event.target.checked)
                          }
                        />
                        Listo
                      </label>
                    )}
                  </div>
                  <p className="adaptativo-text">{paso.descripcion}</p>
                  <div className="adaptativo-tags">
                    <span>{paso.estrategia}</span>
                    <span>{paso.tipoActividad}</span>
                  </div>
                  <p className="adaptativo-activity">{paso.actividad}</p>
                  {paso.evidenciaEsperada && (
                    <small>Evidencia esperada: {paso.evidenciaEsperada}</small>
                  )}
                  {Array.isArray(paso.recursos) && paso.recursos.length > 0 && (
                    <div className="adaptativo-resources">
                      {paso.recursos.map((recurso, recursoIndice) => (
                        <div key={`${paso.id}-${recursoIndice}`}>
                          <strong>
                            {recurso.titulo || recurso.url || 'Recurso sugerido'}
                          </strong>
                          {recurso.descripcion && <p>{recurso.descripcion}</p>}
                          <div className="adaptativo-resource-actions">
                            {recurso.contenido && (
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => abrirRecurso(recurso)}
                              >
                                {etiquetaRecurso(recurso)}
                              </button>
                            )}
                            {recurso.tipo === 'youtube' && recurso.embedUrl && (
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => alternarVideo(paso.id, recursoIndice)}
                              >
                                {videosAbiertos[claveRecurso(paso.id, recursoIndice)]
                                  ? 'Ocultar video'
                                  : 'Ver video'}
                              </button>
                            )}
                            {recurso.url && (
                              <a
                                className="secondary-button adaptativo-resource-link"
                                href={recurso.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Abrir recurso
                              </a>
                            )}
                          </div>
                          {recurso.tipo === 'youtube' &&
                            recurso.embedUrl &&
                            videosAbiertos[claveRecurso(paso.id, recursoIndice)] && (
                              <iframe
                                src={recurso.embedUrl}
                                title={recurso.titulo || 'Video sugerido'}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>

            {puedeResponder && asignacionSeleccionada.estado === 'ruta_generada' && (
              <button
                className="primary-button"
                onClick={iniciarRuta}
                disabled={Boolean(procesando)}
              >
                Iniciar ruta
              </button>
            )}
          </section>
        )}

        {puedeIniciarEvaluacion && (
          <section className="adaptativo-action-panel">
            <h3>Evaluación final disponible</h3>
            <p>
              Ya completaste todos los pasos. Al iniciar, dispones de 30 minutos
              y si sales se cierra automáticamente.
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => setConfirmacionEvaluacionAbierta(true)}
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
              {formatearCuentaRegresiva(segundosRestantes || 0)} para completarla.
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => setEvaluacionModalAbierta(true)}
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

        {asignacionSeleccionada.resultadoEvaluacion && (
          <section className="adaptativo-section">
            <div className="adaptativo-section-title">
              <h3>Resultado de IA</h3>
              <p>{asignacionSeleccionada.resultadoEvaluacion.veredicto}</p>
            </div>
            <div className="adaptativo-score">
              <strong>{asignacionSeleccionada.resultadoEvaluacion.puntaje || 0}</strong>
              <span>/100</span>
            </div>
            <div className="adaptativo-two-columns">
              <div>
                <h4>Fortalezas</h4>
                <ul>
                  {(asignacionSeleccionada.resultadoEvaluacion.fortalezas || []).map(
                    (item: string) => (
                      <li key={item}>{item}</li>
                    ),
                  )}
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
          </section>
        )}

        {puedeRevisar && (
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
        )}
      </>
    );
  }

  if (cargando) {
    return <p className="state-message">Cargando aprendizaje adaptativo...</p>;
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

      {puedeGestionar && (
        <section className="adaptativo-panel">
          <div className="adaptativo-section-title">
            <h2>Asignar nueva ruta</h2>
            <p>El estudiante recibirá una notificación si el correo está configurado.</p>
          </div>
          <form className="adaptativo-form-grid" onSubmit={crearAsignacion}>
            <label className="adaptativo-field">
              <span>Estudiante</span>
              <select
                name="estudianteId"
                value={formulario.estudianteId}
                onChange={actualizarFormulario}
              >
                <option value="">Seleccionar estudiante</option>
                {catalogos?.estudiantes.map((estudiante) => (
                  <option key={estudiante.id} value={estudiante.id}>
                    {estudiante.nombreCompleto}
                    {estudiante.gradoEscolar ? ` · ${estudiante.gradoEscolar.nombre}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="adaptativo-field">
              <span>Docente responsable</span>
              <select
                name="docenteId"
                value={formulario.docenteId}
                onChange={actualizarFormulario}
              >
                <option value="">
                  {esDocente ? 'Yo como docente responsable' : 'Seleccionar docente'}
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
              <span>Tiempo disponible</span>
              <input
                name="tiempoDisponible"
                value={formulario.tiempoDisponible}
                onChange={actualizarFormulario}
                maxLength={120}
                placeholder="Ej. 5 días, 30 minutos diarios"
              />
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

      <section className="adaptativo-workspace">
        <aside className="adaptativo-list">
          <div className="adaptativo-list-tools">
            <h2>{esEstudiante ? 'Mis rutas' : 'Rutas asignadas'}</h2>
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por tema, estudiante o estado"
            />
          </div>
          <div className="adaptativo-cards">
            {asignacionesFiltradas.map((asignacion) => (
              <button
                key={asignacion.id}
                className={`adaptativo-card ${
                  asignacionSeleccionada?.id === asignacion.id ? 'active' : ''
                }`}
                onClick={() => setAsignacionSeleccionadaId(asignacion.id)}
              >
                <span className={`adaptativo-status status-${asignacion.estado}`}>
                  {normalizarEstado(asignacion.estado)}
                </span>
                <h3>{asignacion.tema}</h3>
                <p>{nombreUsuario(asignacion.estudiante)}</p>
                <small>
                  {calcularAvance(asignacion)}% · {formatearFecha(asignacion.fechaLimite)}
                </small>
              </button>
            ))}
            {asignacionesFiltradas.length === 0 && (
              <p className="adaptativo-muted">No hay rutas con esos filtros.</p>
            )}
          </div>
        </aside>

        <section className="adaptativo-detail">{renderAsignacionDetalle()}</section>
      </section>

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
                guardará lo que lleves respondido y no podrás seguir contestando.
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

      {evaluacionModalAbierta && evaluacionEnCurso && asignacionSeleccionada && (
        <div className="adaptativo-modal-backdrop adaptativo-evaluacion-backdrop">
          <div
            className="adaptativo-modal adaptativo-evaluacion-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <form className="adaptativo-evaluacion-shell" onSubmit={enviarEvaluacion}>
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
                    Tiempo restante: {formatearCuentaRegresiva(segundosRestantes || 0)}
                  </strong>
                  <span>
                    Si sales de esta vista, se conservará lo respondido y la
                    evaluación quedará cerrada.
                  </span>
                </div>
              </div>

              <div className="adaptativo-question-list adaptativo-question-list-modal">
                {obtenerPreguntasEvaluacion(asignacionSeleccionada).map((pregunta) => (
                  <label key={pregunta.id} className="adaptativo-field">
                    <span>{pregunta.pregunta}</span>
                    {pregunta.criterio && <small>Criterio: {pregunta.criterio}</small>}
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
                ))}
              </div>

              <div className="adaptativo-modal-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={Boolean(procesando)}
                >
                  Enviar evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {recursoAbierto && (
        <div
          className="adaptativo-modal-backdrop"
          role="presentation"
          onClick={() => setRecursoAbierto(null)}
        >
          <div className="adaptativo-modal" onClick={(event) => event.stopPropagation()}>
            <div className="adaptativo-modal-head">
              <div>
                <h3>{recursoAbierto.titulo}</h3>
                {recursoAbierto.descripcion && <p>{recursoAbierto.descripcion}</p>}
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setRecursoAbierto(null)}
              >
                Cerrar
              </button>
            </div>
            <div className={`adaptativo-material-preview tipo-${recursoAbierto.tipo}`}>
              {(recursoAbierto.contenido || '')
                .split('\n')
                .filter(Boolean)
                .map((linea) => (
                  <article key={linea}>
                    <span />
                    <p>{linea}</p>
                  </article>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
