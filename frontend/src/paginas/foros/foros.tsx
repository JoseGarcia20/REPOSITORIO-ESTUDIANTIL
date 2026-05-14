import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  cerrarForoAcademico,
  comentarForoAcademico,
  crearForoAcademico,
  esSuperadministrador,
  obtenerCategoriasForo,
  obtenerForosAcademicos,
  obtenerInstitucionesAdmin,
  obtenerUsuarioAutenticado,
  PERMISOS,
  usuarioTienePermiso,
} from '../../api/adminApi';
import type {
  Categoria,
  ForoAcademico,
  InstitucionCatalogo,
} from '../../api/adminApi';
import './foros.css';

type FormularioForo = {
  titulo: string;
  descripcion: string;
  categoriaId: string;
  institucionId: string;
  publico: boolean;
};

const formularioInicial: FormularioForo = {
  titulo: '',
  descripcion: '',
  categoriaId: '',
  institucionId: '',
  publico: false,
};

function iniciales(nombre?: string, apellido?: string) {
  return `${nombre?.charAt(0) || 'U'}${apellido?.charAt(0) || ''}`.toUpperCase();
}

function formatearFecha(valor: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(valor));
}

function describirAutor(
  rol?: string,
  institucion?: string,
  fecha?: string,
) {
  return [rol || 'Usuario', institucion, fecha].filter(Boolean).join(' · ');
}

