import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  API_URL,
  calificarRecurso,
  generarResumenIaRecursoStream,
  obtenerGradosEscolares,
  obtenerRecomendacionesRecursos,
  obtenerRecursosRepositorio,
  obtenerResumenCalificacionRecurso,
  PERMISOS,
  usuarioTienePermiso,
} from '../../api/adminApi';
import { CalificacionIa } from '../../componentes/ia/calificacionIa';
import type {
  GradoEscolar,
  Recurso,
  RecursoAsistente,
  ResumenCalificacionRecurso,
  ResumenIaRecurso,
} from '../../api/adminApi';
import './gestorRecursos.css';

type VistaRepositorio = 'tarjetas' | 'lista';

type FiltrosRepositorio = {
  busqueda: string;
  tipoArchivo: string;
  gradoEscolarId: string;
  recursoId: string;
};

function obtenerUrlRecurso(recurso: Recurso) {
  if (recurso.rutaRecurso) {
    return `${API_URL}${recurso.rutaRecurso}`;
  }

  return recurso.urlRecurso || '';
}

function obtenerExtension(recurso: Recurso) {
  const ruta = recurso.rutaRecurso || recurso.urlRecurso || '';
  const limpia = ruta.split('?')[0];
  return limpia.includes('.')
    ? limpia.split('.').pop()?.toLowerCase() || ''
    : '';
}

function describirTipoArchivo(recurso: Recurso) {
  const extension = obtenerExtension(recurso);

  if (!extension && recurso.urlRecurso) {
    return 'Enlace';
  }

  if (extension === 'pdf') {
    return 'PDF';
  }

  if (['doc', 'docx'].includes(extension)) {
    return 'Word';
  }

  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return 'Excel';
  }

  if (['ppt', 'pptx'].includes(extension)) {
    return 'PowerPoint';
  }

  if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
    return 'Imagen';
  }

  if (['mp4', 'webm'].includes(extension)) {
    return 'Video';
  }

  return extension ? extension.toUpperCase() : 'Recurso';
}

function obtenerClaseArchivo(recurso: Recurso) {
  const extension = obtenerExtension(recurso);

  if (extension === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(extension)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'excel';
  if (['ppt', 'pptx'].includes(extension)) return 'slide';
  if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) return 'image';
  if (['mp4', 'webm'].includes(extension)) return 'video';
  if (recurso.urlRecurso) return 'link';
  return 'file';
}

function puedePrevisualizarComoImagen(recurso: Recurso) {
  return ['png', 'jpg', 'jpeg', 'webp'].includes(obtenerExtension(recurso));
}

function puedePrevisualizarComoPdf(recurso: Recurso) {
  return obtenerExtension(recurso) === 'pdf';
}

function puedePrevisualizarComoVideo(recurso: Recurso) {
  return ['mp4', 'webm'].includes(obtenerExtension(recurso));
}

function puedePrevisualizarComoOffice(recurso: Recurso) {
  return ['doc', 'docx', 'ppt', 'pptx'].includes(obtenerExtension(recurso));
}

function puedeGenerarResumenIa(recurso: Recurso) {
  return ['pdf', 'docx', 'xlsx', 'csv'].includes(obtenerExtension(recurso));
}

function crearUrlOfficeViewer(url: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
}

