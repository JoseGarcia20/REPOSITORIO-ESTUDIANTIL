import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  actualizarUsuarioAdmin,
  crearUsuarioAdmin,
  esSuperadministrador,
  inactivarUsuarioAdmin,
  obtenerGradosEscolares,
  obtenerInstitucionesAdmin,
  obtenerRolesAsignablesAdmin,
  obtenerUsuarioAutenticado,
  obtenerUsuariosAdmin,
  PERMISOS,
  reactivarUsuarioAdmin,
  usuarioTienePermiso,
} from '../../api/adminApi';
import type {
  InstitucionCatalogo,
  GradoEscolar,
  Rol,
  UsuarioAdmin,
} from '../../api/adminApi';
import './usuarios.css';

type FormularioUsuario = {
  nombres: string;
  apellidos: string;
  correo: string;
  tipoDocumento: string;
  documento: string;
  fechaNacimiento: string;
  genero: string;
  contrasena: string;
  institucionId: string;
  rolId: string;
  gradoEscolarId: string;
};

type SubmoduloUsuarios = 'estudiantes' | 'docentes' | 'administrativos';

type ConfiguracionSubmoduloUsuarios = {
  id: SubmoduloUsuarios;
  titulo: string;
  descripcion: string;
};

const SUBMODULO_USUARIOS_POR_DEFECTO: SubmoduloUsuarios = 'estudiantes';

const SUBMODULOS_USUARIOS: ConfiguracionSubmoduloUsuarios[] = [
  {
    id: 'estudiantes',
    titulo: 'Estudiantes',
    descripcion: 'Gestión de cuentas estudiantiles.',
  },
  {
    id: 'docentes',
    titulo: 'Docentes',
    descripcion: 'Gestión de cuentas docentes.',
  },
  {
    id: 'administrativos',
    titulo: 'Usuarios administrativos',
    descripcion: 'Administradores, superadministradores y apoyo administrativo.',
  },
];

function esSubmoduloUsuarios(valor?: string): valor is SubmoduloUsuarios {
  return (
    valor === 'estudiantes' ||
    valor === 'docentes' ||
    valor === 'administrativos'
  );
}

