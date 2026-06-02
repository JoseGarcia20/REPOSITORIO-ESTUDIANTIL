import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  crearTipoAprendizajeAdaptativo,
  inactivarTipoAprendizajeAdaptativo,
  obtenerCatalogosAprendizajeAdaptativo,
} from '../../api/adminApi';
import type { CatalogosAprendizajeAdaptativo } from '../../api/adminApi';
import '../aprendizajeAdaptativo/aprendizajeAdaptativo.css';

type FormularioTipo = {
  nombre: string;
  descripcion: string;
  estrategias: string;
};

const formularioInicial: FormularioTipo = {
  nombre: '',
  descripcion: '',
  estrategias: '',
};

export function RutasAprendizajeAdmin() {
  const [catalogos, setCatalogos] =
    useState<CatalogosAprendizajeAdaptativo | null>(null);
  const [formulario, setFormulario] =
    useState<FormularioTipo>(formularioInicial);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const tiposFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    const tipos = catalogos?.tiposAprendizaje || [];

    if (!termino) {
      return tipos;
    }

    return tipos.filter((tipo) =>
      [
        tipo.nombre,
        tipo.descripcion,
        tipo.estrategias.map((estrategia) => estrategia.nombre).join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(termino),
    );
  }, [busqueda, catalogos]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  async function cargarCatalogos() {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerCatalogosAprendizajeAdaptativo();
      setCatalogos(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los tipos de aprendizaje.',
      );
    } finally {
      setCargando(false);
    }
  }

  function actualizarFormulario(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  }

  async function guardarTipo(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMensaje('');

    if (!formulario.nombre.trim()) {
      setError('Escribe el nombre del tipo de aprendizaje.');
      return;
    }

    try {
      setProcesando('guardar');
      await crearTipoAprendizajeAdaptativo({
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim() || undefined,
        estrategias: formulario.estrategias
          .split(',')
          .map((estrategia) => estrategia.trim())
          .filter(Boolean),
      });
      setFormulario(formularioInicial);
      setMensaje('Tipo de aprendizaje guardado correctamente.');
      await cargarCatalogos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el tipo de aprendizaje.',
      );
    } finally {
      setProcesando('');
    }
  }

  async function inactivarTipo(id: number) {
    const confirmar = window.confirm(
      'Este tipo dejará de estar disponible para nuevas rutas de aprendizaje. ¿Deseas continuar?',
    );

    if (!confirmar) {
      return;
    }

    try {
      setProcesando(`tipo-${id}`);
      await inactivarTipoAprendizajeAdaptativo(id);
      setMensaje('Tipo de aprendizaje inactivado.');
      await cargarCatalogos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo inactivar el tipo de aprendizaje.',
      );
    } finally {
      setProcesando('');
    }
  }

  return (
    <section className="adaptativo-page">
      <header className="adaptativo-header">
        <div>
          <span className="section-label">Administración</span>
          <h1>Rutas de aprendizaje</h1>
          <p>
            Administra los perfiles y estrategias que usa la IA para construir
            rutas adaptativas en la plataforma.
          </p>
        </div>
      </header>

      {(error || mensaje) && (
        <div className={`adaptativo-alert ${error ? 'error' : 'success'}`}>
          {error || mensaje}
        </div>
      )}

      <section className="adaptativo-panel">
        <div className="adaptativo-section-title">
          <h2>Tipos de aprendizaje</h2>
          <p>Catálogo global del software</p>
        </div>

        <div className="adaptativo-catalog-grid">
          <form className="adaptativo-type-form" onSubmit={guardarTipo}>
            <label className="adaptativo-field">
              <span>Nombre</span>
              <input
                name="nombre"
                value={formulario.nombre}
                onChange={actualizarFormulario}
                maxLength={80}
              />
            </label>
            <label className="adaptativo-field">
              <span>Descripción</span>
              <textarea
                name="descripcion"
                value={formulario.descripcion}
                onChange={actualizarFormulario}
                rows={3}
                maxLength={300}
              />
            </label>
            <label className="adaptativo-field">
              <span>Estrategias</span>
              <textarea
                name="estrategias"
                value={formulario.estrategias}
                onChange={actualizarFormulario}
                rows={3}
                placeholder="Mapas mentales, videos interactivos, talleres"
              />
            </label>
            <button
              className="primary-button"
              type="submit"
              disabled={procesando === 'guardar'}
            >
              Guardar tipo
            </button>
          </form>

          <div className="adaptativo-list-tools">
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar perfil o estrategia"
            />
            {cargando && <p className="state-message">Cargando tipos...</p>}
            {!cargando && (
              <div className="adaptativo-type-list">
                {tiposFiltrados.map((tipo) => (
                  <article key={tipo.id}>
                    <div>
                      <strong>{tipo.nombre}</strong>
                      <p>{tipo.descripcion}</p>
                    </div>
                    <div className="adaptativo-tags">
                      {tipo.estrategias.map((estrategia) => (
                        <span key={estrategia.id}>{estrategia.nombre}</span>
                      ))}
                    </div>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => inactivarTipo(tipo.id)}
                      disabled={procesando === `tipo-${tipo.id}`}
                    >
                      Inactivar
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
