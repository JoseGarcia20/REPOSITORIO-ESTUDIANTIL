import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  actualizarRol,
  crearRol,
  inactivarRol,
  obtenerRolesAdmin,
  reactivarRol,
} from '../../api/adminApi';
import type { Rol } from '../../api/adminApi';
import './roles.css';

type FormularioRol = {
  nombre: string;
  descripcion: string;
};

const formularioInicial: FormularioRol = {
  nombre: '',
  descripcion: '',
};

export function RolesAdmin() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rolEditandoId, setRolEditandoId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<FormularioRol>(formularioInicial);

  useEffect(() => {
    cargarRoles();
  }, []);

  async function cargarRoles() {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerRolesAdmin();
      setRoles(data);
    } catch {
      setError('No se pudieron cargar los roles');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal() {
    setModoEdicion(false);
    setRolEditandoId(null);
    setFormulario(formularioInicial);
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (!guardando) {
      setModalAbierto(false);
    }
  }

  function editarRol(rol: Rol) {
    setModoEdicion(true);
    setRolEditandoId(rol.id);
    setFormulario({
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
    });
    setModalAbierto(true);
  }

  function manejarCambio(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  }

  async function guardarRol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setGuardando(true);

      const payload = {
        nombre: formulario.nombre,
        descripcion: formulario.descripcion || undefined,
      };

      if (modoEdicion && rolEditandoId) {
        await actualizarRol(rolEditandoId, payload);
      } else {
        await crearRol(payload);
      }

      await cargarRoles();
      setModalAbierto(false);
    } catch {
      alert(
        modoEdicion ? 'No se pudo actualizar el rol.' : 'No se pudo crear el rol.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoRol(rol: Rol) {
    const confirmar = window.confirm(
      rol.estado ? '¿Deseas inactivar este rol?' : '¿Deseas reactivar este rol?',
    );

    if (!confirmar) {
      return;
    }

    try {
      if (rol.estado) {
        await inactivarRol(rol.id);
      } else {
        await reactivarRol(rol.id);
      }

      await cargarRoles();
    } catch {
      alert('No se pudo actualizar el estado.');
    }
  }

  return (
    <section className="instituciones-page">
      <div className="instituciones-header">
        <div>
          <span className="section-label">Administración</span>
          <h1>Roles</h1>
          <p>Administra los perfiles de acceso disponibles en la plataforma.</p>
        </div>

        <button className="primary-button" onClick={abrirModal}>
          + Nuevo rol
        </button>
      </div>

      <div className="instituciones-card">
        {cargando && <p className="state-message">Cargando roles...</p>}
        {error && <p className="state-message error">{error}</p>}

        {!cargando && !error && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {roles.map((rol) => (
                  <tr key={rol.id}>
                    <td data-label="Nombre">
                      <span className="institution-name">{rol.nombre}</span>
                    </td>
                    <td data-label="Descripción">
                      {rol.descripcion || 'Sin descripción'}
                    </td>
                    <td data-label="Estado">
                      <span
                        className={`status-icon ${
                          rol.estado ? 'active' : 'inactive'
                        }`}
                        title={rol.estado ? 'Activo' : 'Inactivo'}
                      >
                        {rol.estado ? '✓' : '×'}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      <div className="actions">
                        <button
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => editarRol(rol)}
                        >
                          ✎
                        </button>

                        <button
                          className={rol.estado ? 'danger' : 'success'}
                          title={rol.estado ? 'Inactivar' : 'Reactivar'}
                          aria-label={rol.estado ? 'Inactivar' : 'Reactivar'}
                          onClick={() => cambiarEstadoRol(rol)}
                        >
                          {rol.estado ? '⊘' : '↻'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {roles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-table">
                      No hay roles registrados.
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
                <h2>{modoEdicion ? 'Editar rol' : 'Crear rol'}</h2>
                <p>Define el nombre y alcance descriptivo del perfil.</p>
              </div>

              <button className="modal-close" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="institution-form" onSubmit={guardarRol}>
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label>Nombre</label>
                  <input
                    name="nombre"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formulario.descripcion}
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
                  disabled={guardando}
                >
                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                      ? 'Guardar cambios'
                      : 'Guardar rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
