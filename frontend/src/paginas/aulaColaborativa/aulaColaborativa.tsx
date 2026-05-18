import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  API_URL,
  actualizarEstadoActividadAula,
  crearActividadAulaColaborativa,
  crearEntregaAulaColaborativa,
  crearProyectoAulaColaborativa,
  esSuperadministrador,
  obtenerCatalogosAulaColaborativa,
  obtenerProyectoAulaColaborativa,
  obtenerProyectosAulaColaborativa,
  obtenerUsuarioAutenticado,
  PERMISOS,
  revisarEntregaAulaColaborativa,
  subirEvidenciaAulaColaborativa,
  usuarioTienePermiso,
} from '../../api/adminApi';
import type {
  ActividadAula,
  CatalogosAula,
  EntregaAula,
  ProyectoAula,
  RolProyectoAula,
} from '../../api/adminApi';
import './aulaColaborativa.css';

type FormularioProyecto = {
  titulo: string;
  descripcion: string;
  objetivo: string;
  curso: string;
  instrucciones: string;
  fechaLimite: string;
  institucionId: string;
  gradoEscolarId: string;
  categoriaId: string;
};

type FormularioActividad = {
  titulo: string;
  descripcion: string;
  fechaLimite: string;
  responsableId: string;
};

type FormularioArchivo = {
  comentario: string;
  archivo: File | null;
};

type FormularioRevision = {
  estado: string;
  calificacion: string;
  comentariosDocente: string;
};

type VistaProyecto = 'informacion' | 'trabajo' | 'calificacion';

const rolesProyecto: Array<{ valor: RolProyectoAula; label: string }> = [
  { valor: 'lider', label: 'Líder' },
  { valor: 'investigador', label: 'Investigador' },
  { valor: 'expositor', label: 'Expositor' },
];

const columnasTablero = [
  { estado: 'pendiente', label: 'Pendiente' },
  { estado: 'en_progreso', label: 'En progreso' },
  { estado: 'en_revision', label: 'En revisión' },
  { estado: 'completada', label: 'Completada' },
];

const proyectoInicial: FormularioProyecto = {
  titulo: '',
  descripcion: '',
  objetivo: '',
  curso: '',
  instrucciones: '',
  fechaLimite: '',
  institucionId: '',
  gradoEscolarId: '',
  categoriaId: '',
};

const actividadInicial: FormularioActividad = {
  titulo: '',
  descripcion: '',
  fechaLimite: '',
  responsableId: '',
};

const archivoInicial: FormularioArchivo = {
  comentario: '',
  archivo: null,
};

function formatearFecha(valor?: string) {
  if (!valor) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
  }).format(new Date(valor));
}

function etiquetaEstado(estado: string) {
  const etiquetas: Record<string, string> = {
    activo: 'Activo',
    en_revision: 'En revisión',
    requiere_ajustes: 'Requiere ajustes',
    aprobado: 'Aprobado',
    cerrado: 'Cerrado',
    pendiente: 'Pendiente',
    en_progreso: 'En progreso',
    completada: 'Completada',
    entregada: 'Entregada',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
  };

  return etiquetas[estado] || estado;
}

function construirUrl(ruta?: string) {
  if (!ruta) {
    return '';
  }

  return ruta.startsWith('http') ? ruta : `${API_URL}${ruta}`;
}

function nombreUsuario(usuario?: { nombres: string; apellidos: string }) {
  return usuario ? `${usuario.nombres} ${usuario.apellidos}` : 'Sin asignar';
}

