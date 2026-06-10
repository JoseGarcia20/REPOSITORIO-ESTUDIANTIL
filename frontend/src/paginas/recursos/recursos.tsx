import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  actualizarRecurso,
  construirUrlArchivoProtegido,
  crearRecurso,
  esSuperadministrador,
  inactivarRecurso,
  obtenerCategoriasAdmin,
  obtenerGradosEscolares,
  obtenerInstitucionesAdmin,
  obtenerRecursosAdmin,
  obtenerTiposRecursosAdmin,
  obtenerUsuarioAutenticado,
  obtenerUsuariosAdmin,
  PERMISOS,
  reactivarRecurso,
  subirArchivoRecurso,
  usuarioTienePermiso,
} from '../../api/adminApi';
import type {
  Categoria,
  GradoEscolar,
  InstitucionCatalogo,
  Recurso,
  TipoRecurso,
  UsuarioAdmin,
} from '../../api/adminApi';
import './recursos.css';

type FormularioRecurso = {
  titulo: string;
  palabrasClave: string;
  contenidoResumen: string;
  rutaRecurso: string;
  urlRecurso: string;
  fuente: string;
  autorNombre: string;
  nivelAcademico: string;
  gradoEscolarId: string;
  publicado: boolean;
  institucionId: string;
  categoriaId: string;
  tipoRecursoId: string;
  usuarioCreadorId: string;
};

const extensionesPermitidas = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'ppt',
  'pptx',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'mp4',
  'webm',
];

const limiteArchivoBytes = 20 * 1024 * 1024;

function mapearUsuarioSesion(
  usuarioSesion: ReturnType<typeof obtenerUsuarioAutenticado>,
) {
  if (!usuarioSesion) {
    return null;
  }

  return {
    id: usuarioSesion.id,
    nombres: usuarioSesion.nombres,
    apellidos: usuarioSesion.apellidos,
    correo: usuarioSesion.correo,
    tipoDocumento: '',
    documento: usuarioSesion.documento,
    fechaNacimiento: '',
    genero: '',
    activo: true,
    institucionId: usuarioSesion.institucion.id,
    rolId: usuarioSesion.rol.id,
    gradoEscolarId: usuarioSesion.gradoEscolar?.id,
    gradoEscolar: usuarioSesion.gradoEscolar,
  };
}

function numeroFormulario(valor: string) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : undefined;
}

function crearFormularioInicial(
  esSuper: boolean,
  institucionSesionId?: number,
  usuarioSesionId?: number,
): FormularioRecurso {
  return {
    titulo: '',
    palabrasClave: '',
    contenidoResumen: '',
    rutaRecurso: '',
    urlRecurso: '',
    fuente: '',
    autorNombre: '',
    nivelAcademico: '',
    gradoEscolarId: '',
    publicado: false,
    institucionId: esSuper ? '' : String(institucionSesionId || ''),
    categoriaId: '',
    tipoRecursoId: '',
    usuarioCreadorId: usuarioSesionId ? String(usuarioSesionId) : '',
  };
}