function normalizarTextoRol(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function obtenerSubmoduloPorRol(nombreRol: string): SubmoduloUsuarios | null {
  const rol = normalizarTextoRol(nombreRol);

  if (rol.includes('estudiante')) {
    return 'estudiantes';
  }

  if (rol.includes('docente')) {
    return 'docentes';
  }

  if (rol.includes('administrador') || rol.includes('administrativo')) {
    return 'administrativos';
  }

  return null;
}

function normalizarFecha(valor?: string): string {
  return valor ? valor.slice(0, 10) : '';
}

function crearFormularioInicial(
  esSuper: boolean,
  institucionSesionId?: number,
): FormularioUsuario {
  return {
    nombres: '',
    apellidos: '',
    correo: '',
    tipoDocumento: '',
    documento: '',
    fechaNacimiento: '',
    genero: '',
    contrasena: '',
    institucionId: esSuper ? '' : String(institucionSesionId || ''),
    rolId: '',
    gradoEscolarId: '',
  };
}

export function Usuarios() {
  const navigate = useNavigate();
  const { submodulo } = useParams<{ submodulo?: string }>();
  const usuarioSesion = obtenerUsuarioAutenticado();
  const esSuper = esSuperadministrador();
  const institucionSesionId = usuarioSesion?.institucion?.id;
  const puedeCrear = usuarioTienePermiso(PERMISOS.USUARIOS_CREAR);
  const puedeEditar = usuarioTienePermiso(PERMISOS.USUARIOS_EDITAR);
  const puedeCambiarEstado = usuarioTienePermiso(
    PERMISOS.USUARIOS_CAMBIAR_ESTADO,
  );
  const tieneAcciones = puedeEditar || puedeCambiarEstado;
  const submoduloActivo = esSubmoduloUsuarios(submodulo)
    ? submodulo
    : SUBMODULO_USUARIOS_POR_DEFECTO;
  const configuracionSubmodulo =
    SUBMODULOS_USUARIOS.find((item) => item.id === submoduloActivo) ||
    SUBMODULOS_USUARIOS[0];

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [gradosEscolares, setGradosEscolares] = useState<GradoEscolar[]>([]);
  const [instituciones, setInstituciones] = useState<InstitucionCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    gradoEscolarId: '',
    institucionId: '',
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<FormularioUsuario>(() =>
    crearFormularioInicial(esSuper, institucionSesionId),
  );

  const rolesPorId = useMemo(
    () => new Map(roles.map((rol) => [rol.id, rol.nombre])),
    [roles],
  );

  const institucionesPorId = useMemo(
    () =>
      new Map(
        instituciones.map((institucion) => [institucion.id, institucion.nombre]),
      ),
    [instituciones],
  );

  const gradosPorId = useMemo(
    () =>
      new Map(gradosEscolares.map((grado) => [grado.id, grado.nombre])),
    [gradosEscolares],
  );

  const rolesAgrupados = useMemo<
    Record<SubmoduloUsuarios, Rol[]>
  >(() => {
    const agrupados: Record<SubmoduloUsuarios, Rol[]> = {
      estudiantes: [],
      docentes: [],
      administrativos: [],
    };

    roles.forEach((rol) => {
      const submoduloRol = obtenerSubmoduloPorRol(rol.nombre);
      if (submoduloRol) {
        agrupados[submoduloRol].push(rol);
      }
    });

    return agrupados;
  }, [roles]);

  const rolesSubmodulo = rolesAgrupados[submoduloActivo];
  const rolIdsSubmodulo = useMemo(
    () => rolesSubmodulo.map((rol) => rol.id).join(','),
    [rolesSubmodulo],
  );

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (!esSubmoduloUsuarios(submodulo)) {
      navigate(`/admin/usuarios/${SUBMODULO_USUARIOS_POR_DEFECTO}`, {
        replace: true,
      });
    }
  }, [navigate, submodulo]);

  useEffect(() => {
    setPagina(1);
  }, [submoduloActivo]);

  useEffect(() => {
    cargarUsuarios();
  }, [
    pagina,
    filtros.busqueda,
    filtros.estado,
    filtros.gradoEscolarId,
    filtros.institucionId,
    rolIdsSubmodulo,
  ]);

  async function cargarCatalogos() {
    try {
      setCargandoCatalogos(true);
      const [rolesData, institucionesData, gradosData] = await Promise.all([
        obtenerRolesAsignablesAdmin(),
        obtenerInstitucionesAdmin(),
        obtenerGradosEscolares(),
      ]);

      setRoles(rolesData);
      setInstituciones(institucionesData);
      setGradosEscolares(gradosData);
    } catch {
      setError('No se pudieron cargar los catálogos de usuarios');
    } finally {
      setCargandoCatalogos(false);
    }
  }

  async function cargarUsuarios() {
    try {
      setCargando(true);
      setError('');

      if (!rolIdsSubmodulo) {
        setUsuarios([]);
        setTotal(0);
        setTotalPaginas(1);
        return;
      }

      const usuariosData = await obtenerUsuariosAdmin({
        pagina,
        limite: 10,
        busqueda: filtros.busqueda,
        estado: filtros.estado,
        rolIds: rolIdsSubmodulo,
        gradoEscolarId: filtros.gradoEscolarId,
        institucionId: esSuper ? filtros.institucionId : undefined,
      });

      setUsuarios(usuariosData.data);
      setTotal(usuariosData.total);
      setTotalPaginas(usuariosData.totalPaginas);
    } catch {
      setError('No se pudieron cargar los usuarios');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal() {
    setModoEdicion(false);
    setUsuarioEditandoId(null);
    const rolPredeterminado = rolesSubmodulo[0];
    setFormulario({
      ...crearFormularioInicial(esSuper, institucionSesionId),
      rolId: rolPredeterminado ? String(rolPredeterminado.id) : '',
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
      estado: '',
      gradoEscolarId: '',
      institucionId: '',
    });
    setPagina(1);
  }

  function cerrarModal() {
    if (!guardando) {
      setModalAbierto(false);
    }
  }

  function editarUsuario(usuario: UsuarioAdmin) {
    setModoEdicion(true);
    setUsuarioEditandoId(usuario.id);
    setFormulario({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      tipoDocumento: usuario.tipoDocumento,
      documento: usuario.documento,
      fechaNacimiento: normalizarFecha(usuario.fechaNacimiento),
      genero: usuario.genero,
      contrasena: '',
      institucionId: String(usuario.institucionId),
      rolId: String(usuario.rolId),
      gradoEscolarId: usuario.gradoEscolarId ? String(usuario.gradoEscolarId) : '',
    });
    setModalAbierto(true);
  }

  function manejarCambio(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  }

  async function guardarUsuario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setGuardando(true);

      const institucionId = esSuper
        ? Number(formulario.institucionId)
        : Number(institucionSesionId);

      const payloadBase = {
        nombres: formulario.nombres,
        apellidos: formulario.apellidos,
        correo: formulario.correo,
        tipoDocumento: formulario.tipoDocumento,
        documento: formulario.documento,
        fechaNacimiento: formulario.fechaNacimiento,
        genero: formulario.genero,
        institucionId,
        rolId: Number(formulario.rolId),
        gradoEscolarId: formulario.gradoEscolarId
          ? Number(formulario.gradoEscolarId)
          : undefined,
      };

      if (modoEdicion && usuarioEditandoId) {
        await actualizarUsuarioAdmin(usuarioEditandoId, payloadBase);
      } else {
        await crearUsuarioAdmin({
          ...payloadBase,
          contrasena: formulario.contrasena,
        });
      }

      setPagina(1);
      await cargarUsuarios();
      setModalAbierto(false);
    } catch {
      alert(
        modoEdicion
          ? 'No se pudo actualizar el usuario.'
          : 'No se pudo crear el usuario.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoUsuario(usuario: UsuarioAdmin) {
    const confirmar = window.confirm(
      usuario.activo
        ? '¿Deseas inactivar este usuario?'
        : '¿Deseas reactivar este usuario?',
    );

    if (!confirmar) {
      return;
    }

    try {
      if (usuario.activo) {
        await inactivarUsuarioAdmin(usuario.id);
      } else {
        await reactivarUsuarioAdmin(usuario.id);
      }

      await cargarUsuarios();
    } catch {
      alert('No se pudo actualizar el estado.');
    }
  }

  return (
    <section className="instituciones-page">
      <div className="instituciones-header">
        <div>
          <span className="section-label">Administración</span>
          <h1>Usuarios · {configuracionSubmodulo.titulo}</h1>
          <p>{configuracionSubmodulo.descripcion}</p>
        </div>

        {puedeCrear && (
          <button className="primary-button" onClick={abrirModal}>
            + Nuevo usuario
          </button>
        )}
      </div>

      <div className="usuarios-submodulos">
        {SUBMODULOS_USUARIOS.map((item) => (
          <NavLink
            key={item.id}
            to={`/admin/usuarios/${item.id}`}
            className={({ isActive }) =>
              `usuarios-submodulo-link ${isActive ? 'active' : ''}`
            }
          >
            <strong>{item.titulo}</strong>
            <small>{item.descripcion}</small>
          </NavLink>
        ))}
      </div>

      <div className="instituciones-card">
        <div className="table-tools">
          <input
            name="busqueda"
            value={filtros.busqueda}
            onChange={manejarFiltro}
            placeholder="Buscar por nombre, correo o documento"
          />

          <select name="estado" value={filtros.estado} onChange={manejarFiltro}>
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>

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

          {esSuper && (
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
          <p className="state-message">Cargando usuarios...</p>
        )}
        {error && <p className="state-message error">{error}</p>}

        {!cargando && !cargandoCatalogos && !error && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Rol</th>
                  <th>Grado</th>
                  <th>Institución</th>
                  <th>Estado</th>
                  {tieneAcciones && <th>Acciones</th>}
                </tr>
              </thead>

              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td data-label="Nombre">
                      <span className="user-name-cell">
                        <span className="institution-name">
                          {usuario.nombres} {usuario.apellidos}
                        </span>
                        <small>{usuario.correo}</small>
                      </span>
                    </td>
                    <td data-label="Documento">
                      {usuario.tipoDocumento} {usuario.documento}
                    </td>
                    <td data-label="Rol">
                      {rolesPorId.get(usuario.rolId) || `ID ${usuario.rolId}`}
                    </td>
                    <td data-label="Grado">
                      {usuario.gradoEscolar?.nombre ||
                        (usuario.gradoEscolarId
                          ? gradosPorId.get(usuario.gradoEscolarId) ||
                            `ID ${usuario.gradoEscolarId}`
                          : 'Sin grado')}
                    </td>
                    <td data-label="Institución">
                      {institucionesPorId.get(usuario.institucionId) ||
                        `ID ${usuario.institucionId}`}
                    </td>
                    <td data-label="Estado">
                      <span
                        className={`status-icon ${
                          usuario.activo ? 'active' : 'inactive'
                        }`}
                        title={usuario.activo ? 'Activo' : 'Inactivo'}
                      >
                        {usuario.activo ? '✓' : '×'}
                      </span>
                    </td>
                    {tieneAcciones && (
                      <td data-label="Acciones">
                        <div className="actions">
                          {puedeEditar && (
                            <button
                              title="Editar"
                              aria-label="Editar"
                              onClick={() => editarUsuario(usuario)}
                            >
                              ✎
                            </button>
                          )}

                          {puedeCambiarEstado && (
                            <button
                              className={usuario.activo ? 'danger' : 'success'}
                              title={usuario.activo ? 'Inactivar' : 'Reactivar'}
                              aria-label={
                                usuario.activo ? 'Inactivar' : 'Reactivar'
                              }
                              onClick={() => cambiarEstadoUsuario(usuario)}
                            >
                              {usuario.activo ? '⊘' : '↻'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {usuarios.length === 0 && (
                  <tr>
                    <td
                      colSpan={tieneAcciones ? 7 : 6}
                      className="empty-table"
                    >
                      No hay {configuracionSubmodulo.titulo.toLowerCase()} registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="pagination-bar">
              <span>
                {total} usuarios · Página {pagina} de {totalPaginas}
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
                <h2>{modoEdicion ? 'Editar usuario' : 'Crear usuario'}</h2>
                <p>Registra la información de acceso y perfil académico.</p>
              </div>

              <button className="modal-close" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="institution-form" onSubmit={guardarUsuario}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombres</label>
                  <input
                    name="nombres"
                    value={formulario.nombres}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Apellidos</label>
                  <input
                    name="apellidos"
                    value={formulario.apellidos}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Correo</label>
                  <input
                    type="email"
                    name="correo"
                    value={formulario.correo}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de documento</label>
                  <select
                    name="tipoDocumento"
                    value={formulario.tipoDocumento}
                    onChange={manejarCambio}
                    required
                  >
                    <option value="">Selecciona un tipo</option>
                    <option value="CC">Cédula de ciudadanía</option>
                    <option value="TI">Tarjeta de identidad</option>
                    <option value="CE">Cédula de extranjería</option>
                    <option value="PEP">PEP</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Documento</label>
                  <input
                    name="documento"
                    value={formulario.documento}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de nacimiento</label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formulario.fechaNacimiento}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Género</label>
                  <select
                    name="genero"
                    value={formulario.genero}
                    onChange={manejarCambio}
                    required
                  >
                    <option value="">Selecciona un género</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                    <option value="No especifica">Prefiere no decirlo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Rol</label>
                  <select
                    name="rolId"
                    value={formulario.rolId}
                    onChange={manejarCambio}
                    required
                    disabled={rolesSubmodulo.length === 0}
                  >
                    <option value="">
                      {rolesSubmodulo.length === 0
                        ? 'No hay roles disponibles'
                        : 'Selecciona un rol'}
                    </option>
                    {rolesSubmodulo.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Grado escolar</label>
                  <select
                    name="gradoEscolarId"
                    value={formulario.gradoEscolarId}
                    onChange={manejarCambio}
                  >
                    <option value="">Sin grado asignado</option>
                    {gradosEscolares.map((grado) => (
                      <option key={grado.id} value={grado.id}>
                        {grado.nombre}
                      </option>
                    ))}
                  </select>
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

                {!modoEdicion && (
                  <div className="form-group">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      name="contrasena"
                      value={formulario.contrasena}
                      onChange={manejarCambio}
                      minLength={6}
                      required
                    />
                  </div>
                )}

                {modoEdicion && (
                  <div className="form-group form-group-full">
                    <span className="readonly-note">
                      La contraseña no se edita desde este formulario.
                    </span>
                  </div>
                )}
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
                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                      ? 'Guardar cambios'
                      : 'Guardar usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
