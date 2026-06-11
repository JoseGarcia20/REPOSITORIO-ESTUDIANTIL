import { useEffect, useState } from 'react';
import {
  crudCreate,
  crudFetch,
  crudToggle,
  crudUpdate,
} from '../../api/adminApi';
import { PantallaCarga } from '../../componentes/carga/pantallaCarga';
import '../instituciones/instituciones.css';

type Field = { name: string; label: string; type?: string };

export function CrudAdmin({
  titulo,
  endpoint,
  campos,
}: {
  titulo: string;
  endpoint: string;
  campos: Field[];
}) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const inicial = campos.reduce(
    (acc, c) => ({ ...acc, [c.name]: '' }),
    {} as any,
  );
  const [form, setForm] = useState<any>(inicial);

  async function cargar() {
    try {
      setCargando(true);
      setItems(await crudFetch(`${endpoint}/todos`));
    } catch {
      setError('No se pudieron cargar los datos');
    } finally {
      setCargando(false);
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  async function guardar(e: any) {
    e.preventDefault();
    const payload = { ...form };
    Object.keys(payload).forEach((k) => payload[k] === '' && delete payload[k]);
    if (payload.estado === undefined) payload.estado = true;
    try {
      if (modoEdicion && idEditando)
        await crudUpdate(endpoint, idEditando, payload);
      else await crudCreate(endpoint, payload);
      setModalAbierto(false);
      setForm(inicial);
      await cargar();
    } catch {
      alert('No se pudo guardar');
    }
  }

  return (
    <section className="instituciones-page">
      <div className="instituciones-header">
        <div>
          <span className="section-label">Administración</span>
          <h1>{titulo}</h1>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            setModoEdicion(false);
            setForm(inicial);
            setModalAbierto(true);
          }}
        >
          + Nuevo
        </button>
      </div>
      <div className="instituciones-card">
        {cargando && (
          <PantallaCarga
            modo="panel"
            mensaje="Cargando información"
            detalle="Estamos preparando los datos del módulo."
          />
        )}
        {error && <p className="state-message error">{error}</p>}
        {!cargando && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  {campos.map((c) => (
                    <th key={c.name}>{c.label}</th>
                  ))}
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    {campos.map((c) => (
                      <td key={c.name}>{String(it[c.name] ?? '')}</td>
                    ))}
                    <td>
                      <span
                        className={`status-icon ${it.estado ? 'active' : 'inactive'}`}
                      >
                        {it.estado ? '✓' : '×'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          onClick={() => {
                            setModoEdicion(true);
                            setIdEditando(it.id);
                            setForm(it);
                            setModalAbierto(true);
                          }}
                        >
                          ✎
                        </button>
                        <button
                          className={it.estado ? 'danger' : 'success'}
                          onClick={async () => {
                            await crudToggle(endpoint, it.id, !it.estado);
                            await cargar();
                          }}
                        >
                          {it.estado ? '⊘' : '↻'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>
                {modoEdicion ? 'Editar' : 'Crear'} {titulo}
              </h2>
            </div>
            <form className="institution-form" onSubmit={guardar}>
              {campos.map((c) => (
                <label key={c.name}>
                  {c.label}
                  <input
                    type={c.type || 'text'}
                    value={form[c.name] ?? ''}
                    onChange={(e) =>
                      setForm((p: any) => ({
                        ...p,
                        [c.name]:
                          c.type === 'number'
                            ? Number(e.target.value)
                            : e.target.value,
                      }))
                    }
                  />
                </label>
              ))}
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModalAbierto(false)}
                >
                  Cancelar
                </button>
                <button className="primary-button" type="submit">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