export function Foros() {
  const usuario = obtenerUsuarioAutenticado();
  const esSuper = esSuperadministrador();
  const puedeCrear = usuarioTienePermiso(PERMISOS.FOROS_CREAR);
  const puedeCrearPublico = usuarioTienePermiso(PERMISOS.FOROS_CREAR_PUBLICO);
  const puedeComentar = usuarioTienePermiso(PERMISOS.FOROS_COMENTAR);

  const [foros, setForos] = useState<ForoAcademico[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [instituciones, setInstituciones] = useState<InstitucionCatalogo[]>([]);
  const [comentarios, setComentarios] = useState<Record<number, string>>({});
  const [cargando, setCargando] = useState(true);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    publico: '',
    cerrado: '',
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [comentandoId, setComentandoId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<FormularioForo>({
    ...formularioInicial,
    institucionId: esSuper ? '' : String(usuario?.institucion?.id || ''),
  });

  const categoriasDisponibles = useMemo(() => {
    const institucionId = Number(formulario.institucionId);

    if (!institucionId || !esSuper) {
      return categorias;
    }

    return categorias.filter(
      (categoria) => categoria.institucionId === institucionId,
    );
  }, [categorias, esSuper, formulario.institucionId]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarForos();
  }, [pagina, filtros.busqueda, filtros.publico, filtros.cerrado]);

  async function cargarCatalogos() {
    try {
      setCargandoCatalogos(true);

      const promesas: [
        Promise<Categoria[] | null>,
        Promise<InstitucionCatalogo[] | null>,
      ] = [
        puedeCrear ? obtenerCategoriasForo() : Promise.resolve(null),
        esSuper ? obtenerInstitucionesAdmin() : Promise.resolve(null),
      ];

      const [categoriasData, institucionesData] = await Promise.all(promesas);
      setCategorias(categoriasData || []);
      setInstituciones(institucionesData || []);
    } catch {
      setError('No se pudieron cargar los catálogos de foros');
    } finally {
      setCargandoCatalogos(false);
    }
  }

  async function cargarForos() {
    try {
      setCargando(true);
      setError('');

      const forosData = await obtenerForosAcademicos({
        pagina,
        limite: 10,
        busqueda: filtros.busqueda,
        publico: filtros.publico,
        cerrado: filtros.cerrado,
      });

      setForos(forosData.data);
      setTotal(forosData.total);
      setTotalPaginas(forosData.totalPaginas);
    } catch {
      setError('No se pudieron cargar los foros académicos');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal() {
    setFormulario({
      ...formularioInicial,
      institucionId: esSuper ? '' : String(usuario?.institucion?.id || ''),
    });
    setModalAbierto(true);
  }

  function manejarFiltro(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
    setPagina(1);
  }

  function limpiarFiltros() {
    setFiltros({
      busqueda: '',
      publico: '',
      cerrado: '',
    });
    setPagina(1);
  }

  function cerrarModal() {
    if (!guardando) {
      setModalAbierto(false);
    }
  }

  function manejarCambio(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    if (name === 'institucionId') {
      setFormulario((prev) => ({
        ...prev,
        institucionId: value,
        categoriaId: '',
      }));
      return;
    }

    setFormulario((prev) => ({ ...prev, [name]: value }));
  }

  function manejarPublico(event: ChangeEvent<HTMLInputElement>) {
    setFormulario((prev) => ({
      ...prev,
      publico: event.target.checked,
    }));
  }

  async function guardarForo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setGuardando(true);

      await crearForoAcademico({
        titulo: formulario.titulo,
        descripcion: formulario.descripcion,
        categoriaId: Number(formulario.categoriaId),
        publico: formulario.publico,
        ...(esSuper ? { institucionId: Number(formulario.institucionId) } : {}),
      });

      setPagina(1);
      await cargarForos();
      setModalAbierto(false);
    } catch {
      alert('No se pudo crear el foro.');
    } finally {
      setGuardando(false);
    }
  }

  async function enviarComentario(foroId: number) {
    const contenido = comentarios[foroId]?.trim();

    if (!contenido) {
      return;
    }

    try {
      setComentandoId(foroId);
      await comentarForoAcademico(foroId, contenido);
      setComentarios((prev) => ({ ...prev, [foroId]: '' }));
      await cargarForos();
    } catch {
      alert('No se pudo publicar el comentario.');
    } finally {
      setComentandoId(null);
    }
  }

  async function cerrarForo(foro: ForoAcademico) {
    const confirmar = window.confirm(
      '¿Deseas cerrar este foro? Ya no se podrán agregar comentarios.',
    );

    if (!confirmar) {
      return;
    }

    try {
      await cerrarForoAcademico(foro.id);
      await cargarForos();
    } catch {
      alert('No se pudo cerrar el foro.');
    }
  }

  function puedeCerrarForo(foro: ForoAcademico) {
    return (
      !foro.cerrado &&
      usuarioTienePermiso(PERMISOS.FOROS_CERRAR) &&
      (esSuper || foro.usuarioId === usuario?.id)
    );
  }

  return (
    <section className="instituciones-page">
      <div className="instituciones-header">
        <div>
          <span className="section-label">Comunidad académica</span>
          <h1>Foros académicos</h1>
          <p>Publica temas de interés y participa con aportes académicos.</p>
        </div>

        {puedeCrear && (
          <button className="primary-button" onClick={abrirModal}>
            + Nuevo foro
          </button>
        )}
      </div>

      <div className="foros-shell">
        <div className="forum-filters">
          <input
            name="busqueda"
            value={filtros.busqueda}
            onChange={manejarFiltro}
            placeholder="Buscar foros por título o contenido"
          />

          <select name="publico" value={filtros.publico} onChange={manejarFiltro}>
            <option value="">Todos los alcances</option>
            <option value="true">Públicos</option>
            <option value="false">Institucionales</option>
          </select>

          <select name="cerrado" value={filtros.cerrado} onChange={manejarFiltro}>
            <option value="">Abiertos y cerrados</option>
            <option value="false">Abiertos</option>
            <option value="true">Cerrados</option>
          </select>

          <button className="secondary-button" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>

        {(cargando || cargandoCatalogos) && (
          <p className="state-message">Cargando foros...</p>
        )}
        {error && <p className="state-message error">{error}</p>}

        {!cargando && !cargandoCatalogos && !error && foros.length === 0 && (
          <div className="forum-empty">No hay foros publicados.</div>
        )}

        {!cargando && !cargandoCatalogos && !error && foros.length > 0 && (
          <>
            <div className="forum-feed">
              {foros.map((foro) => (
                <article className="forum-post" key={foro.id}>
                <div className="forum-post-header">
                  <div className="forum-author">
                    <span className="forum-avatar">
                      {iniciales(foro.usuario?.nombres, foro.usuario?.apellidos)}
                    </span>
                    <div>
                      <h3>
                        {foro.usuario?.nombres} {foro.usuario?.apellidos}
                      </h3>
                      <p>
                        {describirAutor(
                          foro.usuario?.rol?.nombre,
                          foro.usuario?.institucion?.nombre ||
                            foro.institucion?.nombre,
                          formatearFecha(foro.createdAt),
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="forum-meta">
                    {foro.institucion?.nombre || 'Institución'}
                  </span>
                </div>

                <div className="forum-post-body">
                  <h2>{foro.titulo}</h2>
                  <p>{foro.descripcion}</p>
                </div>

                <div className="forum-badges">
                  <span className="forum-badge">
                    {foro.categoria?.nombre || 'Sin categoría'}
                  </span>
                  <span className={`forum-badge ${foro.publico ? 'public' : ''}`}>
                    {foro.publico ? 'Público' : 'Institucional'}
                  </span>
                  {foro.cerrado && (
                    <span className="forum-badge closed">Cerrado</span>
                  )}
                </div>

                <div className="forum-actions-row">
                  <span className="forum-meta">
                    {foro.comentarios.length} comentarios
                  </span>

                  {puedeCerrarForo(foro) && (
                    <button
                      className="secondary-button"
                      onClick={() => cerrarForo(foro)}
                    >
                      Cerrar foro
                    </button>
                  )}
                </div>

                <div className="forum-comments">
                  {foro.comentarios.map((comentario) => (
                    <div className="forum-comment" key={comentario.id}>
                      <span className="forum-avatar">
                        {iniciales(
                          comentario.usuario?.nombres,
                          comentario.usuario?.apellidos,
                        )}
                      </span>
                      <div className="forum-comment-content">
                        <strong>
                          {comentario.usuario?.nombres}{' '}
                          {comentario.usuario?.apellidos}
                        </strong>
                        <span className="forum-comment-meta">
                          {describirAutor(
                            comentario.usuario?.rol?.nombre,
                            comentario.usuario?.institucion?.nombre,
                          )}
                        </span>
                        <p>{comentario.contenido}</p>
                      </div>
                    </div>
                  ))}

                  {puedeComentar && !foro.cerrado && (
                    <form
                      className="comment-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        enviarComentario(foro.id);
                      }}
                    >
                      <textarea
                        value={comentarios[foro.id] || ''}
                        onChange={(event) =>
                          setComentarios((prev) => ({
                            ...prev,
                            [foro.id]: event.target.value,
                          }))
                        }
                        placeholder="Escribe un aporte académico..."
                        required
                      />
                      <button
                        className="primary-button"
                        type="submit"
                        disabled={comentandoId === foro.id}
                      >
                        {comentandoId === foro.id ? 'Publicando...' : 'Comentar'}
                      </button>
                    </form>
                  )}

                  {foro.cerrado && (
                    <span className="forum-meta">
                      Este foro está cerrado para nuevos comentarios.
                    </span>
                  )}
                </div>
                </article>
              ))}
            </div>

            <div className="pagination-bar forum-pagination">
              <span>
                {total} foros · Página {pagina} de {totalPaginas}
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
      </div>

      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div>
                <span className="section-label">Publicación</span>
                <h2>Crear foro académico</h2>
                <p>Comparte un tema para abrir conversación académica.</p>
              </div>

              <button className="modal-close" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="institution-form" onSubmit={guardarForo}>
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label>Título</label>
                  <input
                    name="titulo"
                    value={formulario.titulo}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                {esSuper && (
                  <div className="form-group">
                    <label>Institución</label>
                    <select
                      name="institucionId"
                      value={formulario.institucionId}
                      onChange={manejarCambio}
                      required
                    >
                      <option value="">Selecciona una institución</option>
                      {instituciones.map((institucion) => (
                        <option key={institucion.id} value={institucion.id}>
                          {institucion.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    name="categoriaId"
                    value={formulario.categoriaId}
                    onChange={manejarCambio}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categoriasDisponibles.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {puedeCrearPublico && (
                  <div className="form-group">
                    <label>Alcance</label>
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={formulario.publico}
                        onChange={manejarPublico}
                      />
                      Público para todas las instituciones
                    </label>
                  </div>
                )}

                <div className="form-group form-group-full">
                  <label>Contenido</label>
                  <textarea
                    name="descripcion"
                    value={formulario.descripcion}
                    onChange={manejarCambio}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={guardando}
                >
                  {guardando ? 'Publicando...' : 'Publicar foro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
