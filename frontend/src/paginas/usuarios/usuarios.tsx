import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  actualizarUsuarioAdmin,
  crearUsuarioAdmin,
  esSuperadministrador,
  inactivarUsuarioAdmin,
  obtenerInstitucionesAdmin,
  obtenerRolesAsignablesAdmin,
  obtenerUsuarioAutenticado,
  obtenerUsuariosAdmin,
  reactivarUsuarioAdmin,
} from '../../api/adminApi';
import type {
  InstitucionCatalogo,
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
};

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
  };
}

export function Usuarios() {
  const usuarioSesion = obtenerUsuarioAutenticado();
  const esSuper = esSuperadministrador();
  const institucionSesionId = usuarioSesion?.institucion?.id;

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [instituciones, setInstituciones] = useState<InstitucionCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
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

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    try {
      setCargando(true);
      setError('');

      const [usuariosData, rolesData, institucionesData] = await Promise.all([
        obtenerUsuariosAdmin(),
        obtenerRolesAsignablesAdmin(),
        obtenerInstitucionesAdmin(),
      ]);

      setUsuarios(usuariosData);
      setRoles(rolesData);
      setInstituciones(institucionesData);
    } catch {
      setError('No se pudieron cargar los usuarios');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal() {
    setModoEdicion(false);
    setUsuarioEditandoId(null);
    setFormulario(crearFormularioInicial(esSuper, institucionSesionId));
    setModalAbierto(true);
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
      };

      if (modoEdicion && usuarioEditandoId) {
        await actualizarUsuarioAdmin(usuarioEditandoId, payloadBase);
      } else {
        await crearUsuarioAdmin({
          ...payloadBase,
          contrasena: formulario.contrasena,
        });
      }

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
          <h1>Usuarios</h1>
          <p>Gestiona las cuentas vinculadas a las instituciones educativas.</p>
        </div>

        <button className="primary-button" onClick={abrirModal}>
          + Nuevo usuario
        </button>
      </div>

      <div className="instituciones-card">
        {cargando && <p className="state-message">Cargando usuarios...</p>}
        {error && <p className="state-message error">{error}</p>}

        {!cargando && !error && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Rol</th>
                  <th>Institución</th>
                  <th>Estado</th>
                  <th>Acciones</th>
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
                    <td data-label="Acciones">
                      <div className="actions">
                        <button
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => editarUsuario(usuario)}
                        >
                          ✎
                        </button>

                        <button
                          className={usuario.activo ? 'danger' : 'success'}
                          title={usuario.activo ? 'Inactivar' : 'Reactivar'}
                          aria-label={usuario.activo ? 'Inactivar' : 'Reactivar'}
                          onClick={() => cambiarEstadoUsuario(usuario)}
                        >
                          {usuario.activo ? '⊘' : '↻'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-table">
                      No hay usuarios registrados.
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
                  >
                    <option value="">Selecciona un rol</option>
                    {roles.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
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
