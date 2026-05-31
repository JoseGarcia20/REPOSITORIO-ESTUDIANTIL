import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  actualizarCategoria,
  crearCategoria,
  esSuperadministrador,
  inactivarCategoria,
  obtenerCategoriasAdmin,
  obtenerInstitucionesAdmin,
  obtenerUsuarioAutenticado,
  reactivarCategoria,
} from '../../api/adminApi';
import type { Categoria, InstitucionCatalogo } from '../../api/adminApi';
import './categorias.css';

type FormularioCategoria = {
  nombre: string;
  descripcion: string;
  color: string;
  institucionId: string;
};

function crearFormularioInicial(
  esSuper: boolean,
  institucionSesionId?: number,
): FormularioCategoria {
  return {
    nombre: '',
    descripcion: '',
    color: '#111184',
    institucionId: esSuper ? '' : String(institucionSesionId || ''),
  };
}

export function Categorias() {
  const usuario = obtenerUsuarioAutenticado();
  const esSuper = esSuperadministrador();
  const institucionSesionId = usuario?.institucion?.id;

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [instituciones, setInstituciones] = useState<InstitucionCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [categoriaEditandoId, setCategoriaEditandoId] = useState<number | null>(
    null,
  );
  const [formulario, setFormulario] = useState<FormularioCategoria>(() =>
    crearFormularioInicial(esSuper, institucionSesionId),
  );

  const institucionesPorId = useMemo(
    () =>
      new Map(
        instituciones.map((institucion) => [institucion.id, institucion.nombre]),
      ),
    [instituciones],
  );

  useEffect(() => {
    cargarCategorias();
  }, []);

  async function cargarCategorias() {
    try {
      setCargando(true);
      setError('');

      const [categoriasData, institucionesData] = await Promise.all([
        obtenerCategoriasAdmin(),
        obtenerInstitucionesAdmin(),
      ]);

      setCategorias(categoriasData);
      setInstituciones(institucionesData);
    } catch {
      setError('No se pudieron cargar las categorías');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal() {
    setModoEdicion(false);
    setCategoriaEditandoId(null);
    setFormulario(crearFormularioInicial(esSuper, institucionSesionId));
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (!guardando) {
      setModalAbierto(false);
    }
  }

  function editarCategoria(categoria: Categoria) {
    setModoEdicion(true);
    setCategoriaEditandoId(categoria.id);
    setFormulario({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      color: categoria.color || '#111184',
      institucionId: String(categoria.institucionId),
    });
    setModalAbierto(true);
  }

  function manejarCambio(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  }

  async function guardarCategoria(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setGuardando(true);

      const payload = {
        nombre: formulario.nombre,
        descripcion: formulario.descripcion,
        color: formulario.color,
        ...(esSuper
          ? { institucionId: Number(formulario.institucionId) }
          : {}),
      };

      if (modoEdicion && categoriaEditandoId) {
        await actualizarCategoria(categoriaEditandoId, payload);
      } else {
        await crearCategoria(payload);
      }

      await cargarCategorias();
      setModalAbierto(false);
    } catch {
      alert(
        modoEdicion
          ? 'No se pudo actualizar la categoría.'
          : 'No se pudo crear la categoría.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoCategoria(categoria: Categoria) {
    const confirmar = window.confirm(
      categoria.estado
        ? '¿Deseas inactivar esta categoría?'
        : '¿Deseas reactivar esta categoría?',
    );

    if (!confirmar) {
      return;
    }

    try {
      if (categoria.estado) {
        await inactivarCategoria(categoria.id);
      } else {
        await reactivarCategoria(categoria.id);
      }

      await cargarCategorias();
    } catch {
      alert('No se pudo actualizar el estado.');
    }
  }

  return (
    <section className="instituciones-page">
      <div className="instituciones-header">
        <div>
          <span className="section-label">Administración</span>
          <h1>Categorías</h1>
          <p>Organiza los contenidos académicos por áreas o temas.</p>
        </div>

        <button className="primary-button" onClick={abrirModal}>
          + Nueva categoría
        </button>
      </div>

      <div className="instituciones-card">
        {cargando && <p className="state-message">Cargando categorías...</p>}
        {error && <p className="state-message error">{error}</p>}

        {!cargando && !error && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Color</th>
                  <th>Institución</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {categorias.map((categoria) => (
                  <tr key={categoria.id}>
                    <td data-label="Nombre">
                      <span className="institution-name">{categoria.nombre}</span>
                    </td>
                    <td data-label="Descripción">{categoria.descripcion}</td>
                    <td data-label="Color">
                      <span className="color-cell">
                        <span
                          className="color-swatch"
                          style={{ backgroundColor: categoria.color || '#e4e7f3' }}
                        />
                        {categoria.color || 'Sin color'}
                      </span>
                    </td>
                    <td data-label="Institución">
                      {institucionesPorId.get(categoria.institucionId) ||
                        `ID ${categoria.institucionId}`}
                    </td>
                    <td data-label="Estado">
                      <span
                        className={`status-icon ${
                          categoria.estado ? 'active' : 'inactive'
                        }`}
                        title={categoria.estado ? 'Activa' : 'Inactiva'}
                      >
                        {categoria.estado ? '✓' : '×'}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      <div className="actions">
                        <button
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => editarCategoria(categoria)}
                        >
                          ✎
                        </button>

                        <button
                          className={categoria.estado ? 'danger' : 'success'}
                          title={categoria.estado ? 'Inactivar' : 'Reactivar'}
                          aria-label={categoria.estado ? 'Inactivar' : 'Reactivar'}
                          onClick={() => cambiarEstadoCategoria(categoria)}
                        >
                          {categoria.estado ? '⊘' : '↻'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {categorias.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-table">
                      No hay categorías registradas.
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
                <h2>{modoEdicion ? 'Editar categoría' : 'Crear categoría'}</h2>
                <p>Define la categoría que agrupará recursos y foros.</p>
              </div>

              <button className="modal-close" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="institution-form" onSubmit={guardarCategoria}>
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
                  <label>Color</label>
                  <input
                    type="color"
                    name="color"
                    value={formulario.color}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                {esSuper && (
                  <div className="form-group form-group-full">
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

                <div className="form-group form-group-full">
                  <label>Descripción</label>
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
                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                      ? 'Guardar cambios'
                      : 'Guardar categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
