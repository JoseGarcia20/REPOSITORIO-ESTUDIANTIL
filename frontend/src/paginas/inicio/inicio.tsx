import { useEffect, useMemo, useState } from 'react';
import {
  API_URL,
  obtenerResumenDashboard,
  obtenerUsuarioAutenticado,
  PERMISOS,
} from '../../api/adminApi';
import type {
  DashboardDistribucionGlobal,
  DashboardDistribucionInstitucion,
  DashboardLogReciente,
  DashboardSerie,
  ResumenDashboard,
} from '../../api/adminApi';
import './inicio.css';

type SegmentoDona = {
  label: string;
  value: number;
  color: string;
};

function normalizarTexto(valor?: string) {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatearNumero(valor: number) {
  return new Intl.NumberFormat('es-CO').format(valor || 0);
}

function formatearFecha(valor: string) {
  if (!valor) {
    return 'Sin fecha';
  }

  return new Date(valor).toLocaleString('es-CO');
}

function construirGradienteDona(segmentos: SegmentoDona[]) {
  const total = segmentos.reduce((acumulado, item) => acumulado + item.value, 0);
  if (total <= 0) {
    return 'conic-gradient(var(--surface-muted) 0deg 360deg)';
  }

  let actual = 0;
  const partes = segmentos.map((item) => {
    const inicio = (actual / total) * 360;
    actual += item.value;
    const fin = (actual / total) * 360;
    return `${item.color} ${inicio}deg ${fin}deg`;
  });

  return `conic-gradient(${partes.join(',')})`;
}

function CardKpi({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <article className="dashboard-kpi-card">
      <span>{label}</span>
      <strong>{formatearNumero(value)}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

function GraficoDona({
  titulo,
  segmentos,
}: {
  titulo: string;
  segmentos: SegmentoDona[];
}) {
  const total = segmentos.reduce((acumulado, item) => acumulado + item.value, 0);
  const gradiente = construirGradienteDona(segmentos);

  return (
    <article className="dashboard-panel">
      <header>
        <h3>{titulo}</h3>
        <span>Total: {formatearNumero(total)}</span>
      </header>
      <div className="dashboard-donut-wrap">
        <div
          className="dashboard-donut-chart"
          style={{ background: gradiente }}
          aria-label={titulo}
        >
          <div className="dashboard-donut-center">{formatearNumero(total)}</div>
        </div>
        <div className="dashboard-donut-legend">
          {segmentos.map((segmento) => (
            <div key={segmento.label} className="dashboard-legend-item">
              <span
                className="dashboard-legend-swatch"
                style={{ background: segmento.color }}
              />
              <div>
                <strong>{segmento.label}</strong>
                <small>{formatearNumero(segmento.value)}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function GraficoBarras({
  titulo,
  datos,
}: {
  titulo: string;
  datos: DashboardSerie[];
}) {
  const maximo = Math.max(...datos.map((item) => item.total), 0);

  return (
    <article className="dashboard-panel">
      <header>
        <h3>{titulo}</h3>
      </header>
      <div className="dashboard-bars">
        {datos.length === 0 ? (
          <p className="dashboard-empty">Sin datos para mostrar.</p>
        ) : (
          datos.map((item) => (
            <div key={`${item.id}-${item.nombre}`} className="dashboard-bar-item">
              <div className="dashboard-bar-label">
                <span>{item.nombre}</span>
                <strong>{formatearNumero(item.total)}</strong>
              </div>
              <div className="dashboard-bar-track">
                <div
                  className="dashboard-bar-fill"
                  style={{
                    width: `${maximo > 0 ? Math.max((item.total / maximo) * 100, 5) : 0}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

function TablaLogs({ logs }: { logs: DashboardLogReciente[] }) {
  return (
    <article className="dashboard-panel">
      <header>
        <h3>Últimos logs de auditoría</h3>
      </header>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Entidad</th>
              <th>Acción</th>
              <th>Usuario</th>
              <th>Institución</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5}>Sin registros recientes.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatearFecha(log.createdAt)}</td>
                  <td>{log.entidad}</td>
                  <td>{log.accion}</td>
                  <td>{log.usuario}</td>
                  <td>{log.institucion}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function ListaActividad({
  titulo,
  datos,
}: {
  titulo: string;
  datos: Array<{ nombre: string; actividad: number; usuarios: number; recursos: number }>;
}) {
  return (
    <article className="dashboard-panel">
      <header>
        <h3>{titulo}</h3>
      </header>
      <div className="dashboard-activity-list">
        {datos.length === 0 ? (
          <p className="dashboard-empty">Sin instituciones para mostrar.</p>
        ) : (
          datos.map((item) => (
            <div className="dashboard-activity-item" key={`${titulo}-${item.nombre}`}>
              <strong>{item.nombre}</strong>
              <small>
                Actividad: {formatearNumero(item.actividad)} · Usuarios:{' '}
                {formatearNumero(item.usuarios)} · Recursos:{' '}
                {formatearNumero(item.recursos)}
              </small>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

function TablaInstituciones({
  datos,
}: {
  datos: Array<{ nombre: string; usuarios: number; recursos: number; actividad: number }>;
}) {
  return (
    <article className="dashboard-panel">
      <header>
        <h3>Usuarios y recursos por institución</h3>
      </header>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Institución</th>
              <th>Usuarios</th>
              <th>Recursos</th>
              <th>Actividad</th>
            </tr>
          </thead>
          <tbody>
            {datos.length === 0 ? (
              <tr>
                <td colSpan={4}>Sin datos para mostrar.</td>
              </tr>
            ) : (
              datos.map((item) => (
                <tr key={item.nombre}>
                  <td>{item.nombre}</td>
                  <td>{formatearNumero(item.usuarios)}</td>
                  <td>{formatearNumero(item.recursos)}</td>
                  <td>{formatearNumero(item.actividad)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function describirAlcance(permisos: string[]) {
  if (permisos.includes(PERMISOS.SISTEMA_TOTAL)) {
    return 'Acceso total a todos los módulos e instituciones.';
  }

  if (permisos.includes(PERMISOS.USUARIOS_CREAR)) {
    return 'Administración completa dentro de la institución asignada.';
  }

  if (permisos.includes(PERMISOS.FOROS_CREAR_PUBLICO)) {
    return 'Participación docente con foros públicos e institucionales.';
  }

  if (permisos.includes(PERMISOS.REPORTES_VER)) {
    return 'Consulta de reportes y participación en foros disponibles.';
  }

  return 'Acceso académico a recursos y espacios habilitados.';
}

export function Inicio() {
  const usuario = obtenerUsuarioAutenticado();
  const permisos = usuario?.permisos || [];
  const rolNormalizado = normalizarTexto(usuario?.rol?.nombre);
  const esSuperadmin =
    permisos.includes(PERMISOS.SISTEMA_TOTAL) ||
    rolNormalizado.includes('superadministrador');
  const esAdministrador = rolNormalizado === 'administrador';
  const usarDashboardAvanzado = esSuperadmin || esAdministrador;
  const logo = usuario?.institucion?.logo
    ? `${API_URL}${usuario.institucion.logo}`
    : null;
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [errorResumen, setErrorResumen] = useState('');

  useEffect(() => {
    if (!usarDashboardAvanzado) {
      setResumen(null);
      return;
    }

    let activo = true;

    async function cargarResumen() {
      try {
        setCargandoResumen(true);
        setErrorResumen('');
        const data = await obtenerResumenDashboard();
        if (activo) {
          setResumen(data);
        }
      } catch (error) {
        if (activo) {
          setErrorResumen(
            error instanceof Error
              ? error.message
              : 'No se pudo cargar el dashboard.',
          );
        }
      } finally {
        if (activo) {
          setCargandoResumen(false);
        }
      }
    }

    cargarResumen();

    return () => {
      activo = false;
    };
  }, [usarDashboardAvanzado]);

  const segmentosGlobales = useMemo(() => {
    if (!resumen || resumen.alcance !== 'global') {
      return [];
    }

    const dist = resumen.distribucionUsuarios as DashboardDistribucionGlobal;
    return [
      { label: 'Superadmin', value: dist.superadministrador, color: '#111184' },
      { label: 'Administrador', value: dist.administrador, color: '#2b2d5e' },
      { label: 'Docente', value: dist.docente, color: '#4b5cc4' },
      { label: 'Estudiante', value: dist.estudiante, color: '#7e8cf6' },
      {
        label: 'Usuario administrativo',
        value: dist.usuarioAdministrativo,
        color: '#a3adff',
      },
    ];
  }, [resumen]);

  const segmentosInstitucion = useMemo(() => {
    if (!resumen || resumen.alcance !== 'institucion') {
      return [];
    }

    const dist = resumen.distribucionUsuarios as DashboardDistribucionInstitucion;
    return [
      { label: 'Estudiantes', value: dist.estudiantes, color: '#111184' },
      { label: 'Docentes', value: dist.docentes, color: '#4b5cc4' },
      { label: 'Administrativos', value: dist.administrativos, color: '#a3adff' },
    ];
  }, [resumen]);

  if (usarDashboardAvanzado) {
    return (
      <section className="inicio-page">
        <div className="inicio-hero">
          <div className="inicio-logo">
            {logo ? (
              <img src={logo} alt="Logo institución" />
            ) : (
              <span>{usuario?.institucion?.nombre?.charAt(0) || 'N'}</span>
            )}
          </div>

          <div className="inicio-heading">
            <span className="section-label">Panel de control</span>
            <h1>
              {esSuperadmin
                ? 'Visión global de NEXORA AI'
                : `Visión institucional · ${usuario?.institucion?.nombre || 'Institución'}`}
            </h1>
            <p>
              {esSuperadmin
                ? 'Seguimiento consolidado de instituciones, actividad y uso de la plataforma.'
                : 'Monitoreo de usuarios, recursos y actividad académica de tu institución.'}
            </p>
          </div>

          <div className="inicio-role-card">
            <span>Rol activo</span>
            <strong>{usuario?.rol?.nombre || 'Usuario'}</strong>
            <small>
              {usuario?.nombres} {usuario?.apellidos}
            </small>
          </div>
        </div>

        {cargandoResumen && (
          <div className="inicio-dashboard-loading">
            Cargando indicadores del dashboard...
          </div>
        )}

        {errorResumen && !cargandoResumen && (
          <div className="inicio-dashboard-error">{errorResumen}</div>
        )}

        {!cargandoResumen && !errorResumen && resumen && (
          <>
            <section className="dashboard-kpi-grid">
              {resumen.kpis.map((item) => (
                <CardKpi
                  key={item.key}
                  label={item.label}
                  value={item.value}
                  detail={item.detail}
                />
              ))}
            </section>

            {resumen.alcance === 'global' && (
              <>
                <section className="dashboard-grid two">
                  <GraficoDona
                    titulo="Distribución global de usuarios por rol"
                    segmentos={segmentosGlobales}
                  />
                  <TablaInstituciones
                    datos={resumen.usuariosPorInstitucion || []}
                  />
                </section>

                <section className="dashboard-grid two">
                  <ListaActividad
                    titulo="Instituciones con más actividad (30 días)"
                    datos={resumen.institucionesConMasActividad || []}
                  />
                  <ListaActividad
                    titulo="Instituciones sin actividad (30 días)"
                    datos={resumen.institucionesSinActividad || []}
                  />
                </section>
              </>
            )}

            {resumen.alcance === 'institucion' && (
              <>
                <section className="dashboard-grid two">
                  <GraficoDona
                    titulo="Distribución de usuarios"
                    segmentos={segmentosInstitucion}
                  />
                  <article className="dashboard-panel">
                    <header>
                      <h3>Foros recientes</h3>
                    </header>
                    <div className="dashboard-activity-list">
                      {(resumen.forosRecientes || []).length === 0 ? (
                        <p className="dashboard-empty">Sin foros recientes.</p>
                      ) : (
                        resumen.forosRecientes?.map((foro) => (
                          <div className="dashboard-activity-item" key={foro.id}>
                            <strong>{foro.titulo}</strong>
                            <small>
                              {formatearFecha(foro.createdAt)} · {foro.autor} ·
                              Comentarios: {formatearNumero(foro.comentarios)}
                            </small>
                          </div>
                        ))
                      )}
                    </div>
                  </article>
                </section>

                <section className="dashboard-grid two">
                  <GraficoBarras
                    titulo="Recursos por categoría"
                    datos={resumen.recursosPorCategoria || []}
                  />
                  <GraficoBarras
                    titulo="Recursos por grado"
                    datos={resumen.recursosPorGrado || []}
                  />
                </section>
              </>
            )}

            <TablaLogs logs={resumen.logsRecientes} />
          </>
        )}
      </section>
    );
  }

  return (
    <section className="inicio-page">
      <div className="inicio-hero">
        <div className="inicio-logo">
          {logo ? (
            <img src={logo} alt="Logo institución" />
          ) : (
            <span>{usuario?.institucion?.nombre?.charAt(0) || 'P'}</span>
          )}
        </div>

        <div className="inicio-heading">
          <span className="section-label">Panel inicial</span>
          <h1>{usuario?.institucion?.nombre || 'Plataforma Estudiantil'}</h1>
          <p>{describirAlcance(permisos)}</p>
        </div>

        <div className="inicio-role-card">
          <span>Rol activo</span>
          <strong>{usuario?.rol?.nombre || 'Usuario'}</strong>
          <small>
            {usuario?.nombres} {usuario?.apellidos}
          </small>
        </div>
      </div>
    </section>
  );
}
