import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  API_URL,
  actualizarRecurso,
  crearRecurso,
  esSuperadministrador,
  inactivarRecurso,
  obtenerCategoriasAdmin,
  obtenerInstitucionesAdmin,
  obtenerRecursosAdmin,
  obtenerTiposRecursosAdmin,
  obtenerUsuarioAutenticado,
  obtenerUsuariosAdmin,
  reactivarRecurso,
  subirArchivoRecurso,
} from '../../api/adminApi';
import type {
  Categoria,
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
  'ppt',
  'pptx',
  'png',
  'jpg',
  'jpeg',
  'webp',
];

const limiteArchivoBytes = 20 * 1024 * 1024;

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

  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tiposRecursos, setTiposRecursos] = useState<TipoRecurso[]>([]);
  const [instituciones, setInstituciones] = useState<InstitucionCatalogo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
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
    () => new Map(categorias.map((categoria) => [categoria.id, categoria.nombre])),
    [categorias],
  );

  const tiposPorId = useMemo(
    () => new Map(tiposRecursos.map((tipo) => [tipo.id, tipo.nombre])),
    [tiposRecursos],
  );

  const institucionesPorId = useMemo(
    () =>
      new Map(
        instituciones.map((institucion) => [institucion.id, institucion.nombre]),
      ),
    [instituciones],
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

    return usuarios.filter((usuario) => usuario.institucionId === institucionId);
  }, [formulario.institucionId, usuarios]);

  useEffect(() => {
    cargarRecursos();
  }, []);

  async function cargarRecursos() {
    try {
      setCargando(true);
      setError('');

      const [
        recursosData,
        categoriasData,
        tiposRecursosData,
        institucionesData,
        usuariosData,
      ] = await Promise.all([
        obtenerRecursosAdmin(),
        obtenerCategoriasAdmin(),
        obtenerTiposRecursosAdmin(),
        obtenerInstitucionesAdmin(),
        obtenerUsuariosAdmin(),
      ]);

      setRecursos(recursosData);
      setCategorias(categoriasData);
      setTiposRecursos(tiposRecursosData);
      setInstituciones(institucionesData);
      setUsuarios(usuariosData);
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
      publicado: recurso.publicado,
      institucionId: String(recurso.institucionId),
      categoriaId: String(recurso.categoriaId),
      tipoRecursoId: String(recurso.tipoRecursoId),
      usuarioCreadorId: String(recurso.usuarioCreadorId),
    });
    setModalAbierto(true);
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
      alert('Solo se permiten PDF, Word, PowerPoint e imágenes.');
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
        nivelAcademico: formulario.nivelAcademico || undefined,
        publicado: formulario.publicado,
        institucionId,
        categoriaId: Number(formulario.categoriaId),
        tipoRecursoId: Number(formulario.tipoRecursoId),
        usuarioCreadorId: Number(formulario.usuarioCreadorId),
      };

      if (modoEdicion && recursoEditandoId) {
        await actualizarRecurso(recursoEditandoId, payload);
      } else {
        await crearRecurso(payload);
      }

      await cargarRecursos();
      setModalAbierto(false);
    } catch {
      alert(
        modoEdicion
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

        <button className="primary-button" onClick={abrirModal}>
          + Nuevo recurso
        </button>
      </div>

      <div className="instituciones-card">
        {cargando && <p className="state-message">Cargando recursos...</p>}
        {error && <p className="state-message error">{error}</p>}

        {!cargando && !error && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Institución</th>
                  <th>Publicado</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {recursos.map((recurso) => (
                  <tr key={recurso.id}>
                    <td data-label="Título">
                      <span className="resource-source">
                        <span className="institution-name">{recurso.titulo}</span>
                        <small>{recurso.palabrasClave || 'Sin palabras clave'}</small>
                      </span>
                    </td>
                    <td data-label="Categoría">
                      {categoriasPorId.get(recurso.categoriaId) ||
                        `ID ${recurso.categoriaId}`}
                    </td>
                    <td data-label="Tipo">
                      {tiposPorId.get(recurso.tipoRecursoId) ||
                        `ID ${recurso.tipoRecursoId}`}
                    </td>
                    <td data-label="Institución">
                      {institucionesPorId.get(recurso.institucionId) ||
                        `ID ${recurso.institucionId}`}
                    </td>
                    <td data-label="Publicado">{recurso.publicado ? 'Sí' : 'No'}</td>
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
                    <td data-label="Acciones">
                      <div className="actions">
                        <button
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => editarRecurso(recurso)}
                        >
                          ✎
                        </button>

                        <button
                          className={recurso.estado ? 'danger' : 'success'}
                          title={recurso.estado ? 'Inactivar' : 'Reactivar'}
                          aria-label={recurso.estado ? 'Inactivar' : 'Reactivar'}
                          onClick={() => cambiarEstadoRecurso(recurso)}
                        >
                          {recurso.estado ? '⊘' : '↻'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {recursos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-table">
                      No hay recursos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

                <div className="form-group">
                  <label>Palabras clave</label>
                  <input
                    name="palabrasClave"
                    value={formulario.palabrasClave}
                    onChange={manejarCambio}
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

                <div className="form-group">
                  <label>Tipo de recurso</label>
                  <select
                    name="tipoRecursoId"
                    value={formulario.tipoRecursoId}
                    onChange={manejarCambio}
                    required
                  >
                    <option value="">Selecciona un tipo</option>
                    {tiposRecursos.map((tipoRecurso) => (
                      <option key={tipoRecurso.id} value={tipoRecurso.id}>
                        {tipoRecurso.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Usuario creador</label>
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
                </div>

                <div className="form-group">
                  <label>Nivel académico</label>
                  <input
                    name="nivelAcademico"
                    value={formulario.nivelAcademico}
                    onChange={manejarCambio}
                    placeholder="Ej: Sexto, Séptimo, Media"
                  />
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
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                    onChange={manejarArchivo}
                  />
                  {subiendoArchivo && (
                    <small className="file-state">Subiendo archivo...</small>
                  )}
                  {formulario.rutaRecurso && (
                    <a
                      className="file-link"
                      href={`${API_URL}${formulario.rutaRecurso}`}
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
                  <label>Resumen</label>
                  <textarea
                    name="contenidoResumen"
                    value={formulario.contenidoResumen}
                    onChange={manejarCambio}
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