export function Recursos() {
  const usuarioSesion = obtenerUsuarioAutenticado();
  const esSuper = esSuperadministrador();
  const institucionSesionId = usuarioSesion?.institucion?.id;
  const puedeCrear = usuarioTienePermiso(PERMISOS.RECURSOS_CREAR);
  const puedeEditar = usuarioTienePermiso(PERMISOS.RECURSOS_EDITAR);
  const puedeCambiarEstado = usuarioTienePermiso(
    PERMISOS.RECURSOS_CAMBIAR_ESTADO,
  );
  const puedeVerCategorias = usuarioTienePermiso(PERMISOS.CATEGORIAS_VER);
  const puedeVerTipos = usuarioTienePermiso(PERMISOS.TIPOS_RECURSOS_VER);
  const puedeVerInstituciones = usuarioTienePermiso(PERMISOS.INSTITUCIONES_VER);
  const puedeVerUsuarios = usuarioTienePermiso(PERMISOS.USUARIOS_VER);
  const tieneAcciones = puedeEditar || puedeCambiarEstado;

  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tiposRecursos, setTiposRecursos] = useState<TipoRecurso[]>([]);
  const [gradosEscolares, setGradosEscolares] = useState<GradoEscolar[]>([]);
  const [instituciones, setInstituciones] = useState<InstitucionCatalogo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    publicado: '',
    categoriaId: '',
    tipoRecursoId: '',
    gradoEscolarId: '',
    institucionId: '',
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [recursoEditandoId, setRecursoEditandoId] = useState<number | null>(
    null,
  );
  const [formulario, setFormulario] = useState<FormularioRecurso>(() =>
    crearFormularioInicial(esSuper, institucionSesionId, usuarioSesion?.id),
  );

  const categoriasPorId = useMemo(
    () =>
      new Map(categorias.map((categoria) => [categoria.id, categoria.nombre])),
    [categorias],
  );

  const tiposPorId = useMemo(
    () => new Map(tiposRecursos.map((tipo) => [tipo.id, tipo.nombre])),
    [tiposRecursos],
  );

  const institucionesPorId = useMemo(
    () =>
      new Map(
        instituciones.map((institucion) => [
          institucion.id,
          institucion.nombre,
        ]),
      ),
    [instituciones],
  );

  const gradosPorId = useMemo(
    () => new Map(gradosEscolares.map((grado) => [grado.id, grado.nombre])),
    [gradosEscolares],
  );

  const categoriasDisponibles = useMemo(() => {
    const institucionId = Number(formulario.institucionId);

    if (!institucionId) {
      return categorias;
    }

    return categorias.filter(
      (categoria) => categoria.institucionId === institucionId,
    );
  }, [categorias, formulario.institucionId]);

  const usuariosDisponibles = useMemo(() => {
    const institucionId = Number(formulario.institucionId);

    if (!institucionId) {
      return usuarios;
    }

    return usuarios.filter(
      (usuario) => usuario.institucionId === institucionId,
    );
  }, [formulario.institucionId, usuarios]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarRecursos();
  }, [
    pagina,
    filtros.busqueda,
    filtros.estado,
    filtros.publicado,
    filtros.categoriaId,
    filtros.tipoRecursoId,
    filtros.gradoEscolarId,
    filtros.institucionId,
  ]);

  async function cargarCatalogos() {
    try {
      setCargandoCatalogos(true);
      const [
        categoriasData,
        tiposRecursosData,
        gradosData,
        institucionesData,
        usuariosData,
      ] = await Promise.all([
        puedeVerCategorias ? obtenerCategoriasAdmin() : Promise.resolve([]),
        puedeVerTipos ? obtenerTiposRecursosAdmin() : Promise.resolve([]),
        obtenerGradosEscolares(),
        puedeVerInstituciones
          ? obtenerInstitucionesAdmin()
          : Promise.resolve([]),
        puedeVerUsuarios
          ? obtenerUsuariosAdmin({
              limite: 100,
              institucionId: esSuper ? filtros.institucionId : undefined,
            })
          : Promise.resolve(null),
      ]);

      setCategorias(categoriasData);
      setTiposRecursos(tiposRecursosData);
      setGradosEscolares(gradosData);
      setInstituciones(institucionesData);
      const usuarioSesionActual = mapearUsuarioSesion(usuarioSesion);
      setUsuarios(
        usuariosData?.data?.length
          ? usuariosData.data
          : usuarioSesionActual
            ? [usuarioSesionActual]
            : [],
      );
    } catch {
      setError('No se pudieron cargar los catálogos de recursos');
    } finally {
      setCargandoCatalogos(false);
    }
  }

  async function cargarRecursos() {
    try {
      setCargando(true);
      setError('');

      const recursosData = await obtenerRecursosAdmin({
        pagina,
        limite: 10,
        busqueda: filtros.busqueda,
        estado: filtros.estado,
        publicado: filtros.publicado,
        categoriaId: filtros.categoriaId,
        tipoRecursoId: filtros.tipoRecursoId,
        gradoEscolarId: filtros.gradoEscolarId,
        institucionId: esSuper ? filtros.institucionId : undefined,
      });

      setRecursos(recursosData.data);
      setTotal(recursosData.total);
      setTotalPaginas(recursosData.totalPaginas);
    } catch {
      setError('No se pudieron cargar los recursos');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal() {
    setModoEdicion(false);
    setRecursoEditandoId(null);
    setFormulario(
      crearFormularioInicial(esSuper, institucionSesionId, usuarioSesion?.id),
    );
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (!guardando && !subiendoArchivo) {
      setModalAbierto(false);
    }
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
      estado: '',
      publicado: '',
      categoriaId: '',
      tipoRecursoId: '',
      gradoEscolarId: '',
      institucionId: '',
    });
    setPagina(1);
  }

  function editarRecurso(recurso: Recurso) {
    setModoEdicion(true);
    setRecursoEditandoId(recurso.id);
    setFormulario({
      titulo: recurso.titulo,
      palabrasClave: recurso.palabrasClave || '',
      contenidoResumen: recurso.contenidoResumen || '',
      rutaRecurso: recurso.rutaRecurso || '',
      urlRecurso: recurso.urlRecurso || '',
      fuente: recurso.fuente || '',
      autorNombre: recurso.autorNombre || '',
      nivelAcademico: recurso.nivelAcademico || '',
      gradoEscolarId: recurso.gradoEscolarId
        ? String(recurso.gradoEscolarId)
        : '',
      publicado: recurso.publicado,
      institucionId: String(recurso.institucionId),
      categoriaId: String(recurso.categoriaId),
      tipoRecursoId: String(recurso.tipoRecursoId),
      usuarioCreadorId: String(recurso.usuarioCreadorId),
    });
    setModalAbierto(true);
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
        categoriaId: '',
        usuarioCreadorId: '',
      }));
      return;
    }

    setFormulario((prev) => ({ ...prev, [name]: value }));
  }

  function manejarPublicado(event: ChangeEvent<HTMLInputElement>) {
    const { checked } = event.target;
    setFormulario((prev) => ({ ...prev, publicado: checked }));
  }

  async function manejarArchivo(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];

    if (!archivo) {
      return;
    }

    const extension = archivo.name.toLowerCase().split('.').pop() || '';

    if (!extensionesPermitidas.includes(extension)) {
      alert(
        'Solo se permiten PDF, Word, Excel, PowerPoint, imágenes y videos.',
      );
      return;
    }

    if (archivo.size > limiteArchivoBytes) {
      alert('El archivo no puede superar 20 MB.');
      return;
    }

    try {
      setSubiendoArchivo(true);
      const respuesta = await subirArchivoRecurso(archivo);
      setFormulario((prev) => ({
        ...prev,
        rutaRecurso: respuesta.ruta,
      }));
    } catch {
      alert('No se pudo subir el archivo.');
    } finally {
      setSubiendoArchivo(false);
    }
  }

  async function guardarRecurso(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setGuardando(true);

      const institucionId = esSuper
        ? Number(formulario.institucionId)
        : Number(institucionSesionId);

      const payload = {
        titulo: formulario.titulo,
        palabrasClave: formulario.palabrasClave || undefined,
        contenidoResumen: formulario.contenidoResumen || undefined,
        rutaRecurso: formulario.rutaRecurso || undefined,
        urlRecurso: formulario.urlRecurso || undefined,
        fuente: formulario.fuente || undefined,
        autorNombre: formulario.autorNombre || undefined,
        nivelAcademico:
          gradosPorId.get(Number(formulario.gradoEscolarId)) ||
          formulario.nivelAcademico ||
          undefined,
        gradoEscolarId: Number(formulario.gradoEscolarId),
        publicado: formulario.publicado,
        institucionId,
        categoriaId: numeroFormulario(formulario.categoriaId),
        tipoRecursoId: numeroFormulario(formulario.tipoRecursoId),
        usuarioCreadorId: numeroFormulario(formulario.usuarioCreadorId),
      };

      if (modoEdicion && recursoEditandoId) {
        await actualizarRecurso(recursoEditandoId, payload);
      } else {
        await crearRecurso(payload);
      }

      await cargarRecursos();
      setModalAbierto(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : modoEdicion
            ? 'No se pudo actualizar el recurso.'
            : 'No se pudo crear el recurso.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoRecurso(recurso: Recurso) {
    const confirmar = window.confirm(
      recurso.estado
        ? '¿Deseas inactivar este recurso?'
        : '¿Deseas reactivar este recurso?',
    );

    if (!confirmar) {
      return;
    }

    try {
      if (recurso.estado) {
        await inactivarRecurso(recurso.id);
      } else {
        await reactivarRecurso(recurso.id);
      }

      await cargarRecursos();
    } catch {
      alert('No se pudo actualizar el estado.');
    }
  }

  return (
    <section className="instituciones-page">
      <div className="instituciones-header">
        <div>
          <span className="section-label">Administración</span>
          <h1>Recursos</h1>
          <p>Gestiona materiales académicos internos y enlaces externos.</p>
        </div>

        {puedeCrear && (
          <button className="primary-button" onClick={abrirModal}>
            + Nuevo recurso
          </button>
        )}
      </div>

      <div className="instituciones-card">
        <div className="table-tools">
          <input
            name="busqueda"
            value={filtros.busqueda}
            onChange={manejarFiltro}
            placeholder="Buscar por título, palabra clave o autor"
          />

          <select name="estado" value={filtros.estado} onChange={manejarFiltro}>
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>

          <select
            name="publicado"
            value={filtros.publicado}
            onChange={manejarFiltro}
          >
            <option value="">Publicados y borradores</option>
            <option value="true">Publicados</option>
            <option value="false">Borradores</option>
          </select>

          {categorias.length > 0 && (
            <select
              name="categoriaId"
              value={filtros.categoriaId}
              onChange={manejarFiltro}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          )}

          {tiposRecursos.length > 0 && (
            <select
              name="tipoRecursoId"
              value={filtros.tipoRecursoId}
              onChange={manejarFiltro}
            >
              <option value="">Todos los tipos</option>
              {tiposRecursos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          )}

          {gradosEscolares.length > 0 && (
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

          {esSuper && instituciones.length > 0 && (
            <select
              name="institucionId"
              value={filtros.institucionId}
              onChange={manejarFiltro}
            >
              <option value="">Todas las instituciones</option>
              {instituciones.map((institucion) => (
                <option key={institucion.id} value={institucion.id}>
                  {institucion.nombre}
                </option>
              ))}
            </select>
          )}

          <button className="secondary-button" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>

        {(cargando || cargandoCatalogos) && (
          <p className="state-message">Cargando recursos...</p>
        )}
        {error && <p className="state-message error">{error}</p>}

        {!cargando && !cargandoCatalogos && !error && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Grado</th>
                  <th>Institución</th>
                  <th>Publicado</th>
                  <th>Estado</th>
                  {tieneAcciones && <th>Acciones</th>}
                </tr>
              </thead>

              <tbody>
                {recursos.map((recurso) => (
                  <tr key={recurso.id}>
                    <td data-label="Título">
                      <span className="resource-source">
                        <span className="institution-name">
                          {recurso.titulo}
                        </span>
                        <small>
                          {recurso.palabrasClave || 'Sin palabras clave'}
                        </small>
                      </span>
                    </td>
                    <td data-label="Categoría">
                      {recurso.categoria?.nombre ||
                        categoriasPorId.get(recurso.categoriaId) ||
                        `ID ${recurso.categoriaId}`}
                    </td>
                    <td data-label="Tipo">
                      {recurso.tipoRecurso?.nombre ||
                        tiposPorId.get(recurso.tipoRecursoId) ||
                        `ID ${recurso.tipoRecursoId}`}
                    </td>
                    <td data-label="Grado">
                      {recurso.gradoEscolar?.nombre ||
                        (recurso.gradoEscolarId
                          ? gradosPorId.get(recurso.gradoEscolarId) ||
                            `ID ${recurso.gradoEscolarId}`
                          : 'Sin grado')}
                    </td>
                    <td data-label="Institución">
                      {recurso.institucion?.nombre ||
                        institucionesPorId.get(recurso.institucionId) ||
                        `ID ${recurso.institucionId}`}
                    </td>
                    <td data-label="Publicado">
                      {recurso.publicado ? 'Sí' : 'No'}
                    </td>
                    <td data-label="Estado">
                      <span
                        className={`status-icon ${
                          recurso.estado ? 'active' : 'inactive'
                        }`}
                        title={recurso.estado ? 'Activo' : 'Inactivo'}
                      >
                        {recurso.estado ? '✓' : '×'}
                      </span>
                    </td>
                    {tieneAcciones && (
                      <td data-label="Acciones">
                        <div className="actions">
                          {puedeEditar && (
                            <button
                              title="Editar"
                              aria-label="Editar"
                              onClick={() => editarRecurso(recurso)}
                            >
                              ✎
                            </button>
                          )}

                          {puedeCambiarEstado && (
                            <button
                              className={recurso.estado ? 'danger' : 'success'}
                              title={recurso.estado ? 'Inactivar' : 'Reactivar'}
                              aria-label={
                                recurso.estado ? 'Inactivar' : 'Reactivar'
                              }
                              onClick={() => cambiarEstadoRecurso(recurso)}
                            >
                              {recurso.estado ? '⊘' : '↻'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {recursos.length === 0 && (
                  <tr>
                    <td colSpan={tieneAcciones ? 8 : 7} className="empty-table">
                      No hay recursos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="pagination-bar">
              <span>
                {total} recursos · Página {pagina} de {totalPaginas}
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
          </div>
        )}
      </div>

      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div>
                <span className="section-label">Registro</span>
                <h2>{modoEdicion ? 'Editar recurso' : 'Crear recurso'}</h2>
                <p>Registra el material y sus relaciones académicas.</p>
              </div>

              <button className="modal-close" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="institution-form" onSubmit={guardarRecurso}>
              <div className="form-grid">
                <div className="form-group">
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
                  <label>Usuario creador</label>
                  {puedeVerUsuarios ? (
                    <select
                      name="usuarioCreadorId"
                      value={formulario.usuarioCreadorId}
                      onChange={manejarCambio}
                      required
                    >
                      <option value="">Selecciona un usuario</option>
                      {usuariosDisponibles.map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nombres} {usuario.apellidos}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={`${usuarioSesion?.nombres || ''} ${
                        usuarioSesion?.apellidos || ''
                      }`.trim()}
                      readOnly
                    />
                  )}
                </div>

                <div className="form-group">
                  <label>Grado escolar</label>
                  <select
                    name="gradoEscolarId"
                    value={formulario.gradoEscolarId}
                    onChange={manejarCambio}
                    required
                  >
                    <option value="">Selecciona un grado</option>
                    {gradosEscolares.map((grado) => (
                      <option key={grado.id} value={grado.id}>
                        {grado.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Fuente</label>
                  <input
                    name="fuente"
                    value={formulario.fuente}
                    onChange={manejarCambio}
                  />
                </div>

                <div className="form-group">
                  <label>Autor</label>
                  <input
                    name="autorNombre"
                    value={formulario.autorNombre}
                    onChange={manejarCambio}
                  />
                </div>

                <div className="form-group">
                  <label>URL externa</label>
                  <input
                    type="url"
                    name="urlRecurso"
                    value={formulario.urlRecurso}
                    onChange={manejarCambio}
                  />
                </div>

                <div className="form-group">
                  <label>Archivo</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.mp4,.webm"
                    onChange={manejarArchivo}
                  />
                  {subiendoArchivo && (
                    <small className="file-state">Subiendo archivo...</small>
                  )}
                  {formulario.rutaRecurso && (
                    <a
                      className="file-link"
                      href={construirUrlArchivoProtegido(formulario.rutaRecurso)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver archivo cargado
                    </a>
                  )}
                </div>

                <div className="form-group">
                  <label>Publicación</label>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={formulario.publicado}
                      onChange={manejarPublicado}
                    />
                    Publicado
                  </label>
                </div>

                <div className="form-group form-group-full">
                  <label>Introducción</label>
                  <textarea
                    name="contenidoResumen"
                    value={formulario.contenidoResumen}
                    onChange={manejarCambio}
                  />
                  <small className="form-helper">
                    Este contexto se usa para clasificar el recurso y generar
                    palabras clave.
                  </small>
                </div>

                <div className="form-group">
                  <label>Categoría opcional</label>
                  <select
                    name="categoriaId"
                    value={formulario.categoriaId}
                    onChange={manejarCambio}
                  >
                    <option value="">Clasificar automáticamente</option>
                    {categoriasDisponibles.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tipo de recurso opcional</label>
                  <select
                    name="tipoRecursoId"
                    value={formulario.tipoRecursoId}
                    onChange={manejarCambio}
                  >
                    <option value="">Clasificar automáticamente</option>
                    {tiposRecursos.map((tipoRecurso) => (
                      <option key={tipoRecurso.id} value={tipoRecurso.id}>
                        {tipoRecurso.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group form-group-full">
                  <label>Palabras clave opcionales</label>
                  <input
                    name="palabrasClave"
                    value={formulario.palabrasClave}
                    onChange={manejarCambio}
                    placeholder="El sistema las genera si dejas este campo vacío"
                  />
                  <small className="form-helper">
                    El registro inicial guarda máximo 6. Si escribes algunas, el
                    sistema las conserva y completa el resto automáticamente.
                  </small>
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
                  disabled={guardando || subiendoArchivo}
                >
                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                      ? 'Guardar cambios'
                      : 'Guardar recurso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
