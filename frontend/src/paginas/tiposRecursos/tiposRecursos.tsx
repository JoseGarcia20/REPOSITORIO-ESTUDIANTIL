import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  actualizarTipoRecurso,
  crearTipoRecurso,
  inactivarTipoRecurso,
  obtenerTiposRecursosAdmin,
  reactivarTipoRecurso,
} from '../../api/adminApi';
import type { TipoRecurso } from '../../api/adminApi';
import './tiposRecursos.css';

type FormularioTipoRecurso = {
  nombre: string;
  descripcion: string;
  icono: string;
};

const formularioInicial: FormularioTipoRecurso = {
  nombre: '',
  descripcion: '',
  icono: '',
};

export function TiposRecursos() {
  const [tiposRecursos, setTiposRecursos] = useState<TipoRecurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [tipoEditandoId, setTipoEditandoId] = useState<number | null>(null);
  const [formulario, setFormulario] =
    useState<FormularioTipoRecurso>(formularioInicial);

  useEffect(() => {
    cargarTiposRecursos();
  }, []);

  async function cargarTiposRecursos() {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerTiposRecursosAdmin();
      setTiposRecursos(data);
    } catch {
      setError('No se pudieron cargar los tipos de recursos');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal() {
    setModoEdicion(false);
    setTipoEditandoId(null);
    setFormulario(formularioInicial);
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (!guardando) {
      setModalAbierto(false);
    }
  }

  function editarTipoRecurso(tipoRecurso: TipoRecurso) {
    setModoEdicion(true);
    setTipoEditandoId(tipoRecurso.id);
    setFormulario({
      nombre: tipoRecurso.nombre,
      descripcion: tipoRecurso.descripcion || '',
      icono: tipoRecurso.icono || '',
    });
    setModalAbierto(true);
  }

  function manejarCambio(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  }

  async function guardarTipoRecurso(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setGuardando(true);

      const payload = {
        nombre: formulario.nombre,
        descripcion: formulario.descripcion || undefined,
        icono: formulario.icono || undefined,
      };

      if (modoEdicion && tipoEditandoId) {
        await actualizarTipoRecurso(tipoEditandoId, payload);
      } else {
        await crearTipoRecurso(payload);
      }

      await cargarTiposRecursos();
      setModalAbierto(false);
    } catch {
      alert(
        modoEdicion
          ? 'No se pudo actualizar el tipo de recurso.'
          : 'No se pudo crear el tipo de recurso.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoTipoRecurso(tipoRecurso: TipoRecurso) {
    const confirmar = window.confirm(
      tipoRecurso.estado
        ? '¿Deseas inactivar este tipo de recurso?'
        : '¿Deseas reactivar este tipo de recurso?',
    );

    if (!confirmar) {
      return;
    }

    try {
      if (tipoRecurso.estado) {
        await inactivarTipoRecurso(tipoRecurso.id);
      } else {
        await reactivarTipoRecurso(tipoRecurso.id);
      }

      await cargarTiposRecursos();
    } catch {
      alert('No se pudo actualizar el estado.');
    }
  }

  return (
    <section className="instituciones-page">
      <div className="instituciones-header">
        <div>
          <span className="section-label">Administración</span>
          <h1>Tipos de recursos</h1>
          <p>Gestiona las clases de materiales educativos disponibles.</p>
        </div>

        <button className="primary-button" onClick={abrirModal}>
          + Nuevo tipo
        </button>
      </div>

      <div className="instituciones-card">
        {cargando && (
          <p className="state-message">Cargando tipos de recursos...</p>
        )}
        {error && <p className="state-message error">{error}</p>}

        {!cargando && !error && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Icono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {tiposRecursos.map((tipoRecurso) => (
                  <tr key={tipoRecurso.id}>
                    <td data-label="Nombre">
                      <span className="institution-name">
                        {tipoRecurso.nombre}
                      </span>
                    </td>
                    <td data-label="Descripción">
                      {tipoRecurso.descripcion || 'Sin descripción'}
                    </td>
                    <td data-label="Icono">
                      <span className="resource-icon">
                        {tipoRecurso.icono || 'Sin icono'}
                      </span>
                    </td>
                    <td data-label="Estado">
                      <span
                        className={`status-icon ${
                          tipoRecurso.estado ? 'active' : 'inactive'
                        }`}
                        title={tipoRecurso.estado ? 'Activo' : 'Inactivo'}
                      >
                        {tipoRecurso.estado ? '✓' : '×'}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      <div className="actions">
                        <button
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => editarTipoRecurso(tipoRecurso)}
                        >
                          ✎
                        </button>

                        <button
                          className={tipoRecurso.estado ? 'danger' : 'success'}
                          title={tipoRecurso.estado ? 'Inactivar' : 'Reactivar'}
                          aria-label={
                            tipoRecurso.estado ? 'Inactivar' : 'Reactivar'
                          }
                          onClick={() => cambiarEstadoTipoRecurso(tipoRecurso)}
                        >
                          {tipoRecurso.estado ? '⊘' : '↻'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {tiposRecursos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-table">
                      No hay tipos de recursos registrados.
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
                <h2>
                  {modoEdicion ? 'Editar tipo de recurso' : 'Crear tipo de recurso'}
                </h2>
                <p>Define una clasificación técnica para los recursos.</p>
              </div>

              <button className="modal-close" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="institution-form" onSubmit={guardarTipoRecurso}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    name="nombre"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Icono</label>
                  <input
                    name="icono"
                    value={formulario.icono}
                    onChange={manejarCambio}
                    placeholder="Ej: pdf, video, enlace"
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
                      : 'Guardar tipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
