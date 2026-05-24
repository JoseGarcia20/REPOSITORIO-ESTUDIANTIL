import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  API_URL,
  esSuperadministrador,
  generarReporte,
  obtenerCatalogosReportes,
  obtenerUsuarioAutenticado,
} from '../../api/adminApi';
import type {
  CatalogosReportes,
  PayloadReporte,
  ReporteGenerado,
  TipoReporte,
} from '../../api/adminApi';
import './reportes.css';

type ReporteDisponible = {
  id: TipoReporte;
  titulo: string;
  descripcion: string;
  campos: string[];
};

const reportesDisponibles: ReporteDisponible[] = [
  {
    id: 'recursos-institucion',
    titulo: 'Estadística de recursos',
    descripcion:
      'Inventario institucional con puntuación, usuarios que calificaron y estado de publicación.',
    campos: ['categoria', 'grado'],
  },
  {
    id: 'trabajos-colaborativos',
    titulo: 'Trabajos colaborativos',
    descripcion:
      'Proyectos realizados, participación, estado, calificación y recurso resultante.',
    campos: ['categoria', 'grado', 'estadoProyecto'],
  },
  {
    id: 'recursos-uso',
    titulo: 'Recursos más usados',
    descripcion:
      'Ranking por uso registrado en foros, aula colaborativa, rutas y calificaciones.',
    campos: ['categoria', 'grado', 'moduloUso', 'limite'],
  },
];

const estadosProyecto = [
  { valor: '', etiqueta: 'Todos los estados' },
  { valor: 'activo', etiqueta: 'Activo' },
  { valor: 'en_revision', etiqueta: 'En revisión' },
  { valor: 'requiere_ajustes', etiqueta: 'Requiere ajustes' },
  { valor: 'aprobado', etiqueta: 'Aprobado' },
  { valor: 'cerrado', etiqueta: 'Cerrado' },
];

const modulosUso = [
  { valor: 'todos', etiqueta: 'Todos los módulos' },
  { valor: 'foros', etiqueta: 'Foros académicos' },
  { valor: 'aula', etiqueta: 'Aula colaborativa' },
  { valor: 'rutas', etiqueta: 'Rutas de aprendizaje' },
  { valor: 'calificaciones', etiqueta: 'Calificaciones' },
];