export function AulaColaborativa() {
  const usuario = obtenerUsuarioAutenticado();
  const esSuper = esSuperadministrador();
  const puedeCrear = usuarioTienePermiso(PERMISOS.AULA_COLABORATIVA_CREAR);
  const puedeGestionar = usuarioTienePermiso(
    PERMISOS.AULA_COLABORATIVA_GESTIONAR,
  );
  const puedeParticipar = usuarioTienePermiso(
    PERMISOS.AULA_COLABORATIVA_PARTICIPAR,
  );
  const puedeRevisar = usuarioTienePermiso(PERMISOS.AULA_COLABORATIVA_REVISAR);

  const [catalogos, setCatalogos] = useState<CatalogosAula>({
    instituciones: [],
    categorias: [],
    gradosEscolares: [],
    estudiantes: [],
  });
  const [proyectos, setProyectos] = useState<ProyectoAula[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] =
    useState<ProyectoAula | null>(null);
  const [vistaProyecto, setVistaProyecto] = useState<VistaProyecto | null>(
    null,
  );
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    gradoEscolarId: '',
    institucionId: '',
  });
  const [modalProyecto, setModalProyecto] = useState(false);
  const [modalActividad, setModalActividad] = useState(false);
  const [modalConfirmarEntrega, setModalConfirmarEntrega] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formularioProyecto, setFormularioProyecto] =
    useState<FormularioProyecto>(proyectoInicial);
  const [rolesIntegrantes, setRolesIntegrantes] = useState<
    Record<number, RolProyectoAula>
  >({});
  const [formularioActividad, setFormularioActividad] =
    useState<FormularioActividad>(actividadInicial);
  const [formulariosEvidencia, setFormulariosEvidencia] = useState<
    Record<number, FormularioArchivo>
  >({});
  const [formularioEntrega, setFormularioEntrega] =
    useState<FormularioArchivo>(archivoInicial);
  const [formulariosRevision, setFormulariosRevision] = useState<
    Record<number, FormularioRevision>
  >({});

  const esLiderProyecto = useMemo(() => {
    if (!usuario || !proyectoSeleccionado) {
      return false;
    }

    return proyectoSeleccionado.integrantes.some(
      (integrante) =>
        integrante.usuarioId === usuario.id &&
        integrante.rolProyecto === 'lider',
    );
  }, [proyectoSeleccionado, usuario]);

  const puedeCrearActividad = puedeGestionar || esLiderProyecto;
  const proyectoCerrado = ['aprobado', 'cerrado'].includes(
    proyectoSeleccionado?.estado || '',
  );
  const entregaActual = proyectoSeleccionado?.entregas[0] || null;
  const entregaPendienteRevision = Boolean(
    entregaActual?.estado === 'entregada' && !entregaActual.fechaRevision,
  );
  const entregaDevuelta = Boolean(
    entregaActual &&
    ['requiere_ajustes', 'rechazada'].includes(entregaActual.estado),
  );
  const trabajoBloqueado = proyectoCerrado || entregaPendienteRevision;
  const puedeEnviarEntrega =
    puedeParticipar && !proyectoCerrado && !entregaPendienteRevision;
  const esDocente = usuario?.rol?.nombre?.toLowerCase() === 'docente';

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarProyectos();
  }, [
    pagina,
    filtros.busqueda,
    filtros.estado,
    filtros.gradoEscolarId,
    filtros.institucionId,
  ]);

  async function cargarCatalogos(institucionId?: string) {
    try {
      const data = await obtenerCatalogosAulaColaborativa({
        institucionId: esSuper ? institucionId || filtros.institucionId : '',
      });
      setCatalogos(data);
    } catch {
      setError('No se pudieron cargar los catálogos del aula colaborativa');
    }
  }

  async function cargarProyectos() {
    try {
      setCargando(true);
      setError('');
      const respuesta = await obtenerProyectosAulaColaborativa({
        pagina,
        limite: 8,
        busqueda: filtros.busqueda,
        estado: filtros.estado,
        gradoEscolarId: filtros.gradoEscolarId,
        institucionId: esSuper ? filtros.institucionId : undefined,
      });

      setProyectos(respuesta.data);
      setTotalPaginas(respuesta.totalPaginas);

      if (respuesta.data.length === 0 && !vistaProyecto) {
        setProyectoSeleccionado(null);
      }
    } catch {
      setError('No se pudieron cargar los proyectos colaborativos');
    } finally {
      setCargando(false);
    }
  }

  async function seleccionarProyecto(id: number) {
    try {
      setCargandoDetalle(true);
      const proyecto = await obtenerProyectoAulaColaborativa(id);
      setProyectoSeleccionado(proyecto);
      return proyecto;
    } catch {
      setError('No se pudo cargar el proyecto seleccionado');
      return null;
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function abrirVistaProyecto(id: number, vista: VistaProyecto) {
    setVistaProyecto(vista);
    setProyectoSeleccionado(null);
    const proyecto = await seleccionarProyecto(id);

    if (!proyecto) {
      setVistaProyecto(null);
    }
  }

  function cerrarVistaProyecto() {
    setVistaProyecto(null);
    setProyectoSeleccionado(null);
  }

  function puedeCalificarProyecto(proyecto: ProyectoAula) {
    return (
      puedeRevisar &&
      (esSuper || (esDocente && proyecto.docenteId === usuario?.id))
    );
  }

  function entregaEstaPendiente(entrega: EntregaAula) {
    return entrega.estado === 'entregada' && !entrega.fechaRevision;
  }

  function numeroVersionEntrega(indice: number) {
    return (proyectoSeleccionado?.entregas.length || 0) - indice;
  }

  function actividadTieneEvidencia(actividad: ActividadAula) {
    return actividad.evidencias.length > 0;
  }

  function puedeCambiarActividadAEstado(
    actividad: ActividadAula,
    estado: string,
  ) {
    if (estado === actividad.estado) {
      return true;
    }

    if (estado === 'en_revision') {
      return actividadTieneEvidencia(actividad);
    }

    if (estado === 'completada') {
      return actividad.estado === 'en_revision' && (esLiderProyecto || esSuper);
    }

    return true;
  }

  function manejarFiltro(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
    setPagina(1);

    if (name === 'institucionId') {
      cargarCatalogos(value);
    }
  }

  function abrirModalProyecto() {
    const institucionId = esSuper
      ? filtros.institucionId
      : String(usuario?.institucion?.id || '');
    setFormularioProyecto({
      ...proyectoInicial,
      institucionId,
    });
    setRolesIntegrantes({});
    cargarCatalogos(institucionId);
    setModalProyecto(true);
  }

  function actualizarFormularioProyecto(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;
    setFormularioProyecto((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'institucionId'
        ? { categoriaId: '', gradoEscolarId: '' }
        : {}),
    }));

    if (name === 'institucionId') {
      setRolesIntegrantes({});
      cargarCatalogos(value);
    }
  }

  function alternarIntegrante(usuarioId: number, seleccionado: boolean) {
    setRolesIntegrantes((prev) => {
      const siguiente = { ...prev };

      if (seleccionado) {
        siguiente[usuarioId] = siguiente[usuarioId] || 'investigador';
      } else {
        delete siguiente[usuarioId];
      }

      return siguiente;
    });
  }

  function cambiarRolIntegrante(
    usuarioId: number,
    rolProyecto: RolProyectoAula,
  ) {
    setRolesIntegrantes((prev) => ({
      ...prev,
      [usuarioId]: rolProyecto,
    }));
  }

  async function guardarProyecto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const integrantes = Object.entries(rolesIntegrantes).map(
      ([usuarioId, rolProyecto]) => ({
        usuarioId: Number(usuarioId),
        rolProyecto,
      }),
    );

    if (integrantes.length === 0) {
      alert('Debes seleccionar al menos un estudiante.');
      return;
    }

    if (!integrantes.some((integrante) => integrante.rolProyecto === 'lider')) {
      alert('Debes asignar al menos un líder.');
      return;
    }

    try {
      setGuardando(true);
      const proyecto = await crearProyectoAulaColaborativa({
        titulo: formularioProyecto.titulo,
        descripcion: formularioProyecto.descripcion,
        objetivo: formularioProyecto.objetivo,
        curso: formularioProyecto.curso || undefined,
        instrucciones: formularioProyecto.instrucciones || undefined,
        fechaLimite: formularioProyecto.fechaLimite,
        institucionId: formularioProyecto.institucionId
          ? Number(formularioProyecto.institucionId)
          : undefined,
        gradoEscolarId: formularioProyecto.gradoEscolarId
          ? Number(formularioProyecto.gradoEscolarId)
          : undefined,
        categoriaId: formularioProyecto.categoriaId
          ? Number(formularioProyecto.categoriaId)
          : undefined,
        integrantes,
      });
      setModalProyecto(false);
      setProyectoSeleccionado(proyecto);
      await cargarProyectos();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo crear el proyecto colaborativo.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function guardarActividad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!proyectoSeleccionado) {
      return;
    }

    if (trabajoBloqueado) {
      alert(
        'El proyecto está bloqueado mientras el docente revisa la entrega.',
      );
      return;
    }

    try {
      setGuardando(true);
      const proyecto = await crearActividadAulaColaborativa(
        proyectoSeleccionado.id,
        {
          titulo: formularioActividad.titulo,
          descripcion: formularioActividad.descripcion || undefined,
          fechaLimite: formularioActividad.fechaLimite || undefined,
          responsableId: formularioActividad.responsableId
            ? Number(formularioActividad.responsableId)
            : undefined,
        },
      );
      setProyectoSeleccionado(proyecto);
      setFormularioActividad(actividadInicial);
      setModalActividad(false);
      await cargarProyectos();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo crear la actividad.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoActividad(
    actividad: ActividadAula,
    estado: string,
  ) {
    if (!proyectoSeleccionado) {
      return;
    }

    if (trabajoBloqueado) {
      alert(
        'El proyecto está bloqueado mientras el docente revisa la entrega.',
      );
      return;
    }

    if (!puedeCambiarActividadAEstado(actividad, estado)) {
      if (estado === 'en_revision') {
        alert(
          'Debes subir al menos un archivo de evidencia antes de enviar la actividad a revisión.',
        );
        return;
      }

      if (estado === 'completada') {
        alert(
          actividad.estado !== 'en_revision'
            ? 'Solo puedes completar una actividad que esté en revisión.'
            : 'Solo el líder del proyecto puede marcar la actividad como completada.',
        );
        return;
      }
    }

    try {
      const proyecto = await actualizarEstadoActividadAula(
        proyectoSeleccionado.id,
        actividad.id,
        estado,
      );
      setProyectoSeleccionado(proyecto);
      await cargarProyectos();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la actividad.',
      );
    }
  }

  function actualizarEvidencia(
    actividadId: number,
    cambios: Partial<FormularioArchivo>,
  ) {
    setFormulariosEvidencia((prev) => ({
      ...prev,
      [actividadId]: {
        ...archivoInicial,
        ...prev[actividadId],
        ...cambios,
      },
    }));
  }

  async function subirEvidencia(actividad: ActividadAula) {
    if (!proyectoSeleccionado) {
      return;
    }

    if (trabajoBloqueado) {
      alert(
        'El proyecto está bloqueado mientras el docente revisa la entrega.',
      );
      return;
    }

    const formulario = formulariosEvidencia[actividad.id] || archivoInicial;

    if (!formulario.archivo) {
      alert('Debes seleccionar un archivo de evidencia.');
      return;
    }

    try {
      const proyecto = await subirEvidenciaAulaColaborativa(
        proyectoSeleccionado.id,
        actividad.id,
        formulario.archivo,
        formulario.comentario || undefined,
      );
      setProyectoSeleccionado(proyecto);
      setFormulariosEvidencia((prev) => ({
        ...prev,
        [actividad.id]: archivoInicial,
      }));
      await cargarProyectos();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo subir la evidencia.',
      );
    }
  }

  function solicitarConfirmacionEntrega(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!proyectoSeleccionado || !formularioEntrega.archivo) {
      alert('Debes seleccionar el documento de entrega final.');
      return;
    }

    if (trabajoBloqueado) {
      alert('No puedes registrar una entrega mientras hay revisión pendiente.');
      return;
    }

    setModalConfirmarEntrega(true);
  }

  async function enviarEntrega() {
    if (!proyectoSeleccionado || !formularioEntrega.archivo) {
      alert('Debes seleccionar el documento de entrega final.');
      return;
    }

    try {
      setGuardando(true);
      const proyecto = await crearEntregaAulaColaborativa(
        proyectoSeleccionado.id,
        formularioEntrega.archivo,
        formularioEntrega.comentario || undefined,
      );
      setProyectoSeleccionado(proyecto);
      setFormularioEntrega(archivoInicial);
      setModalConfirmarEntrega(false);
      await cargarProyectos();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar la entrega final.',
      );
    } finally {
      setGuardando(false);
    }
  }

  function obtenerRevision(entrega: EntregaAula) {
    return (
      formulariosRevision[entrega.id] || {
        estado: 'aprobada',
        calificacion: entrega.calificacion ? String(entrega.calificacion) : '',
        comentariosDocente: entrega.comentariosDocente || '',
      }
    );
  }

  function actualizarRevision(
    entregaId: number,
    cambios: Partial<FormularioRevision>,
  ) {
    setFormulariosRevision((prev) => ({
      ...prev,
      [entregaId]: {
        ...obtenerRevision({ id: entregaId } as EntregaAula),
        ...cambios,
      },
    }));
  }

  async function revisarEntrega(entrega: EntregaAula) {
    if (!proyectoSeleccionado) {
      return;
    }

    const revision = obtenerRevision(entrega);

    try {
      setGuardando(true);
      const proyecto = await revisarEntregaAulaColaborativa(
        proyectoSeleccionado.id,
        entrega.id,
        {
          estado: revision.estado,
          calificacion: revision.calificacion
            ? Number(revision.calificacion)
            : undefined,
          comentariosDocente: revision.comentariosDocente || undefined,
        },
      );
      setProyectoSeleccionado(proyecto);
      await cargarProyectos();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo revisar la entrega.',
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="aula-page">
      <div className="aula-header">
        <div>
          <span className="section-label">Comunidad académica</span>
          <h1>Aula Colaborativa</h1>
          <p>
            Gestiona proyectos grupales, actividades, evidencias y entregas
            aprobadas como recursos inteligentes.
          </p>
        </div>

        {puedeCrear && (
          <button className="primary-button" onClick={abrirModalProyecto}>
            + Nuevo proyecto
          </button>
        )}
      </div>

      <div className="aula-filters">
        <input
          name="busqueda"
          value={filtros.busqueda}
          onChange={manejarFiltro}
          placeholder="Buscar proyecto, objetivo o descripción"
        />

        <select name="estado" value={filtros.estado} onChange={manejarFiltro}>
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="en_revision">En revisión</option>
          <option value="requiere_ajustes">Requiere ajustes</option>
          <option value="aprobado">Aprobados</option>
        </select>

        <select
          name="gradoEscolarId"
          value={filtros.gradoEscolarId}
          onChange={manejarFiltro}
        >
          <option value="">Todos los grados</option>
          {catalogos.gradosEscolares.map((grado) => (
            <option key={grado.id} value={grado.id}>
              {grado.nombre}
            </option>
          ))}
        </select>

        {esSuper && (
          <select
            name="institucionId"
            value={filtros.institucionId}
            onChange={manejarFiltro}
          >
            <option value="">Todas las instituciones</option>
            {catalogos.instituciones.map((institucion) => (
              <option key={institucion.id} value={institucion.id}>
                {institucion.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="state-message error">{error}</p>}

      <div className="aula-shell">
        <aside className="aula-project-list">
          {cargando && <p className="state-message">Cargando proyectos...</p>}

          {!cargando &&
            proyectos.map((proyecto) => (
              <article className="aula-project-card" key={proyecto.id}>
                <span>{etiquetaEstado(proyecto.estado)}</span>
                <h2>{proyecto.titulo}</h2>
                <p>{proyecto.objetivo}</p>
                <small>
                  {proyecto.gradoEscolar?.nombre || 'Sin grado'} ·{' '}
                  {proyecto.integrantes.length} integrantes
                </small>
                <div className="aula-card-actions">
                  <button
                    className="secondary-button compact-button"
                    onClick={() =>
                      abrirVistaProyecto(proyecto.id, 'informacion')
                    }
                    type="button"
                  >
                    Ver información
                  </button>
                  <button
                    className="secondary-button compact-button"
                    onClick={() => abrirVistaProyecto(proyecto.id, 'trabajo')}
                    type="button"
                  >
                    Solucionar trabajo
                  </button>
                  {puedeCalificarProyecto(proyecto) && (
                    <button
                      className="primary-button compact-button"
                      onClick={() =>
                        abrirVistaProyecto(proyecto.id, 'calificacion')
                      }
                      type="button"
                    >
                      Calificación
                    </button>
                  )}
                </div>
              </article>
            ))}

          {!cargando && proyectos.length === 0 && (
            <div className="aula-empty">No hay proyectos colaborativos.</div>
          )}

          <div className="pagination-bar aula-pagination">
            <button
              className="secondary-button"
              onClick={() => setPagina((prev) => Math.max(prev - 1, 1))}
              disabled={pagina <= 1}
            >
              Anterior
            </button>
            <span>
              {pagina} / {totalPaginas}
            </span>
            <button
              className="secondary-button"
              onClick={() =>
                setPagina((prev) => Math.min(prev + 1, totalPaginas))
              }
              disabled={pagina >= totalPaginas}
            >
              Siguiente
            </button>
          </div>
        </aside>

        <section className="aula-detail">
          {cargandoDetalle && (
            <p className="state-message">Cargando detalle del proyecto...</p>
          )}

          {!cargandoDetalle && proyectoSeleccionado && (
            <>
              <div className="aula-detail-header">
                <div>
                  <span
                    className={`aula-status ${proyectoSeleccionado.estado}`}
                  >
                    {etiquetaEstado(proyectoSeleccionado.estado)}
                  </span>
                  <h2>{proyectoSeleccionado.titulo}</h2>
                  <p>{proyectoSeleccionado.descripcion}</p>
                </div>

                <div className="aula-deadline">
                  <span>Fecha límite</span>
                  <strong>
                    {formatearFecha(proyectoSeleccionado.fechaLimite)}
                  </strong>
                </div>
              </div>

              <div className="aula-summary-grid">
                <div>
                  <span>Objetivo</span>
                  <p>{proyectoSeleccionado.objetivo}</p>
                </div>
                <div>
                  <span>Curso</span>
                  <p>{proyectoSeleccionado.curso || 'Sin curso específico'}</p>
                </div>
                <div>
                  <span>Docente</span>
                  <p>{nombreUsuario(proyectoSeleccionado.docente)}</p>
                </div>
                <div>
                  <span>Clasificación</span>
                  <p>
                    {[
                      proyectoSeleccionado.gradoEscolar?.nombre,
                      proyectoSeleccionado.categoria?.nombre,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Sin clasificación'}
                  </p>
                </div>
              </div>

              <div className="aula-members">
                {proyectoSeleccionado.integrantes.map((integrante) => (
                  <span key={integrante.id}>
                    <strong>{nombreUsuario(integrante.usuario)}</strong>
                    {rolesProyecto.find(
                      (rol) => rol.valor === integrante.rolProyecto,
                    )?.label || integrante.rolProyecto}
                  </span>
                ))}
              </div>

              <div className="aula-section-title">
                <div>
                  <h3>Tablero de actividades</h3>
                  <p>Seguimiento tipo tablero por estado de trabajo.</p>
                </div>

                {puedeCrearActividad && !trabajoBloqueado && (
                  <button
                    className="secondary-button"
                    onClick={() => setModalActividad(true)}
                  >
                    + Actividad
                  </button>
                )}
              </div>

              <p className="aula-board-rule">
                Para enviar una actividad a revisión debe tener evidencia
                adjunta. Solo el líder puede marcar actividades revisadas como
                completadas.
              </p>

              <div className="aula-board">
                {columnasTablero.map((columna) => {
                  const actividades = proyectoSeleccionado.actividades.filter(
                    (actividad) => actividad.estado === columna.estado,
                  );

                  return (
                    <div className="aula-column" key={columna.estado}>
                      <h4>
                        {columna.label}
                        <span>{actividades.length}</span>
                      </h4>

                      {actividades.map((actividad) => {
                        const evidencia =
                          formulariosEvidencia[actividad.id] || archivoInicial;

                        return (
                          <article className="aula-task" key={actividad.id}>
                            <h5>{actividad.titulo}</h5>
                            {actividad.descripcion && (
                              <p>{actividad.descripcion}</p>
                            )}
                            <small>
                              {nombreUsuario(
                                actividad.responsable || undefined,
                              )}
                              {' · '}
                              {formatearFecha(actividad.fechaLimite)}
                            </small>

                            <select
                              value={actividad.estado}
                              onChange={(event) =>
                                cambiarEstadoActividad(
                                  actividad,
                                  event.target.value,
                                )
                              }
                              disabled={trabajoBloqueado}
                            >
                              {columnasTablero.map((item) => (
                                <option
                                  disabled={
                                    !puedeCambiarActividadAEstado(
                                      actividad,
                                      item.estado,
                                    )
                                  }
                                  key={item.estado}
                                  value={item.estado}
                                >
                                  {item.label}
                                </option>
                              ))}
                            </select>

                            <div className="aula-evidence-list">
                              {actividad.evidencias.slice(0, 2).map((item) => (
                                <a
                                  href={construirUrl(item.rutaArchivo)}
                                  key={item.id}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {item.nombreArchivo}
                                </a>
                              ))}
                              {actividad.evidencias.length > 2 && (
                                <span>
                                  +{actividad.evidencias.length - 2} evidencias
                                </span>
                              )}
                            </div>

                            {puedeParticipar && !trabajoBloqueado && (
                              <div className="aula-evidence-form">
                                <input
                                  value={evidencia.comentario}
                                  onChange={(event) =>
                                    actualizarEvidencia(actividad.id, {
                                      comentario: event.target.value,
                                    })
                                  }
                                  placeholder="Comentario breve"
                                />
                                <input
                                  type="file"
                                  onChange={(event) =>
                                    actualizarEvidencia(actividad.id, {
                                      archivo: event.target.files?.[0] || null,
                                    })
                                  }
                                />
                                <button
                                  className="secondary-button compact-button"
                                  onClick={() => subirEvidencia(actividad)}
                                  type="button"
                                >
                                  Subir
                                </button>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div className="aula-delivery-grid">
                <section className="aula-delivery">
                  <h3>Entrega final</h3>
                  <p>
                    El documento aprobado por el docente se publica
                    automáticamente en el repositorio.
                  </p>

                  {puedeEnviarEntrega && (
                    <form onSubmit={solicitarConfirmacionEntrega}>
                      <textarea
                        value={formularioEntrega.comentario}
                        onChange={(event) =>
                          setFormularioEntrega((prev) => ({
                            ...prev,
                            comentario: event.target.value,
                          }))
                        }
                        placeholder="Comentario de entrega"
                      />
                      <input
                        type="file"
                        onChange={(event) =>
                          setFormularioEntrega((prev) => ({
                            ...prev,
                            archivo: event.target.files?.[0] || null,
                          }))
                        }
                      />
                      <button
                        className="primary-button"
                        disabled={guardando}
                        type="submit"
                      >
                        Registrar entrega
                      </button>
                    </form>
                  )}
                </section>

                <section className="aula-reviews">
                  <h3>Revisión docente</h3>
                  {proyectoSeleccionado.entregas.length === 0 && (
                    <p className="state-message">
                      Aún no hay entregas finales.
                    </p>
                  )}

                  {proyectoSeleccionado.entregas.map((entrega) => {
                    const revision = obtenerRevision(entrega);

                    return (
                      <article className="aula-review-card" key={entrega.id}>
                        <div>
                          <span>{etiquetaEstado(entrega.estado)}</span>
                          <strong>{entrega.nombreArchivo}</strong>
                          <small>
                            {nombreUsuario(entrega.usuario)} ·{' '}
                            {formatearFecha(entrega.createdAt)}
                          </small>
                          <a
                            href={construirUrl(entrega.rutaArchivo)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir entrega
                          </a>
                          {entrega.recursoId && (
                            <small>
                              Publicado como recurso #{entrega.recursoId}
                            </small>
                          )}
                        </div>

                        {puedeRevisar && entrega.estado !== 'aprobada' && (
                          <div className="aula-review-form">
                            <select
                              value={revision.estado}
                              onChange={(event) =>
                                actualizarRevision(entrega.id, {
                                  estado: event.target.value,
                                })
                              }
                            >
                              <option value="aprobada">Aprobar</option>
                              <option value="requiere_ajustes">
                                Requiere ajustes
                              </option>
                              <option value="rechazada">Rechazar</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.1"
                              value={revision.calificacion}
                              onChange={(event) =>
                                actualizarRevision(entrega.id, {
                                  calificacion: event.target.value,
                                })
                              }
                              placeholder="Nota 0 a 5"
                            />
                            <textarea
                              value={revision.comentariosDocente}
                              onChange={(event) =>
                                actualizarRevision(entrega.id, {
                                  comentariosDocente: event.target.value,
                                })
                              }
                              placeholder="Comentarios del docente"
                            />
                            <button
                              className="primary-button"
                              onClick={() => revisarEntrega(entrega)}
                              disabled={guardando}
                              type="button"
                            >
                              Guardar revisión
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </section>
              </div>
            </>
          )}

          {!cargandoDetalle && !proyectoSeleccionado && (
            <div className="aula-empty detail">
              Selecciona un proyecto para ver su tablero colaborativo.
            </div>
          )}
        </section>
      </div>

      {vistaProyecto && (
        <div className="modal-overlay">
          <div
            className={`modal-container aula-view-modal aula-view-modal-${vistaProyecto}`}
          >
            {cargandoDetalle && (
              <p className="state-message">Cargando detalle del proyecto...</p>
            )}

            {!cargandoDetalle && proyectoSeleccionado && (
              <>
                <div className="modal-header">
                  <div>
                    <span
                      className={`aula-status ${proyectoSeleccionado.estado}`}
                    >
                      {etiquetaEstado(proyectoSeleccionado.estado)}
                    </span>
                    <h2>{proyectoSeleccionado.titulo}</h2>
                    <p>
                      {vistaProyecto === 'informacion' &&
                        'Información completa del proyecto colaborativo.'}
                      {vistaProyecto === 'trabajo' &&
                        'Tablero de trabajo, evidencias y entrega final.'}
                      {vistaProyecto === 'calificacion' &&
                        'Revisión docente de las entregas finales.'}
                    </p>
                  </div>
                  <button className="modal-close" onClick={cerrarVistaProyecto}>
                    ×
                  </button>
                </div>

                {vistaProyecto === 'informacion' && (
                  <div className="aula-info-view">
                    <div className="aula-detail-header compact">
                      <div>
                        <h3>Datos generales</h3>
                        <p>{proyectoSeleccionado.descripcion}</p>
                      </div>

                      <div className="aula-deadline">
                        <span>Fecha límite</span>
                        <strong>
                          {formatearFecha(proyectoSeleccionado.fechaLimite)}
                        </strong>
                      </div>
                    </div>

                    <div className="aula-summary-grid">
                      <div>
                        <span>Objetivo</span>
                        <p>{proyectoSeleccionado.objetivo}</p>
                      </div>
                      <div>
                        <span>Curso</span>
                        <p>
                          {proyectoSeleccionado.curso || 'Sin curso específico'}
                        </p>
                      </div>
                      <div>
                        <span>Docente</span>
                        <p>{nombreUsuario(proyectoSeleccionado.docente)}</p>
                      </div>
                      <div>
                        <span>Clasificación</span>
                        <p>
                          {[
                            proyectoSeleccionado.gradoEscolar?.nombre,
                            proyectoSeleccionado.categoria?.nombre,
                          ]
                            .filter(Boolean)
                            .join(' · ') || 'Sin clasificación'}
                        </p>
                      </div>
                    </div>

                    <section className="aula-info-block">
                      <h3>Instrucciones del docente</h3>
                      <p>
                        {proyectoSeleccionado.instrucciones?.trim() ||
                          'Sin instrucciones registradas.'}
                      </p>
                    </section>

                    <section className="aula-info-block">
                      <h3>Integrantes y roles</h3>
                      <div className="aula-members">
                        {proyectoSeleccionado.integrantes.map((integrante) => (
                          <span key={integrante.id}>
                            <strong>{nombreUsuario(integrante.usuario)}</strong>
                            {rolesProyecto.find(
                              (rol) => rol.valor === integrante.rolProyecto,
                            )?.label || integrante.rolProyecto}
                          </span>
                        ))}
                      </div>
                    </section>
                  </div>
                )}

                {vistaProyecto === 'trabajo' && (
                  <div className="aula-work-view">
                    <div className="aula-section-title">
                      <div>
                        <h3>Tablero de actividades</h3>
                        <p>
                          Organiza el avance del grupo y adjunta evidencias por
                          actividad.
                        </p>
                      </div>

                      {puedeCrearActividad && !trabajoBloqueado && (
                        <button
                          className="secondary-button"
                          onClick={() => setModalActividad(true)}
                        >
                          + Actividad
                        </button>
                      )}
                    </div>

                    {entregaPendienteRevision && entregaActual && (
                      <div className="aula-lock-notice">
                        <strong>Entrega enviada para revisión</strong>
                        <p>
                          El tablero, las evidencias y las nuevas entregas
                          quedan bloqueadas hasta que el docente responda.
                        </p>
                        <a
                          href={construirUrl(entregaActual.rutaArchivo)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {entregaActual.nombreArchivo}
                        </a>
                      </div>
                    )}

                    {entregaDevuelta && entregaActual && (
                      <div className="aula-return-notice">
                        <strong>
                          El docente solicitó una nueva versión del trabajo
                        </strong>
                        <p>
                          {entregaActual.comentariosDocente ||
                            'Revisa los ajustes indicados y envía una nueva versión.'}
                        </p>
                      </div>
                    )}

                    <p className="aula-board-rule">
                      Para enviar una actividad a revisión debe tener evidencia
                      adjunta. Solo el líder puede marcar actividades revisadas
                      como completadas.
                    </p>

                    <div className="aula-board">
                      {columnasTablero.map((columna) => {
                        const actividades =
                          proyectoSeleccionado.actividades.filter(
                            (actividad) => actividad.estado === columna.estado,
                          );

                        return (
                          <div className="aula-column" key={columna.estado}>
                            <h4>
                              {columna.label}
                              <span>{actividades.length}</span>
                            </h4>

                            {actividades.length === 0 && (
                              <p className="aula-column-empty">
                                Sin actividades
                              </p>
                            )}

                            {actividades.map((actividad) => {
                              const evidencia =
                                formulariosEvidencia[actividad.id] ||
                                archivoInicial;

                              return (
                                <article
                                  className="aula-task"
                                  key={actividad.id}
                                >
                                  <h5>{actividad.titulo}</h5>
                                  {actividad.descripcion && (
                                    <p>{actividad.descripcion}</p>
                                  )}
                                  <small>
                                    {nombreUsuario(
                                      actividad.responsable || undefined,
                                    )}
                                    {' · '}
                                    {formatearFecha(actividad.fechaLimite)}
                                  </small>

                                  <select
                                    value={actividad.estado}
                                    onChange={(event) =>
                                      cambiarEstadoActividad(
                                        actividad,
                                        event.target.value,
                                      )
                                    }
                                    disabled={trabajoBloqueado}
                                  >
                                    {columnasTablero.map((item) => (
                                      <option
                                        disabled={
                                          !puedeCambiarActividadAEstado(
                                            actividad,
                                            item.estado,
                                          )
                                        }
                                        key={item.estado}
                                        value={item.estado}
                                      >
                                        {item.label}
                                      </option>
                                    ))}
                                  </select>

                                  <div className="aula-evidence-list">
                                    {actividad.evidencias
                                      .slice(0, 3)
                                      .map((item) => (
                                        <a
                                          href={construirUrl(item.rutaArchivo)}
                                          key={item.id}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          {item.nombreArchivo}
                                        </a>
                                      ))}
                                    {actividad.evidencias.length > 3 && (
                                      <span>
                                        +{actividad.evidencias.length - 3}{' '}
                                        evidencias
                                      </span>
                                    )}
                                  </div>

                                  {puedeParticipar && !trabajoBloqueado && (
                                    <div className="aula-evidence-form">
                                      <input
                                        value={evidencia.comentario}
                                        onChange={(event) =>
                                          actualizarEvidencia(actividad.id, {
                                            comentario: event.target.value,
                                          })
                                        }
                                        placeholder="Comentario breve"
                                      />
                                      <input
                                        type="file"
                                        onChange={(event) =>
                                          actualizarEvidencia(actividad.id, {
                                            archivo:
                                              event.target.files?.[0] || null,
                                          })
                                        }
                                      />
                                      <button
                                        className="secondary-button compact-button"
                                        onClick={() =>
                                          subirEvidencia(actividad)
                                        }
                                        type="button"
                                      >
                                        Subir
                                      </button>
                                    </div>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                    <section className="aula-delivery">
                      <h3>Entrega final</h3>
                      <p>
                        Cuando el docente apruebe el documento, se publicará
                        automáticamente en el repositorio.
                      </p>

                      {entregaPendienteRevision && (
                        <div className="aula-delivery-state pending">
                          <strong>Entrega pendiente de revisión docente</strong>
                          <span>
                            No se pueden modificar actividades ni enviar otra
                            versión hasta que el docente responda.
                          </span>
                        </div>
                      )}

                      {puedeEnviarEntrega && (
                        <form onSubmit={solicitarConfirmacionEntrega}>
                          {entregaDevuelta && (
                            <div className="aula-delivery-state returned">
                              <strong>Enviar nueva versión</strong>
                              <span>
                                La versión anterior queda guardada como
                                historial y no será publicada como recurso.
                              </span>
                            </div>
                          )}
                          <textarea
                            value={formularioEntrega.comentario}
                            onChange={(event) =>
                              setFormularioEntrega((prev) => ({
                                ...prev,
                                comentario: event.target.value,
                              }))
                            }
                            placeholder="Comentario de entrega"
                          />
                          <input
                            type="file"
                            onChange={(event) =>
                              setFormularioEntrega((prev) => ({
                                ...prev,
                                archivo: event.target.files?.[0] || null,
                              }))
                            }
                          />
                          <button
                            className="primary-button"
                            disabled={guardando}
                            type="submit"
                          >
                            {entregaDevuelta
                              ? 'Registrar nueva versión'
                              : 'Registrar entrega'}
                          </button>
                        </form>
                      )}

                      {proyectoSeleccionado.entregas.length > 0 && (
                        <div className="aula-delivery-list">
                          <h4>Historial de entregas</h4>
                          {proyectoSeleccionado.entregas.map(
                            (entrega, index) => (
                              <a
                                className={
                                  index === 0
                                    ? 'aula-delivery-item current'
                                    : 'aula-delivery-item'
                                }
                                href={construirUrl(entrega.rutaArchivo)}
                                key={entrega.id}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <div>
                                  <small>
                                    Versión {numeroVersionEntrega(index)}
                                    {index === 0 ? ' · actual' : ''}
                                  </small>
                                  <strong>{entrega.nombreArchivo}</strong>
                                  {entrega.comentariosDocente && (
                                    <em>{entrega.comentariosDocente}</em>
                                  )}
                                </div>
                                <span>{etiquetaEstado(entrega.estado)}</span>
                              </a>
                            ),
                          )}
                        </div>
                      )}
                    </section>
                  </div>
                )}

                {vistaProyecto === 'calificacion' && (
                  <div className="aula-grade-view">
                    {!puedeCalificarProyecto(proyectoSeleccionado) && (
                      <p className="state-message error">
                        La calificación solo está disponible para el docente
                        responsable del proyecto.
                      </p>
                    )}

                    <section className="aula-reviews aula-reviews-wide">
                      <h3>Revisión docente</h3>
                      {proyectoSeleccionado.entregas.length === 0 && (
                        <p className="state-message">
                          Aún no hay entregas finales.
                        </p>
                      )}

                      {proyectoSeleccionado.entregas.map((entrega, index) => {
                        const revision = obtenerRevision(entrega);
                        const pendiente = entregaEstaPendiente(entrega);

                        return (
                          <article
                            className="aula-review-card"
                            key={entrega.id}
                          >
                            <div>
                              <span>{etiquetaEstado(entrega.estado)}</span>
                              <small>
                                Versión {numeroVersionEntrega(index)}
                                {index === 0 ? ' · actual' : ''}
                              </small>
                              <strong>{entrega.nombreArchivo}</strong>
                              <small>
                                {nombreUsuario(entrega.usuario)} ·{' '}
                                {formatearFecha(entrega.createdAt)}
                              </small>
                              <a
                                href={construirUrl(entrega.rutaArchivo)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Abrir entrega
                              </a>
                              {entrega.recursoId && (
                                <small>
                                  Publicado como recurso #{entrega.recursoId}
                                </small>
                              )}
                              {entrega.comentariosDocente && (
                                <small>
                                  Comentario docente:{' '}
                                  {entrega.comentariosDocente}
                                </small>
                              )}
                              {entrega.calificacion != null && (
                                <small>Nota: {entrega.calificacion}</small>
                              )}
                            </div>

                            {puedeCalificarProyecto(proyectoSeleccionado) &&
                              pendiente && (
                                <div className="aula-review-form">
                                  <select
                                    value={revision.estado}
                                    onChange={(event) =>
                                      actualizarRevision(entrega.id, {
                                        estado: event.target.value,
                                      })
                                    }
                                  >
                                    <option value="aprobada">Aprobar</option>
                                    <option value="requiere_ajustes">
                                      Requiere ajustes
                                    </option>
                                    <option value="rechazada">Rechazar</option>
                                  </select>
                                  <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={revision.calificacion}
                                    onChange={(event) =>
                                      actualizarRevision(entrega.id, {
                                        calificacion: event.target.value,
                                      })
                                    }
                                    placeholder="Nota 0 a 5"
                                  />
                                  <textarea
                                    value={revision.comentariosDocente}
                                    onChange={(event) =>
                                      actualizarRevision(entrega.id, {
                                        comentariosDocente: event.target.value,
                                      })
                                    }
                                    placeholder="Comentarios del docente"
                                  />
                                  <button
                                    className="primary-button"
                                    onClick={() => revisarEntrega(entrega)}
                                    disabled={guardando}
                                    type="button"
                                  >
                                    Guardar revisión
                                  </button>
                                </div>
                              )}
                          </article>
                        );
                      })}
                    </section>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {modalConfirmarEntrega && proyectoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-container aula-confirm-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">Entrega final</span>
                <h2>Confirmar entrega del trabajo</h2>
                <p>
                  Al confirmar, el tablero quedará bloqueado hasta que el
                  docente revise esta versión.
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setModalConfirmarEntrega(false)}
              >
                ×
              </button>
            </div>

            <div className="aula-confirm-body">
              <strong>{formularioEntrega.archivo?.name}</strong>
              <p>
                Verifica que el documento sea la versión correcta antes de
                enviarlo para revisión.
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setModalConfirmarEntrega(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                disabled={guardando}
                onClick={enviarEntrega}
                type="button"
              >
                {guardando ? 'Enviando...' : 'Confirmar entrega'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalProyecto && (
        <div className="modal-overlay">
          <div className="modal-container aula-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">Aula Colaborativa</span>
                <h2>Crear proyecto</h2>
                <p>Define el objetivo, integrantes y roles internos.</p>
              </div>
              <button
                className="modal-close"
                onClick={() => setModalProyecto(false)}
              >
                ×
              </button>
            </div>

            <form className="institution-form" onSubmit={guardarProyecto}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Título</label>
                  <input
                    name="titulo"
                    value={formularioProyecto.titulo}
                    onChange={actualizarFormularioProyecto}
                    required
                  />
                </div>

                {esSuper && (
                  <div className="form-group">
                    <label>Institución</label>
                    <select
                      name="institucionId"
                      value={formularioProyecto.institucionId}
                      onChange={actualizarFormularioProyecto}
                      required
                    >
                      <option value="">Selecciona una institución</option>
                      {catalogos.instituciones.map((institucion) => (
                        <option key={institucion.id} value={institucion.id}>
                          {institucion.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Curso</label>
                  <input
                    name="curso"
                    value={formularioProyecto.curso}
                    onChange={actualizarFormularioProyecto}
                    placeholder="Ej. 8-2"
                  />
                </div>

                <div className="form-group">
                  <label>Fecha límite</label>
                  <input
                    type="date"
                    name="fechaLimite"
                    value={formularioProyecto.fechaLimite}
                    onChange={actualizarFormularioProyecto}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Grado escolar</label>
                  <select
                    name="gradoEscolarId"
                    value={formularioProyecto.gradoEscolarId}
                    onChange={actualizarFormularioProyecto}
                  >
                    <option value="">Selecciona un grado</option>
                    {catalogos.gradosEscolares.map((grado) => (
                      <option key={grado.id} value={grado.id}>
                        {grado.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    name="categoriaId"
                    value={formularioProyecto.categoriaId}
                    onChange={actualizarFormularioProyecto}
                  >
                    <option value="">Clasificar por contexto</option>
                    {catalogos.categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group form-group-full">
                  <label>Objetivo</label>
                  <textarea
                    name="objetivo"
                    value={formularioProyecto.objetivo}
                    onChange={actualizarFormularioProyecto}
                    required
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formularioProyecto.descripcion}
                    onChange={actualizarFormularioProyecto}
                    required
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Instrucciones</label>
                  <textarea
                    name="instrucciones"
                    value={formularioProyecto.instrucciones}
                    onChange={actualizarFormularioProyecto}
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Integrantes y roles</label>
                  <div className="aula-student-picker">
                    {catalogos.estudiantes.length === 0 && (
                      <p>No hay estudiantes activos para seleccionar.</p>
                    )}
                    {catalogos.estudiantes.map((estudiante) => (
                      <div className="aula-student-row" key={estudiante.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={Boolean(rolesIntegrantes[estudiante.id])}
                            onChange={(event) =>
                              alternarIntegrante(
                                estudiante.id,
                                event.target.checked,
                              )
                            }
                          />
                          <span>
                            {estudiante.nombres} {estudiante.apellidos}
                            <small>
                              {estudiante.gradoEscolar?.nombre ||
                                'Sin grado asignado'}
                            </small>
                          </span>
                        </label>
                        <select
                          value={
                            rolesIntegrantes[estudiante.id] || 'investigador'
                          }
                          onChange={(event) =>
                            cambiarRolIntegrante(
                              estudiante.id,
                              event.target.value as RolProyectoAula,
                            )
                          }
                          disabled={!rolesIntegrantes[estudiante.id]}
                        >
                          {rolesProyecto.map((rol) => (
                            <option key={rol.valor} value={rol.valor}>
                              {rol.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  onClick={() => setModalProyecto(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button className="primary-button" disabled={guardando}>
                  {guardando ? 'Creando...' : 'Crear proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalActividad && proyectoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div>
                <span className="section-label">Actividad</span>
                <h2>Nueva actividad</h2>
                <p>Asigna una tarea al tablero del proyecto.</p>
              </div>
              <button
                className="modal-close"
                onClick={() => setModalActividad(false)}
              >
                ×
              </button>
            </div>

            <form className="institution-form" onSubmit={guardarActividad}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Título</label>
                  <input
                    value={formularioActividad.titulo}
                    onChange={(event) =>
                      setFormularioActividad((prev) => ({
                        ...prev,
                        titulo: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Responsable</label>
                  <select
                    value={formularioActividad.responsableId}
                    onChange={(event) =>
                      setFormularioActividad((prev) => ({
                        ...prev,
                        responsableId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Sin responsable</option>
                    {proyectoSeleccionado.integrantes.map((integrante) => (
                      <option
                        key={integrante.usuarioId}
                        value={integrante.usuarioId}
                      >
                        {nombreUsuario(integrante.usuario)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha límite</label>
                  <input
                    type="date"
                    value={formularioActividad.fechaLimite}
                    onChange={(event) =>
                      setFormularioActividad((prev) => ({
                        ...prev,
                        fechaLimite: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Descripción</label>
                  <textarea
                    value={formularioActividad.descripcion}
                    onChange={(event) =>
                      setFormularioActividad((prev) => ({
                        ...prev,
                        descripcion: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  onClick={() => setModalActividad(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button className="primary-button" disabled={guardando}>
                  {guardando ? 'Creando...' : 'Crear actividad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
