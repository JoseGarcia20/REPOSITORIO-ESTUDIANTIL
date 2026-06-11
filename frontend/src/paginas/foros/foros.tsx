import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  cerrarForoAcademico,
  comentarForoAcademico,
  comentarForoConRecurso,
  comentarForoConRecursoExistente,
  construirUrlArchivoProtegido,
  crearForoAcademico,
  esSuperadministrador,
  obtenerCategoriasForo,
  obtenerForosAcademicos,
  obtenerGradosEscolares,
  obtenerInstitucionesAdmin,
  obtenerUsuarioAutenticado,
  PERMISOS,
  usuarioTienePermiso,
} from '../../api/adminApi';
import type {
  Categoria,
  ComentarioForo,
  ForoAcademico,
  GradoEscolar,
  InstitucionCatalogo,
  RecursoAsistente,
} from '../../api/adminApi';
import { RecursosRecomendados } from '../../componentes/recomendaciones/recursosRecomendados';
import { PantallaCarga } from '../../componentes/carga/pantallaCarga';
import './foros.css';

type FormularioForo = {
  titulo: string;
  descripcion: string;
  categoriaIds: string[];
  institucionId: string;
  publico: boolean;
};

type FormularioComentarioForo = {
  contenido: string;
  adjuntar: boolean;
  tituloRecurso: string;
  gradoEscolarId: string;
  archivo: File | null;
};

type ContextoRecomendacionForo = {
  titulo: string;
  descripcion: string;
  tema: string;
  categoriaId?: number | string;
  categoriaIds?: number | string;
  foroId?: number;
};

const formularioInicial: FormularioForo = {
  titulo: '',
  descripcion: '',
  categoriaIds: [],
  institucionId: '',
  publico: false,
};

