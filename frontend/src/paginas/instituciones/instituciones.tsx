import { useEffect, useState } from 'react';
import {
  crearInstitucion,
  obtenerTodasInstituciones,
  actualizarInstitucion,
  inactivarInstitucion,
  reactivarInstitucion,
  subirLogoInstitucion,
  construirUrlArchivoProtegido,
} from '../../api/api';
import { departamentosColombia } from '../../data/colombia';
import { PantallaCarga } from '../../componentes/carga/pantallaCarga';
import './instituciones.css';

type Institucion = {
  id: number;
  nombre: string;
  codigo: string;
  nit: string;
  correo: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  sitioWeb?: string;
  logo?: string;
  estado: boolean;
};

type FormularioInstitucion = {
  nombre: string;
  codigo: string;
  nit: string;
  correo: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  sitioWeb: string;
  logo: string;
};

const formularioInicial: FormularioInstitucion = {
  nombre: '',
  codigo: '',
  nit: '',
  correo: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  departamento: '',
  sitioWeb: '',
  logo: '',
};

export function Instituciones() {
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] =
    useState<FormularioInstitucion>(formularioInicial);
  const [ciudadesDisponibles, setCiudadesDisponibles] = useState<string[]>([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [institucionEditandoId, setInstitucionEditandoId] = useState<
    number | null
  >(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  useEffect(() => {
    cargarInstituciones();
  }, []);

  async function cargarInstituciones() {
    try {
      setCargando(true);
      const data = await obtenerTodasInstituciones();
      setInstituciones(data);
    } catch {
      setError('No se pudieron cargar las instituciones');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal() {
    setModoEdicion(false);
    setInstitucionEditandoId(null);
    setFormulario(formularioInicial);
    setCiudadesDisponibles([]);
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (!guardando) {
      setModalAbierto(false);
    }
  }

  function editarInstitucion(institucion: Institucion) {
    const departamentoSeleccionado = departamentosColombia.find(
      (item) => item.nombre === institucion.departamento,
    );

    setModoEdicion(true);
    setInstitucionEditandoId(institucion.id);

    setFormulario({
      nombre: institucion.nombre,
      codigo: institucion.codigo,
      nit: institucion.nit,
      correo: institucion.correo,
      telefono: institucion.telefono,
      direccion: institucion.direccion,
      ciudad: institucion.ciudad,
      departamento: institucion.departamento,
      sitioWeb: institucion.sitioWeb || '',
      logo: institucion.logo || '',
    });

    setCiudadesDisponibles(departamentoSeleccionado?.municipios || []);

    setModalAbierto(true);
  }

  function manejarCambio(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    if (name === 'departamento') {
      const departamentoSeleccionado = departamentosColombia.find(
        (item) => item.nombre === value,
      );

      setCiudadesDisponibles(departamentoSeleccionado?.municipios || []);

      setFormulario((prev) => ({
        ...prev,
        departamento: value,
        ciudad: '',
      }));

      return;
    }

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function manejarLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];

    if (!archivo) {
      return;
    }

    const extensionesPermitidas = ['image/png', 'image/jpeg', 'image/webp'];

    if (!extensionesPermitidas.includes(archivo.type)) {
      alert('Solo se permiten imágenes PNG, JPG, JPEG o WEBP.');
      return;
    }

    if (!archivo) {
      return;
    }

    try {
      setSubiendoLogo(true);

      const respuesta = await subirLogoInstitucion(archivo);

      setFormulario((prev) => ({
        ...prev,
        logo: respuesta.ruta,
      }));
    } catch {
      alert('No se pudo subir el logo.');
    } finally {
      setSubiendoLogo(false);
    }
  }

  async function guardarInstitucion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setGuardando(true);

      const payload = {
        ...formulario,
        sitioWeb: formulario.sitioWeb || undefined,
        logo: formulario.logo || undefined,
      };

      if (modoEdicion && institucionEditandoId) {
        await actualizarInstitucion(institucionEditandoId, payload);
      } else {
        await crearInstitucion(payload);
      }

      await cargarInstituciones();
      setModalAbierto(false);
    } catch {
      alert(
        modoEdicion
          ? 'No se pudo actualizar la institución.'
          : 'No se pudo crear la institución.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoInstitucion(institucion: Institucion) {
    const mensaje = institucion.estado
      ? '¿Deseas inactivar esta institución?'
      : '¿Deseas reactivar esta institución?';

    const confirmar = window.confirm(mensaje);

    if (!confirmar) {
      return;
    }

    try {
      if (institucion.estado) {
        await inactivarInstitucion(institucion.id);
      } else {
        await reactivarInstitucion(institucion.id);
      }

      await cargarInstituciones();
    } catch {
      alert('No se pudo actualizar el estado.');
    }
  }

  return (
    <section className="instituciones-page">
      <div className="instituciones-header">
        <div>
          <span className="section-label">Administración</span>
          <h1>Instituciones</h1>
          <p>Gestiona los colegios registrados en la plataforma.</p>
        </div>

        <button className="primary-button" onClick={abrirModal}>
          + Nueva institución
        </button>
      </div>

      <div className="instituciones-card">
        {cargando && (
          <PantallaCarga
            modo="panel"
            mensaje="Cargando instituciones"
            detalle="Estamos consultando las instituciones registradas."
          />
        )}
        {error && <p className="state-message error">{error}</p>}

        {!cargando && !error && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>NIT</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {instituciones.map((institucion) => (
                  <tr key={institucion.id}>
                    <td data-label="Nombre">
                      <span className="institution-name">
                        {institucion.nombre}
                      </span>
                    </td>
                    <td data-label="Código">{institucion.codigo}</td>
                    <td data-label="NIT">{institucion.nit}</td>
                    <td data-label="Correo">{institucion.correo}</td>
                    <td data-label="Teléfono">{institucion.telefono}</td>
                    <td data-label="Ubicación">
                      {institucion.ciudad}, {institucion.departamento}
                    </td>
                    <td data-label="Estado">
                      <span
                        className={`status-icon ${institucion.estado ? 'active' : 'inactive'}`}
                        title={institucion.estado ? 'Activa' : 'Inactiva'}
                      >
                        {institucion.estado ? '✓' : '×'}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      <div className="actions">
                        <button
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => editarInstitucion(institucion)}
                        >
                          ✎
                        </button>

                        <button
                          className={institucion.estado ? 'danger' : 'success'}
                          title={institucion.estado ? 'Inactivar' : 'Reactivar'}
                          aria-label={
                            institucion.estado ? 'Inactivar' : 'Reactivar'
                          }
                          onClick={() => cambiarEstadoInstitucion(institucion)}
                        >
                          {institucion.estado ? '⊘' : '↻'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {instituciones.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-table">
                      No hay instituciones registradas.
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
                <span className="section-label">Nuevo registro</span>

                <h2>
                  {modoEdicion ? 'Editar institución' : 'Crear institución'}
                </h2>

                <p>
                  {modoEdicion
                    ? 'Actualiza la información del colegio.'
                    : 'Registra la información básica del colegio.'}
                </p>
              </div>

              <button className="modal-close" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="institution-form" onSubmit={guardarInstitucion}>
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
                  <label>Código</label>
                  <input
                    name="codigo"
                    value={formulario.codigo}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>NIT</label>
                  <input
                    name="nit"
                    value={formulario.nit}
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
                  <label>Teléfono</label>
                  <input
                    name="telefono"
                    value={formulario.telefono}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    name="direccion"
                    value={formulario.direccion}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Departamento</label>

                  <select
                    name="departamento"
                    value={formulario.departamento}
                    onChange={manejarCambio}
                    required
                  >
                    <option value="">Selecciona un departamento</option>

                    {departamentosColombia.map((departamento) => (
                      <option
                        key={departamento.nombre}
                        value={departamento.nombre}
                      >
                        {departamento.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ciudad</label>

                  <select
                    name="ciudad"
                    value={formulario.ciudad}
                    onChange={manejarCambio}
                    required
                    disabled={!formulario.departamento}
                  >
                    <option value="">
                      {formulario.departamento
                        ? 'Selecciona una ciudad'
                        : 'Selecciona primero un departamento'}
                    </option>

                    {ciudadesDisponibles.map((ciudad) => (
                      <option key={ciudad} value={ciudad}>
                        {ciudad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Sitio web</label>
                  <input
                    name="sitioWeb"
                    value={formulario.sitioWeb}
                    onChange={manejarCambio}
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Logo Institución</label>

                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={manejarLogo}
                  />

                  {subiendoLogo && (
                    <small className="upload-state">Subiendo logo...</small>
                  )}

                  {formulario.logo && (
                    <div className="logo-preview">
                      <img
                        src={construirUrlArchivoProtegido(formulario.logo)}
                        alt="Logo institución"
                      />
                    </div>
                  )}
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
                      : 'Guardar institución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