function fechaInput(fecha: Date) {
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function crearFormularioInicial(): PayloadReporte {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  return {
    tipo: 'recursos-institucion',
    fechaInicio: fechaInput(inicio),
    fechaFin: fechaInput(hoy),
    moduloUso: 'todos',
    limite: '10',
  };
}

function valorCelda(valor: string | number | undefined) {
  if (valor === undefined || valor === null || valor === '') {
    return 'Sin dato';
  }

  return String(valor);
}

export function Reportes() {
  const usuario = obtenerUsuarioAutenticado();
  const esSuper = esSuperadministrador();
  const [catalogos, setCatalogos] = useState<CatalogosReportes>({
    instituciones: [],
    categorias: [],
    gradosEscolares: [],
  });
  const [formulario, setFormulario] = useState<PayloadReporte>(
    crearFormularioInicial,
  );
  const [reporte, setReporte] = useState<ReporteGenerado | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [error, setError] = useState('');

  const reporteSeleccionado = useMemo(
    () =>
      reportesDisponibles.find((item) => item.id === formulario.tipo) ||
      reportesDisponibles[0],
    [formulario.tipo],
  );

  useEffect(() => {
    cargarCatalogos();
  }, []);

  async function cargarCatalogos() {
    try {
      setCargandoCatalogos(true);
      const respuesta = await obtenerCatalogosReportes();
      setCatalogos(respuesta);
    } catch {
      setError('No se pudieron cargar los catálogos de reportes.');
    } finally {
      setCargandoCatalogos(false);
    }
  }

  function seleccionarReporte(tipo: TipoReporte) {
    setFormulario((prev) => ({
      ...prev,
      tipo,
      estadoProyecto: '',
      moduloUso: tipo === 'recursos-uso' ? prev.moduloUso || 'todos' : 'todos',
      limite: tipo === 'recursos-uso' ? prev.limite || '10' : '10',
    }));
    setReporte(null);
  }

  function manejarCampo(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function manejarGeneracion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCargando(true);
      setError('');
      const resultado = await generarReporte(formulario);
      setReporte(resultado);
    } catch (errorGeneracion) {
      setReporte(null);
      setError(
        errorGeneracion instanceof Error
          ? errorGeneracion.message
          : 'No se pudo generar el reporte.',
      );
    } finally {
      setCargando(false);
    }
  }

  function imprimirReporte() {
    window.print();
  }

  function renderLogo(reporteGenerado: ReporteGenerado) {
    const logo = reporteGenerado.encabezado.logo;

    if (logo) {
      return (
        <img
          src={`${API_URL}${logo}`}
          alt={reporteGenerado.encabezado.nombreEmisor}
        />
      );
    }

    return <span>AI</span>;
  }

  return (
    <section className="reportes-page">
      <div className="reportes-header no-print">
        <div>
          <span className="section-label">Administración</span>
          <h1>Reportes</h1>
          <p>
            Genera informes institucionales con periodo, filtros y presentación
            profesional.
          </p>
        </div>
      </div>

      <form className="report-builder no-print" onSubmit={manejarGeneracion}>
        <section className="report-panel">
          <div className="report-panel-head">
            <span>1</span>
            <div>
              <h2>Selecciona el reporte</h2>
              <p>Marca el informe que necesitas generar.</p>
            </div>
          </div>

          <div className="report-checklist">
            {reportesDisponibles.map((item) => (
              <label
                className={`report-option ${
                  formulario.tipo === item.id ? 'selected' : ''
                }`}
                key={item.id}
              >
                <input
                  type="checkbox"
                  checked={formulario.tipo === item.id}
                  onChange={() => seleccionarReporte(item.id)}
                />
                <span>
                  <strong>{item.titulo}</strong>
                  <small>{item.descripcion}</small>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="report-panel">
          <div className="report-panel-head">
            <span>2</span>
            <div>
              <h2>Parámetros</h2>
              <p>Define el periodo y los campos adicionales del informe.</p>
            </div>
          </div>

          <div className="report-form-grid">
            <label>
              Fecha inicial
              <input
                type="date"
                name="fechaInicio"
                value={formulario.fechaInicio || ''}
                onChange={manejarCampo}
              />
            </label>

            <label>
              Fecha final
              <input
                type="date"
                name="fechaFin"
                value={formulario.fechaFin || ''}
                onChange={manejarCampo}
              />
            </label>

            {esSuper && (
              <label>
                Institución
                <select
                  name="institucionId"
                  value={formulario.institucionId || ''}
                  onChange={manejarCampo}
                  disabled={cargandoCatalogos}
                >
                  <option value="">Reporte general del sistema</option>
                  {catalogos.instituciones.map((institucion) => (
                    <option key={institucion.id} value={institucion.id}>
                      {institucion.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {reporteSeleccionado.campos.includes('categoria') && (
              <label>
                Categoría
                <select
                  name="categoriaId"
                  value={formulario.categoriaId || ''}
                  onChange={manejarCampo}
                  disabled={cargandoCatalogos}
                >
                  <option value="">Todas las categorías</option>
                  {catalogos.categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                      {esSuper && categoria.institucion
                        ? ` · ${categoria.institucion.nombre}`
                        : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {reporteSeleccionado.campos.includes('grado') && (
              <label>
                Grado escolar
                <select
                  name="gradoEscolarId"
                  value={formulario.gradoEscolarId || ''}
                  onChange={manejarCampo}
                  disabled={cargandoCatalogos}
                >
                  <option value="">Todos los grados</option>
                  {catalogos.gradosEscolares.map((grado) => (
                    <option key={grado.id} value={grado.id}>
                      {grado.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {reporteSeleccionado.campos.includes('estadoProyecto') && (
              <label>
                Estado del proyecto
                <select
                  name="estadoProyecto"
                  value={formulario.estadoProyecto || ''}
                  onChange={manejarCampo}
                >
                  {estadosProyecto.map((estado) => (
                    <option key={estado.valor} value={estado.valor}>
                      {estado.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {reporteSeleccionado.campos.includes('moduloUso') && (
              <label>
                Módulo
                <select
                  name="moduloUso"
                  value={formulario.moduloUso || 'todos'}
                  onChange={manejarCampo}
                >
                  {modulosUso.map((modulo) => (
                    <option key={modulo.valor} value={modulo.valor}>
                      {modulo.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {reporteSeleccionado.campos.includes('limite') && (
              <label>
                Cantidad de registros
                <input
                  type="number"
                  min="1"
                  max="50"
                  name="limite"
                  value={formulario.limite || '10'}
                  onChange={manejarCampo}
                />
              </label>
            )}
          </div>

          <div className="report-actions">
            <span>
              Emisor:{' '}
              {esSuper && !formulario.institucionId
                ? 'Plataforma Estudiantil'
                : usuario?.institucion?.nombre || 'Institución'}
            </span>
            <button
              className="primary-button"
              type="submit"
              disabled={cargando}
            >
              {cargando ? 'Generando...' : 'Generar reporte'}
            </button>
          </div>
        </section>
      </form>

      {error && <p className="report-error no-print">{error}</p>}

      {reporte && (
        <article className="report-document">
          <div className="report-document-actions no-print">
            <button className="secondary-button" onClick={imprimirReporte}>
              Imprimir / Guardar PDF
            </button>
          </div>

          <header className="report-document-header">
            <div className="report-logo">{renderLogo(reporte)}</div>
            <div>
              <span>{reporte.encabezado.nombreEmisor}</span>
              <h2>{reporte.titulo}</h2>
              <p>{reporte.descripcion}</p>
            </div>
            <dl>
              <div>
                <dt>Periodo</dt>
                <dd>{reporte.periodo}</dd>
              </div>
              <div>
                <dt>Generado</dt>
                <dd>{new Date(reporte.generadoEn).toLocaleString('es-CO')}</dd>
              </div>
              <div>
                <dt>Responsable</dt>
                <dd>{reporte.encabezado.generadoPor}</dd>
              </div>
            </dl>
          </header>

          <section className="report-identity">
            <span>
              {reporte.encabezado.ubicacion || 'Reporte institucional'}
            </span>
            {reporte.encabezado.nit && (
              <span>NIT {reporte.encabezado.nit}</span>
            )}
            {reporte.encabezado.rolGenerador && (
              <span>Rol: {reporte.encabezado.rolGenerador}</span>
            )}
          </section>

          <section className="report-metrics">
            {reporte.metricas.map((metrica) => (
              <div key={`${metrica.label}-${metrica.value}`}>
                <span>{metrica.label}</span>
                <strong>{metrica.value}</strong>
                {metrica.detail && <small>{metrica.detail}</small>}
              </div>
            ))}
          </section>

          {reporte.filtros.length > 0 && (
            <section className="report-filters">
              {reporte.filtros.map((filtro) => (
                <span key={`${filtro.label}-${filtro.value}`}>
                  <strong>{filtro.label}:</strong> {filtro.value}
                </span>
              ))}
            </section>
          )}

          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  {reporte.columnas.map((columna) => (
                    <th className={columna.align || 'left'} key={columna.key}>
                      {columna.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reporte.filas.length === 0 ? (
                  <tr>
                    <td colSpan={reporte.columnas.length}>
                      No hay registros para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  reporte.filas.map((fila, indice) => (
                    <tr key={indice}>
                      {reporte.columnas.map((columna) => (
                        <td
                          className={columna.align || 'left'}
                          key={`${indice}-${columna.key}`}
                        >
                          {valorCelda(fila[columna.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {reporte.notas && reporte.notas.length > 0 && (
            <section className="report-notes">
              {reporte.notas.map((nota) => (
                <p key={nota}>{nota}</p>
              ))}
            </section>
          )}

          <footer className="report-footer">
            Documento generado por Plataforma Estudiantil.
          </footer>
        </article>
      )}
    </section>
  );
}