const formularioComentarioInicial: FormularioComentarioForo = {
  contenido: '',
  adjuntar: false,
  tituloRecurso: '',
  gradoEscolarId: '',
  archivo: null,
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

function describirAutor(rol?: string, institucion?: string, fecha?: string) {
  return [rol || 'Usuario', institucion, fecha].filter(Boolean).join(' · ');
}

function construirUrlRecurso(ruta?: string, url?: string) {
  const valor = ruta || url || '';

  return construirUrlArchivoProtegido(valor);
}

export function Foros() {
  const usuario = obtenerUsuarioAutenticado();
  const esSuper = esSuperadministrador();
  const puedeCrear = usuarioTienePermiso(PERMISOS.FOROS_CREAR);
  const puedeCrearPublico = usuarioTienePermiso(PERMISOS.FOROS_CREAR_PUBLICO);
  const puedeComentar = usuarioTienePermiso(PERMISOS.FOROS_COMENTAR);
  const puedeSubirRecurso = usuarioTienePermiso(PERMISOS.FOROS_SUBIR_RECURSO);

  const [foros, setForos] = useState<ForoAcademico[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [instituciones, setInstituciones] = useState<InstitucionCatalogo[]>([]);
  const [gradosEscolares, setGradosEscolares] = useState<GradoEscolar[]>([]);
  const [formulariosComentario, setFormulariosComentario] = useState<
    Record<number, FormularioComentarioForo>
  >({});
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
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [comentandoId, setComentandoId] = useState<number | null>(null);
  const [foroConversacionId, setForoConversacionId] = useState<number | null>(
    null,
  );
  const [foroAdjuntosId, setForoAdjuntosId] = useState<number | null>(null);
  const [contextoRecomendacion, setContextoRecomendacion] =
    useState<ContextoRecomendacionForo | null>(null);
  const [formulario, setFormulario] = useState<FormularioForo>({
    ...formularioInicial,
    institucionId: esSuper ? '' : String(usuario?.institucion?.id || ''),
  });

  const categoriasDisponibles = useMemo(() => {
    const institucionId = Number(formulario.institucionId);

    if (!esSuper) {
      return categorias;
    }

    if (!institucionId) {
      return [];
    }

    return categorias.filter(
      (categoria) => categoria.institucionId === institucionId,
    );
  }, [categorias, esSuper, formulario.institucionId]);

  const foroConversacion = useMemo(
    () => foros.find((foro) => foro.id === foroConversacionId) || null,
    [foros, foroConversacionId],
  );
  const foroAdjuntos = useMemo(
    () => foros.find((foro) => foro.id === foroAdjuntosId) || null,
    [foros, foroAdjuntosId],
  );

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarForos();
  }, [pagina, filtros.busqueda, filtros.publico, filtros.cerrado]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      const busqueda = busquedaTexto.trim();

      setFiltros((prev) => {
        if (prev.busqueda === busqueda) {
          return prev;
        }

        setPagina(1);
        return { ...prev, busqueda };
      });
    }, 350);

    return () => window.clearTimeout(temporizador);
  }, [busquedaTexto]);

  async function cargarCatalogos() {
    try {
      setCargandoCatalogos(true);

      const [categoriasData, institucionesData, gradosData] = await Promise.all(
        [
          puedeCrear ? obtenerCategoriasForo() : Promise.resolve(null),
          esSuper ? obtenerInstitucionesAdmin() : Promise.resolve(null),
          puedeSubirRecurso ? obtenerGradosEscolares() : Promise.resolve(null),
        ] as const,
      );
      setCategorias(categoriasData || []);
      setInstituciones(institucionesData || []);
      setGradosEscolares(gradosData || []);
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

    if (name === 'busqueda') {
      setBusquedaTexto(value);
      return;
    }

    setFiltros((prev) => ({ ...prev, [name]: value }));
    setPagina(1);
  }

  function limpiarFiltros() {
    setBusquedaTexto('');
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
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;

    if (name === 'institucionId') {
      setFormulario((prev) => ({
        ...prev,
        institucionId: value,
        categoriaIds: [],
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

  function alternarCategoriaForo(categoriaId: number, seleccionado: boolean) {
    const valor = String(categoriaId);
    setFormulario((prev) => ({
      ...prev,
      categoriaIds: seleccionado
        ? Array.from(new Set([...prev.categoriaIds, valor]))
        : prev.categoriaIds.filter((id) => id !== valor),
    }));
  }

  async function guardarForo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (esSuper && !formulario.institucionId) {
      alert('Debes seleccionar una institución para cargar sus categorías.');
      return;
    }

    if (formulario.categoriaIds.length === 0) {
      alert('Debes seleccionar al menos una categoría.');
      return;
    }

    try {
      setGuardando(true);

      await crearForoAcademico({
        titulo: formulario.titulo,
        descripcion: formulario.descripcion,
        categoriaIds: formulario.categoriaIds.map((categoriaId) =>
          Number(categoriaId),
        ),
        publico: formulario.publico,
        ...(esSuper ? { institucionId: Number(formulario.institucionId) } : {}),
      });

      setPagina(1);
      await cargarForos();
      setModalAbierto(false);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'No se pudo crear el foro.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function enviarComentario(foroId: number) {
    const formularioComentario =
      formulariosComentario[foroId] || formularioComentarioInicial;
    const contenido = formularioComentario.contenido.trim();

    if (!contenido) {
      return;
    }

    try {
      setComentandoId(foroId);

      if (formularioComentario.archivo && puedeSubirRecurso) {
        await comentarForoConRecurso(foroId, {
          contenido,
          archivo: formularioComentario.archivo,
          titulo: formularioComentario.tituloRecurso.trim() || undefined,
          gradoEscolarId: formularioComentario.gradoEscolarId || undefined,
        });
      } else {
        await comentarForoAcademico(foroId, contenido);
      }

      setFormulariosComentario((prev) => ({
        ...prev,
        [foroId]: formularioComentarioInicial,
      }));
      await cargarForos();
    } catch {
      alert('No se pudo publicar el comentario.');
    } finally {
      setComentandoId(null);
    }
  }

  function obtenerFormularioComentario(foroId: number) {
    return formulariosComentario[foroId] || formularioComentarioInicial;
  }

  function actualizarFormularioComentario(
    foroId: number,
    cambios: Partial<FormularioComentarioForo>,
  ) {
    setFormulariosComentario((prev) => ({
      ...prev,
      [foroId]: {
        ...formularioComentarioInicial,
        ...prev[foroId],
        ...cambios,
      },
    }));
  }

  function alternarAdjuntoComentario(foroId: number) {
    const formularioActual = obtenerFormularioComentario(foroId);
    actualizarFormularioComentario(foroId, {
      adjuntar: !formularioActual.adjuntar,
      archivo: formularioActual.adjuntar ? null : formularioActual.archivo,
    });
  }

  function seleccionarArchivoComentario(
    foroId: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    actualizarFormularioComentario(foroId, {
      archivo: event.target.files?.[0] || null,
    });
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

  function obtenerCategoriasVisibles(foro: ForoAcademico) {
    const categoriasForo = foro.categorias
      ?.map((item) => item.categoria)
      .filter(Boolean);

    return categoriasForo?.length
      ? categoriasForo
      : foro.categoria
        ? [foro.categoria]
        : [];
  }

  function abrirRecomendacionesCrearForo() {
    const categoriasSeleccionadas = categoriasDisponibles.filter((categoria) =>
      formulario.categoriaIds.includes(String(categoria.id)),
    );
    const nombresCategorias = categoriasSeleccionadas
      .map((categoria) => categoria.nombre)
      .join(' ');

    setContextoRecomendacion({
      titulo: 'Recursos recomendados para el foro',
      descripcion:
        'Sugerencias del repositorio según el título, contenido y categoría seleccionada.',
      tema:
        `${formulario.titulo} ${formulario.descripcion} ${nombresCategorias}`.trim() ||
        'discusión académica investigación',
      categoriaIds: formulario.categoriaIds.join(','),
    });
  }

  function abrirRecomendacionesComentario(foro: ForoAcademico) {
    const formularioComentario = obtenerFormularioComentario(foro.id);
    const categoriasForo = obtenerCategoriasVisibles(foro);
    const nombresCategorias = categoriasForo
      .map((categoria) => categoria.nombre)
      .join(' ');

    setContextoRecomendacion({
      titulo: 'Recursos para responder este foro',
      descripcion:
        'Materiales que pueden ayudarte a preparar una respuesta académica.',
      tema: `${foro.titulo} ${foro.descripcion} ${nombresCategorias} ${formularioComentario.contenido}`,
      categoriaIds: categoriasForo.map((categoria) => categoria.id).join(','),
      foroId: foro.id,
    });
  }

  async function usarRecursoRecomendadoEnComentario(recurso: RecursoAsistente) {
    if (!contextoRecomendacion?.foroId) {
      return;
    }

    const foroId = contextoRecomendacion.foroId;
    const formularioComentario = obtenerFormularioComentario(foroId);
    const contenido = formularioComentario.contenido.trim();

    if (!contenido) {
      alert(
        'Escribe primero el comentario que dará contexto al recurso recomendado.',
      );
      return;
    }

    try {
      setComentandoId(foroId);
      await comentarForoConRecursoExistente(foroId, {
        contenido,
        recursoId: recurso.id,
      });
      setFormulariosComentario((prev) => ({
        ...prev,
        [foroId]: formularioComentarioInicial,
      }));
      setContextoRecomendacion(null);
      await cargarForos();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo usar el recurso recomendado.',
      );
    } finally {
      setComentandoId(null);
    }
  }

  function obtenerRecursosForo(foro: ForoAcademico) {
    const recursosPorId = new Map<
      number,
      NonNullable<ForoAcademico['recursos']>[number]
    >();

    (foro.recursos || []).forEach((recurso) => {
      recursosPorId.set(recurso.id, recurso);
    });

    foro.comentarios.forEach((comentario) => {
      (comentario.recursos || []).forEach((recurso) => {
        recursosPorId.set(recurso.id, recurso);
      });
    });

    return Array.from(recursosPorId.values());
  }

  function renderRecursosComentario(comentario: ComentarioForo) {
    const recursos = comentario.recursos || [];

    if (recursos.length === 0) {
      return null;
    }

    return (
      <div className="forum-comment-resources">
        {recursos.map((recurso) => {
          const urlRecurso = construirUrlRecurso(
            recurso.rutaRecurso,
            recurso.urlRecurso,
          );

          return (
            <a
              className="forum-comment-resource"
              href={urlRecurso}
              key={recurso.id}
              target="_blank"
              rel="noreferrer"
            >
              <span>{recurso.tipoRecurso?.nombre || 'Archivo'}</span>
              <strong>{recurso.titulo}</strong>
            </a>
          );
        })}
      </div>
    );
  }

  function renderComentario(
    comentario: ComentarioForo,
    opciones: { compacto?: boolean } = {},
  ) {
    return (
      <div
        className={`forum-comment ${opciones.compacto ? 'compact' : ''}`}
        key={comentario.id}
      >
        <span className="forum-avatar">
          {iniciales(
            comentario.usuario?.nombres,
            comentario.usuario?.apellidos,
          )}
        </span>
        <div className="forum-comment-content">
          <strong>
            {comentario.usuario?.nombres} {comentario.usuario?.apellidos}
          </strong>
          <span className="forum-comment-meta">
            {describirAutor(
              comentario.usuario?.rol?.nombre,
              comentario.usuario?.institucion?.nombre,
            )}
          </span>
          <p>{comentario.contenido}</p>
          {renderRecursosComentario(comentario)}
        </div>
      </div>
    );
  }

  function renderFormularioComentario(
    foro: ForoAcademico,
    opciones: { compacto?: boolean } = {},
  ) {
    const formularioComentario = obtenerFormularioComentario(foro.id);

    if (!puedeComentar || foro.cerrado) {
      return null;
    }

    return (
      <form
        className={`comment-form ${opciones.compacto ? 'compact' : ''}`}
        onSubmit={(event) => {
          event.preventDefault();
          enviarComentario(foro.id);
        }}
      >
        <div className="comment-form-main">
          <textarea
            value={formularioComentario.contenido}
            onChange={(event) =>
              actualizarFormularioComentario(foro.id, {
                contenido: event.target.value,
              })
            }
            placeholder="Escribe un aporte académico..."
            required
          />

          {puedeSubirRecurso && formularioComentario.adjuntar && (
            <div className="comment-attachment-panel">
              <label>
                Archivo de soporte
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.mp4,.webm"
                  onChange={(event) =>
                    seleccionarArchivoComentario(foro.id, event)
                  }
                  required={formularioComentario.adjuntar}
                />
              </label>

              <label>
                Título del recurso
                <input
                  value={formularioComentario.tituloRecurso}
                  onChange={(event) =>
                    actualizarFormularioComentario(foro.id, {
                      tituloRecurso: event.target.value,
                    })
                  }
                  placeholder="Opcional"
                />
              </label>

              <label>
                Grado escolar
                <select
                  value={formularioComentario.gradoEscolarId}
                  onChange={(event) =>
                    actualizarFormularioComentario(foro.id, {
                      gradoEscolarId: event.target.value,
                    })
                  }
                >
                  <option value="">Clasificar por contexto</option>
                  {gradosEscolares.map((grado) => (
                    <option key={grado.id} value={grado.id}>
                      {grado.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="comment-form-actions">
          <button
            className="forum-recommend-button"
            type="button"
            onClick={() => abrirRecomendacionesComentario(foro)}
            title="Ver recursos recomendados"
          >
            ★ Recursos
          </button>

          {puedeSubirRecurso && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => alternarAdjuntoComentario(foro.id)}
            >
              {formularioComentario.adjuntar ? 'Quitar archivo' : 'Adjuntar'}
            </button>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={comentandoId === foro.id}
          >
            {comentandoId === foro.id ? 'Publicando...' : 'Comentar'}
          </button>
        </div>
      </form>
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
            value={busquedaTexto}
            onChange={manejarFiltro}
            placeholder="Buscar foros por título o contenido"
          />

          <select
            name="publico"
            value={filtros.publico}
            onChange={manejarFiltro}
          >
            <option value="">Todos los alcances</option>
            <option value="true">Públicos</option>
            <option value="false">Institucionales</option>
          </select>

          <select
            name="cerrado"
            value={filtros.cerrado}
            onChange={manejarFiltro}
          >
            <option value="">Abiertos y cerrados</option>
            <option value="false">Abiertos</option>
            <option value="true">Cerrados</option>
          </select>

          <button className="secondary-button" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>

        {(cargando || cargandoCatalogos) && (
          <PantallaCarga
            modo="panel"
            mensaje="Cargando foros"
            detalle="Estamos consultando la conversación académica."
          />
        )}
        {error && <p className="state-message error">{error}</p>}

        {!cargando && !cargandoCatalogos && !error && foros.length === 0 && (
          <div className="forum-empty">No hay foros publicados.</div>
        )}

        {!cargando && !cargandoCatalogos && !error && foros.length > 0 && (
          <>
            <div className="forum-feed">
              {foros.map((foro) => {
                const recursosForo = obtenerRecursosForo(foro);
                const comentariosRecientes = foro.comentarios.slice(-3);
                const categoriasForo = obtenerCategoriasVisibles(foro);

                return (
                  <article className="forum-post" key={foro.id}>
                    <div className="forum-post-header">
                      <div className="forum-author">
                        <span className="forum-avatar">
                          {iniciales(
                            foro.usuario?.nombres,
                            foro.usuario?.apellidos,
                          )}
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
                      {categoriasForo.length > 0 ? (
                        categoriasForo.map((categoria) => (
                          <span className="forum-badge" key={categoria.id}>
                            {categoria.nombre}
                          </span>
                        ))
                      ) : (
                        <span className="forum-badge">Sin categoría</span>
                      )}
                      <span
                        className={`forum-badge ${foro.publico ? 'public' : ''}`}
                      >
                        {foro.publico ? 'Público' : 'Institucional'}
                      </span>
                      {foro.cerrado && (
                        <span className="forum-badge closed">Cerrado</span>
                      )}
                    </div>

                    <div className="forum-actions-row">
                      <span className="forum-meta">
                        {foro.comentarios.length} comentarios ·{' '}
                        {recursosForo.length} recursos
                      </span>

                      <div className="forum-actions-buttons">
                        {recursosForo.length > 0 && (
                          <button
                            className="forum-attachments-button"
                            onClick={() => setForoAdjuntosId(foro.id)}
                            type="button"
                          >
                            <span className="attachment-glyph" />
                            Adjuntos
                            <strong>{recursosForo.length}</strong>
                          </button>
                        )}

                        <button
                          className="secondary-button"
                          onClick={() => setForoConversacionId(foro.id)}
                        >
                          Ver conversación
                        </button>

                        {puedeCerrarForo(foro) && (
                          <button
                            className="secondary-button"
                            onClick={() => cerrarForo(foro)}
                          >
                            Cerrar foro
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="forum-comments compact">
                      {comentariosRecientes.map((comentario) =>
                        renderComentario(comentario, { compacto: true }),
                      )}

                      {foro.comentarios.length > 3 && (
                        <button
                          className="forum-view-all"
                          onClick={() => setForoConversacionId(foro.id)}
                        >
                          Ver todos los comentarios
                        </button>
                      )}

                      {renderFormularioComentario(foro, { compacto: true })}

                      {foro.cerrado && (
                        <span className="forum-meta">
                          Este foro está cerrado para nuevos comentarios.
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
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

      {foroConversacion && (
        <div className="modal-overlay">
          <div className="modal-container forum-thread-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">Conversación académica</span>
                <h2>{foroConversacion.titulo}</h2>
                <p>{foroConversacion.descripcion}</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setForoConversacionId(null)}
              >
                ×
              </button>
            </div>

            <div className="forum-badges thread-badges">
              {obtenerCategoriasVisibles(foroConversacion).map((categoria) => (
                <span className="forum-badge" key={categoria.id}>
                  {categoria.nombre}
                </span>
              ))}
              <span
                className={`forum-badge ${
                  foroConversacion.publico ? 'public' : ''
                }`}
              >
                {foroConversacion.publico ? 'Público' : 'Institucional'}
              </span>
              {foroConversacion.cerrado && (
                <span className="forum-badge closed">Cerrado</span>
              )}
            </div>

            <div className="forum-thread-comments">
              {foroConversacion.comentarios.length > 0 ? (
                foroConversacion.comentarios.map((comentario) =>
                  renderComentario(comentario),
                )
              ) : (
                <p className="forum-meta">Aún no hay comentarios.</p>
              )}
            </div>

            {renderFormularioComentario(foroConversacion)}

            {foroConversacion.cerrado && (
              <span className="forum-meta thread-closed">
                Este foro está cerrado para nuevos comentarios.
              </span>
            )}
          </div>
        </div>
      )}

      {foroAdjuntos && (
        <div className="modal-overlay">
          <div className="modal-container forum-attachments-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">Archivos adjuntos</span>
                <h2>{foroAdjuntos.titulo}</h2>
                <p>
                  Recursos clasificados automáticamente desde los aportes del
                  foro.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setForoAdjuntosId(null)}
              >
                ×
              </button>
            </div>

            <div className="forum-attachments-list">
              {(foroAdjuntos.recursos || []).map((recurso) => {
                const urlRecurso = construirUrlRecurso(
                  recurso.rutaRecurso,
                  recurso.urlRecurso,
                );

                return (
                  <article className="forum-attachment-card" key={recurso.id}>
                    <span className="attachment-glyph large" />

                    <div>
                      <h3>{recurso.titulo}</h3>
                      <p>
                        {[
                          recurso.tipoRecurso?.nombre,
                          recurso.categoria?.nombre,
                          recurso.gradoEscolar?.nombre,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Recurso académico'}
                      </p>
                      {recurso.comentarioForo?.contenido && (
                        <small>{recurso.comentarioForo.contenido}</small>
                      )}
                    </div>

                    {urlRecurso && (
                      <a
                        className="secondary-button compact-button"
                        href={urlRecurso}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                  <label>Categorías</label>
                  <div className="forum-category-picker">
                    {cargandoCatalogos && (
                      <p className="forum-category-helper">
                        Cargando categorías...
                      </p>
                    )}

                    {!cargandoCatalogos &&
                      esSuper &&
                      !formulario.institucionId && (
                        <p className="forum-category-helper">
                          Selecciona primero una institución.
                        </p>
                      )}

                    {!cargandoCatalogos &&
                      (!esSuper || formulario.institucionId) &&
                      categoriasDisponibles.length === 0 && (
                        <p className="forum-category-helper">
                          No hay categorías activas para esta institución.
                        </p>
                      )}

                    {!cargandoCatalogos &&
                      categoriasDisponibles.map((categoria) => (
                        <label key={categoria.id}>
                          <input
                            type="checkbox"
                            checked={formulario.categoriaIds.includes(
                              String(categoria.id),
                            )}
                            onChange={(event) =>
                              alternarCategoriaForo(
                                categoria.id,
                                event.target.checked,
                              )
                            }
                          />
                          {categoria.nombre}
                        </label>
                      ))}
                  </div>
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
                  <button
                    className="forum-recommend-button inline"
                    type="button"
                    onClick={abrirRecomendacionesCrearForo}
                  >
                    ★ Ver recursos recomendados
                  </button>
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

      {contextoRecomendacion && (
        <div className="modal-overlay forum-recommend-overlay">
          <div className="modal-container forum-recommend-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">Recomendador académico</span>
                <h2>{contextoRecomendacion.titulo}</h2>
                <p>{contextoRecomendacion.descripcion}</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setContextoRecomendacion(null)}
              >
                ×
              </button>
            </div>

            <RecursosRecomendados
              tema={contextoRecomendacion.tema}
              categoriaId={contextoRecomendacion.categoriaId}
              categoriaIds={contextoRecomendacion.categoriaIds}
              limite={5}
              compacto
              etiquetaSeleccion="Usar en comentario"
              onSeleccionarRecurso={
                contextoRecomendacion.foroId
                  ? usarRecursoRecomendadoEnComentario
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}