function separarPalabrasClave(valor?: string) {
  if (!valor) return [];
  return valor
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function nombreCreador(recurso: Recurso) {
  if (!recurso.usuarioCreador) return 'Sin responsable';
  return `${recurso.usuarioCreador.nombres} ${recurso.usuarioCreador.apellidos}`;
}

export function GestorRecursos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const busquedaUrl = searchParams.get('busqueda') || '';
  const recursoIdUrl = searchParams.get('recursoId') || '';
  const puedeVerTodosLosGrados = usuarioTienePermiso(
    PERMISOS.RECURSOS_VER_TODOS_GRADOS,
  );
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<RecursoAsistente[]>(
    [],
  );
  const [gradosEscolares, setGradosEscolares] = useState<GradoEscolar[]>([]);
  const [recursoSeleccionado, setRecursoSeleccionado] =
    useState<Recurso | null>(null);
  const [recursoResumenIa, setRecursoResumenIa] = useState<Recurso | null>(
    null,
  );
  const [resumenCalificacion, setResumenCalificacion] =
    useState<ResumenCalificacionRecurso | null>(null);
  const [resumenesIa, setResumenesIa] = useState<
    Record<number, ResumenIaRecurso>
  >({});
  const [resumiendoId, setResumiendoId] = useState<number | null>(null);
  const [estadoResumenIa, setEstadoResumenIa] = useState('');
  const [errorResumenIa, setErrorResumenIa] = useState('');
  const [guardandoCalificacion, setGuardandoCalificacion] = useState(false);
  const [vista, setVista] = useState<VistaRepositorio>('tarjetas');
  const [filtros, setFiltros] = useState<FiltrosRepositorio>({
    busqueda: busquedaUrl,
    tipoArchivo: '',
    gradoEscolarId: '',
    recursoId: recursoIdUrl,
  });
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const recomendacionesPorId = useMemo(
    () =>
      new Map(
        recomendaciones.map((recomendacion, indice) => [
          recomendacion.id,
          {
            ...recomendacion,
            prioridad: indice,
          },
        ]),
      ),
    [recomendaciones],
  );

  const recursosOrdenados = useMemo(
    () =>
      [...recursos].sort((a, b) => {
        const recomendacionA = recomendacionesPorId.get(a.id);
        const recomendacionB = recomendacionesPorId.get(b.id);

        if (recomendacionA && recomendacionB) {
          return recomendacionA.prioridad - recomendacionB.prioridad;
        }

        if (recomendacionA) {
          return -1;
        }

        if (recomendacionB) {
          return 1;
        }

        return 0;
      }),
    [recursos, recomendacionesPorId],
  );

  useEffect(() => {
    cargarRecursos();
  }, [
    pagina,
    filtros.busqueda,
    filtros.tipoArchivo,
    filtros.gradoEscolarId,
    filtros.recursoId,
  ]);

  useEffect(() => {
    cargarRecomendaciones();
  }, [filtros.busqueda, filtros.gradoEscolarId]);

  useEffect(() => {
    if (
      busquedaUrl !== filtros.busqueda ||
      recursoIdUrl !== filtros.recursoId
    ) {
      setFiltros((prev) => ({
        ...prev,
        busqueda: busquedaUrl,
        recursoId: recursoIdUrl,
      }));
      setPagina(1);
    }
  }, [busquedaUrl, recursoIdUrl, filtros.busqueda, filtros.recursoId]);

  useEffect(() => {
    cargarGradosEscolares();
  }, []);

  useEffect(() => {
    if (recursoSeleccionado) {
      cargarResumenCalificacion(recursoSeleccionado.id);
    } else {
      setResumenCalificacion(null);
    }
  }, [recursoSeleccionado?.id]);

  useEffect(() => {
    setErrorResumenIa('');
  }, [recursoResumenIa?.id]);

  async function cargarGradosEscolares() {
    try {
      const grados = await obtenerGradosEscolares();
      setGradosEscolares(grados);
    } catch {
      setGradosEscolares([]);
    }
  }

  async function cargarRecursos() {
    try {
      setCargando(true);
      setError('');

      const respuesta = await obtenerRecursosRepositorio({
        pagina,
        limite: 12,
        busqueda: filtros.busqueda,
        tipoArchivo: filtros.tipoArchivo,
        gradoEscolarId: puedeVerTodosLosGrados
          ? filtros.gradoEscolarId
          : undefined,
        recursoId: filtros.recursoId,
      });

      setRecursos(respuesta.data);
      setTotal(respuesta.total);
      setTotalPaginas(respuesta.totalPaginas);
    } catch {
      setError('No se pudieron cargar los recursos del repositorio');
    } finally {
      setCargando(false);
    }
  }

  async function cargarRecomendaciones() {
    try {
      const respuesta = await obtenerRecomendacionesRecursos({
        tema: filtros.busqueda,
        gradoEscolarId: puedeVerTodosLosGrados
          ? filtros.gradoEscolarId
          : undefined,
        limite: 4,
      });
      setRecomendaciones(respuesta.recursos);
    } catch {
      setRecomendaciones([]);
    }
  }

  function manejarFiltro(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    if (filtros.recursoId || busquedaUrl || recursoIdUrl) {
      setSearchParams({}, { replace: true });
    }
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'busqueda' ? { recursoId: '' } : {}),
    }));

    setPagina(1);
  }

  function limpiarFiltros() {
    if (busquedaUrl || recursoIdUrl) {
      setSearchParams({}, { replace: true });
    }
    setFiltros({
      busqueda: '',
      tipoArchivo: '',
      gradoEscolarId: '',
      recursoId: '',
    });
    setPagina(1);
  }

  async function cargarResumenCalificacion(recursoId: number) {
    try {
      const resumen = await obtenerResumenCalificacionRecurso(recursoId);
      setResumenCalificacion(resumen);
    } catch {
      setResumenCalificacion(null);
    }
  }

  async function manejarCalificacion(valor: number) {
    if (!recursoSeleccionado || guardandoCalificacion) {
      return;
    }

    try {
      setGuardandoCalificacion(true);
      await calificarRecurso(recursoSeleccionado.id, valor);
      await cargarResumenCalificacion(recursoSeleccionado.id);
    } catch {
      alert('No se pudo guardar la calificación.');
    } finally {
      setGuardandoCalificacion(false);
    }
  }

  async function abrirResumenIa(recurso: Recurso, forzar = false) {
    if (!puedeGenerarResumenIa(recurso) || resumiendoId) {
      return;
    }

    setRecursoResumenIa(recurso);
    setRecursoSeleccionado(null);

    if (
      resumenesIa[recurso.id] &&
      resumenesIa[recurso.id].proveedor !== 'extractivo' &&
      !forzar
    ) {
      return;
    }

    try {
      setErrorResumenIa('');
      setEstadoResumenIa('Preparando resumen AI.');
      if (forzar || resumenesIa[recurso.id]?.proveedor === 'extractivo') {
        setResumenesIa((prev) => {
          const copia = { ...prev };
          delete copia[recurso.id];
          return copia;
        });
      }
      setResumiendoId(recurso.id);
      let resumenParcial = '';

      await generarResumenIaRecursoStream(recurso.id, forzar, (evento) => {
        if (evento.tipo === 'estado') {
          setEstadoResumenIa(evento.mensaje);
          return;
        }

        if (evento.tipo === 'reiniciar') {
          resumenParcial = '';
          setResumenesIa((prev) => {
            const copia = { ...prev };
            delete copia[recurso.id];
            return copia;
          });
          return;
        }

        if (evento.tipo === 'delta') {
          resumenParcial += evento.texto;
          setResumenesIa((prev) => ({
            ...prev,
            [recurso.id]: {
              recursoId: recurso.id,
              resumen: resumenParcial,
              proveedor: 'generando',
              modelo: 'stream',
              generadoEn: new Date().toISOString(),
              desdeCache: false,
              caracteresAnalizados: prev[recurso.id]?.caracteresAnalizados || 0,
              extension: obtenerExtension(recurso),
            },
          }));
          return;
        }

        if (evento.tipo === 'final') {
          setResumenesIa((prev) => ({
            ...prev,
            [recurso.id]: evento.resumen,
          }));
          setEstadoResumenIa('Resumen listo.');
        }
      });
    } catch (error) {
      setErrorResumenIa(
        error instanceof Error
          ? error.message
          : 'No se pudo generar el resumen AI.',
      );
    } finally {
      setResumiendoId(null);
    }
  }

  function cerrarResumenIa() {
    setRecursoResumenIa(null);
    setErrorResumenIa('');
    setEstadoResumenIa('');
  }

  function manejarClickResumenIa(
    event: MouseEvent<HTMLButtonElement>,
    recurso: Recurso,
  ) {
    event.stopPropagation();
    abrirResumenIa(recurso);
  }

  function renderVistaPrevia(recurso: Recurso) {
    const url = obtenerUrlRecurso(recurso);

    if (!url) {
      return (
        <div className="resource-preview-empty">
          <span>Sin archivo</span>
          <p>Este recurso no tiene archivo o enlace asociado.</p>
        </div>
      );
    }

    if (puedePrevisualizarComoImagen(recurso)) {
      return <img src={url} alt={recurso.titulo} />;
    }

    if (puedePrevisualizarComoPdf(recurso)) {
      return <iframe src={url} title={recurso.titulo} />;
    }

    if (puedePrevisualizarComoVideo(recurso)) {
      return (
        <video controls>
          <source src={url} />
        </video>
      );
    }

    if (puedePrevisualizarComoOffice(recurso)) {
      return <iframe src={crearUrlOfficeViewer(url)} title={recurso.titulo} />;
    }

    return (
      <div className="resource-preview-empty">
        <span>{describirTipoArchivo(recurso)}</span>
        <p>
          Abre el recurso en una nueva pestaña para visualizar su contenido.
        </p>
        <a href={url} target="_blank" rel="noreferrer">
          Abrir recurso
        </a>
      </div>
    );
  }

  function renderTarjeta(recurso: Recurso) {
    const palabrasClave = separarPalabrasClave(recurso.palabrasClave);
    const recomendado = recomendacionesPorId.get(recurso.id);
    const resumenDisponible = puedeGenerarResumenIa(recurso);

    return (
      <article
        className={`resource-card ${recomendado ? 'recommended' : ''}`}
        key={recurso.id}
        onClick={() => setRecursoSeleccionado(recurso)}
      >
        {(recomendado || resumenDisponible) && (
          <div className="resource-card-actions">
            {recomendado && (
              <span
                className="resource-recommended-star"
                title={recomendado.motivos?.[0] || 'Recurso recomendado'}
              >
                ★
              </span>
            )}

            {resumenDisponible && (
              <button
                className="resource-ai-button"
                type="button"
                title="Generar resumen AI"
                onClick={(event) => manejarClickResumenIa(event, recurso)}
                disabled={resumiendoId === recurso.id}
              >
                {resumiendoId === recurso.id ? '...' : 'AI'}
              </button>
            )}
          </div>
        )}

        <div className={`resource-file-icon ${obtenerClaseArchivo(recurso)}`}>
          {describirTipoArchivo(recurso)}
        </div>

        <div className="resource-card-body">
          <span className="resource-category">
            {recurso.categoria?.nombre || 'Sin categoría'}
          </span>
          <h2>{recurso.titulo}</h2>
          <p>{recurso.contenidoResumen || 'Sin introducción registrada.'}</p>
        </div>

        <div className="resource-tags">
          {palabrasClave.length > 0 ? (
            palabrasClave.map((palabra) => <span key={palabra}>{palabra}</span>)
          ) : (
            <span>Sin palabras clave</span>
          )}
        </div>

        <div className="resource-card-footer">
          <small>
            {recurso.tipoRecurso?.nombre || describirTipoArchivo(recurso)}
          </small>
          <button type="button">Ver detalle</button>
        </div>
      </article>
    );
  }

  function renderFila(recurso: Recurso) {
    const recomendado = recomendacionesPorId.get(recurso.id);

    return (
      <button
        className={`resource-row ${recomendado ? 'recommended' : ''}`}
        key={recurso.id}
        onClick={() => setRecursoSeleccionado(recurso)}
      >
        <span className="resource-row-main">
          {recomendado && (
            <span
              className="resource-recommended-star row"
              title={recomendado.motivos?.[0] || 'Recurso recomendado'}
            >
              ★
            </span>
          )}
          <span className={`resource-row-icon ${obtenerClaseArchivo(recurso)}`}>
            {describirTipoArchivo(recurso)}
          </span>
          <span>
            <strong>{recurso.titulo}</strong>
            <small>
              {recurso.contenidoResumen || 'Sin introducción registrada.'}
            </small>
          </span>
        </span>

        <span>{recurso.categoria?.nombre || 'Sin categoría'}</span>
        <span>
          {recurso.gradoEscolar?.nombre ||
            recurso.nivelAcademico ||
            'Sin grado'}
        </span>
      </button>
    );
  }

  return (
    <section className="repositorio-page">
      <div className="repositorio-header">
        <div>
          <span className="section-label">Repositorio académico</span>
          <h1>Gestor de recursos</h1>
          <p>Consulta materiales educativos publicados para tu institución.</p>
        </div>

        <div className="repo-view-toggle" aria-label="Cambiar vista">
          <button
            className={vista === 'tarjetas' ? 'active' : ''}
            onClick={() => setVista('tarjetas')}
          >
            Tarjetas
          </button>
          <button
            className={vista === 'lista' ? 'active' : ''}
            onClick={() => setVista('lista')}
          >
            Lista
          </button>
        </div>
      </div>

      <div className="repo-toolbar">
        <input
          name="busqueda"
          value={filtros.busqueda}
          onChange={manejarFiltro}
          placeholder="Buscar recursos por título, autor, palabras clave o nivel"
        />

        <select
          name="tipoArchivo"
          value={filtros.tipoArchivo}
          onChange={manejarFiltro}
        >
          <option value="">Todos los formatos</option>
          <option value="pdf">PDF</option>
          <option value="word">Word</option>
          <option value="excel">Excel</option>
          <option value="slide">PowerPoint</option>
          <option value="image">Imagen</option>
          <option value="video">Video</option>
          <option value="link">Enlace</option>
        </select>

        {puedeVerTodosLosGrados && (
          <select
            name="gradoEscolarId"
            value={filtros.gradoEscolarId}
            onChange={manejarFiltro}
          >
            <option value="">Todos los grados</option>
            {gradosEscolares.map((grado) => (
              <option key={grado.id} value={grado.id}>
                {grado.nombre}
              </option>
            ))}
          </select>
        )}

        <button className="secondary-button" onClick={limpiarFiltros}>
          Limpiar
        </button>
      </div>

      {cargando && <p className="state-message">Cargando recursos...</p>}
      {error && <p className="state-message error">{error}</p>}

      {!cargando && !error && recursos.length === 0 && (
        <div className="repo-empty">
          <span>Repositorio vacío</span>
          <p>
            No hay recursos publicados que coincidan con la búsqueda actual.
          </p>
        </div>
      )}

      {!cargando && !error && recursos.length > 0 && (
        <>
          {vista === 'tarjetas' ? (
            <div className="resource-grid">
              {recursosOrdenados.map((recurso) => renderTarjeta(recurso))}
            </div>
          ) : (
            <div className="resource-list">
              <div className="resource-list-head">
                <span>Recurso</span>
                <span>Categoría</span>
                <span>Grado</span>
              </div>
              {recursosOrdenados.map((recurso) => renderFila(recurso))}
            </div>
          )}

          <div className="pagination-bar repo-pagination">
            <span>
              {total} recursos publicados · Página {pagina} de {totalPaginas}
            </span>
            <div>
              <button
                className="secondary-button"
                onClick={() => setPagina((prev) => Math.max(prev - 1, 1))}
                disabled={pagina <= 1}
              >
                Anterior
              </button>
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
          </div>
        </>
      )}

      {recursoSeleccionado && (
        <div className="resource-modal-overlay">
          <div className="resource-modal">
            <div className="resource-modal-header">
              <div>
                <span className="section-label">Detalle del recurso</span>
                <h2>{recursoSeleccionado.titulo}</h2>
                <p>
                  {recursoSeleccionado.categoria?.nombre || 'Sin categoría'} ·{' '}
                  {describirTipoArchivo(recursoSeleccionado)}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setRecursoSeleccionado(null)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="resource-modal-content">
              <div className="resource-preview">
                {renderVistaPrevia(recursoSeleccionado)}
              </div>

              <aside className="resource-detail-panel">
                <div className="resource-rating-box">
                  <span>Calificación</span>
                  <strong>
                    {resumenCalificacion?.promedio
                      ? resumenCalificacion.promedio.toFixed(1)
                      : '0.0'}
                  </strong>
                  <small>{resumenCalificacion?.total || 0} valoraciones</small>
                  <div className="resource-stars">
                    {[1, 2, 3, 4, 5].map((valor) => (
                      <button
                        key={valor}
                        className={
                          valor <= (resumenCalificacion?.miCalificacion || 0)
                            ? 'active'
                            : ''
                        }
                        onClick={() => manejarCalificacion(valor)}
                        disabled={guardandoCalificacion}
                        aria-label={`Calificar con ${valor} estrellas`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span>Introducción</span>
                  <p>
                    {recursoSeleccionado.contenidoResumen ||
                      'Este recurso no tiene introducción registrada.'}
                  </p>
                </div>

                <dl>
                  <div>
                    <dt>Tipo</dt>
                    <dd>
                      {recursoSeleccionado.tipoRecurso?.nombre ||
                        describirTipoArchivo(recursoSeleccionado)}
                    </dd>
                  </div>
                  <div>
                    <dt>Grado escolar</dt>
                    <dd>
                      {recursoSeleccionado.gradoEscolar?.nombre ||
                        recursoSeleccionado.nivelAcademico ||
                        'Sin grado'}
                    </dd>
                  </div>
                  <div>
                    <dt>Autor</dt>
                    <dd>{recursoSeleccionado.autorNombre || 'Sin autor'}</dd>
                  </div>
                  <div>
                    <dt>Fuente</dt>
                    <dd>{recursoSeleccionado.fuente || 'Sin fuente'}</dd>
                  </div>
                  <div>
                    <dt>Institución</dt>
                    <dd>
                      {recursoSeleccionado.institucion?.nombre ||
                        'Sin institución'}
                    </dd>
                  </div>
                  <div>
                    <dt>Responsable</dt>
                    <dd>{nombreCreador(recursoSeleccionado)}</dd>
                  </div>
                </dl>

                <div className="resource-detail-tags">
                  {separarPalabrasClave(recursoSeleccionado.palabrasClave).map(
                    (palabra) => (
                      <span key={palabra}>{palabra}</span>
                    ),
                  )}
                </div>

                {obtenerUrlRecurso(recursoSeleccionado) && (
                  <a
                    className="resource-open-link"
                    href={obtenerUrlRecurso(recursoSeleccionado)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir en nueva pestaña
                  </a>
                )}

                {puedeGenerarResumenIa(recursoSeleccionado) && (
                  <button
                    className="resource-ai-detail-button"
                    type="button"
                    onClick={() => abrirResumenIa(recursoSeleccionado)}
                    disabled={resumiendoId === recursoSeleccionado.id}
                  >
                    {resumiendoId === recursoSeleccionado.id
                      ? 'Generando resumen AI...'
                      : 'Resumen AI'}
                  </button>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}

      {recursoResumenIa && (
        <div className="resource-ai-modal-overlay">
          <div className="resource-ai-modal">
            <div className="resource-ai-modal-header">
              <div>
                <span className="section-label">Resumen AI</span>
                <h2>{recursoResumenIa.titulo}</h2>
                <p>
                  {describirTipoArchivo(recursoResumenIa)} ·{' '}
                  {recursoResumenIa.categoria?.nombre || 'Sin categoría'}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={cerrarResumenIa}
                aria-label="Cerrar resumen AI"
              >
                ×
              </button>
            </div>

            <div className="resource-ai-modal-content">
              <div className="resource-ai-file">
                <div className="resource-ai-file-head">
                  <span>Archivo</span>
                  {obtenerUrlRecurso(recursoResumenIa) && (
                    <a
                      href={obtenerUrlRecurso(recursoResumenIa)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir
                    </a>
                  )}
                </div>
                <div className="resource-preview resource-ai-preview">
                  {renderVistaPrevia(recursoResumenIa)}
                </div>
              </div>

              <aside className="resource-ai-result">
                <div className="resource-ai-result-head">
                  <div>
                    <span>Lectura generada</span>
                    <strong>
                      {resumenesIa[recursoResumenIa.id]
                        ? 'Resumen completo'
                        : 'Preparando resumen'}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => abrirResumenIa(recursoResumenIa, true)}
                    disabled={resumiendoId === recursoResumenIa.id}
                  >
                    {resumenesIa[recursoResumenIa.id] ? 'Regenerar' : 'Generar'}
                  </button>
                </div>

                {resumiendoId === recursoResumenIa.id && (
                  <div className="resource-ai-loading">
                    <span>AI</span>
                    <p>
                      {estadoResumenIa ||
                        'Analizando el archivo y preparando el resumen...'}
                    </p>
                  </div>
                )}

                {errorResumenIa && (
                  <p className="resource-ai-error">{errorResumenIa}</p>
                )}

                {resumenesIa[recursoResumenIa.id] && (
                  <>
                    <div className="resource-ai-text">
                      {resumenesIa[recursoResumenIa.id].resumen}
                    </div>
                    {resumenesIa[recursoResumenIa.id].proveedor !==
                      'generando' && (
                      <div className="resource-ai-meta">
                        <span>
                          {resumenesIa[recursoResumenIa.id].proveedor} ·{' '}
                          {resumenesIa[recursoResumenIa.id].modelo}
                        </span>
                        {resumenesIa[recursoResumenIa.id].desdeCache && (
                          <span>Guardado previamente</span>
                        )}
                      </div>
                    )}
                    {resumenesIa[recursoResumenIa.id].proveedor !==
                      'generando' && (
                      <CalificacionIa
                        key={`${recursoResumenIa.id}-${resumenesIa[recursoResumenIa.id].generadoEn}`}
                        titulo="¿Cómo calificas la generación de este resumen con AI?"
                        descripcion="Valora si el resumen fue claro, útil y fiel al documento."
                        modulo="recursos"
                        funcionalidad="resumen_ia_recurso"
                        entidadTipo="recurso"
                        entidadId={recursoResumenIa.id}
                        metadata={{
                          titulo: recursoResumenIa.titulo,
                          proveedor:
                            resumenesIa[recursoResumenIa.id].proveedor,
                          modelo: resumenesIa[recursoResumenIa.id].modelo,
                          desdeCache:
                            resumenesIa[recursoResumenIa.id].desdeCache,
                          extension:
                            resumenesIa[recursoResumenIa.id].extension,
                        }}
                      />
                    )}
                  </>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
