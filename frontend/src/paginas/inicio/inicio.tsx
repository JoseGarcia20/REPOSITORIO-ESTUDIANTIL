import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  API_URL,
  PERMISOS,
  descargarExcelAuditoria,
  obtenerResumenDashboard,
  obtenerUsuarioAutenticado,
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

function formatearNumero(valor: number) {
  return new Intl.NumberFormat('es-CO').format(valor || 0);
}

function formatearFecha(valor: string | null | undefined) {
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
  const navigate = useNavigate();
  const usuario = obtenerUsuarioAutenticado();
  const permisos = usuario?.permisos || [];
  const logo = usuario?.institucion?.logo
    ? `${API_URL}${usuario.institucion.logo}`
    : null;
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [errorResumen, setErrorResumen] = useState('');
  const [descargandoAuditoria, setDescargandoAuditoria] = useState(false);

  useEffect(() => {
    if (!usuario?.id) {
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
  }, [usuario?.id]);

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

  const tituloPanel =
    resumen?.alcance === 'global'
      ? 'Visión global de NEXORA AI'
      : resumen?.alcance === 'institucion'
        ? `Visión institucional · ${usuario?.institucion?.nombre || 'Institución'}`
        : resumen?.alcance === 'docente'
          ? 'Panel docente'
          : resumen?.alcance === 'estudiante'
            ? 'Panel de estudiante'
            : resumen?.alcance === 'administrativo'
              ? 'Panel administrativo'
              : usuario?.institucion?.nombre || 'NEXORA AI';

  const descripcionPanel =
    resumen?.alcance === 'global'
      ? 'Seguimiento consolidado de instituciones, actividad y uso de la plataforma.'
      : resumen?.alcance === 'institucion'
        ? 'Monitoreo de usuarios, recursos y actividad académica de tu institución.'
        : resumen?.alcance === 'docente'
          ? 'Control personal de tus recursos, foros, proyectos y revisión de entregas.'
          : resumen?.alcance === 'estudiante'
            ? 'Seguimiento personal de participación, proyectos y avance académico.'
            : resumen?.alcance === 'administrativo'
              ? 'Resumen institucional con métricas operativas, auditoría y reportes.'
              : describirAlcance(permisos);

  async function exportarAuditoria() {
    try {
      setDescargandoAuditoria(true);
      await descargarExcelAuditoria();
    } catch (error) {
      setErrorResumen(
        error instanceof Error
          ? error.message
          : 'No se pudo exportar la auditoría en Excel.',
      );
    } finally {
      setDescargandoAuditoria(false);
    }
  }

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
          <h1>{tituloPanel}</h1>
          <p>{descripcionPanel}</p>
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
                <TablaInstituciones datos={resumen.usuariosPorInstitucion || []} />
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

              <TablaLogs logs={resumen.logsRecientes} />
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

              <TablaLogs logs={resumen.logsRecientes} />
            </>
          )}

          {resumen.alcance === 'docente' && (
            <>
              <section className="dashboard-grid two">
                <article className="dashboard-panel">
                  <header>
                    <h3>Mis últimos 5 recursos</h3>
                  </header>
                  <div className="dashboard-table-wrap">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Recurso</th>
                          <th>Fecha</th>
                          <th>Valoración</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(resumen.misRecursosRecientes || []).length === 0 ? (
                          <tr>
                            <td colSpan={3}>No tienes recursos recientes.</td>
                          </tr>
                        ) : (
                          resumen.misRecursosRecientes?.map((recurso) => (
                            <tr key={recurso.id}>
                              <td>{recurso.titulo}</td>
                              <td>{formatearFecha(recurso.createdAt)}</td>
                              <td>
                                {recurso.totalCalificaciones > 0
                                  ? `${recurso.promedioCalificacion.toFixed(1)} / 5 · ${formatearNumero(recurso.totalCalificaciones)} calificaciones`
                                  : 'Sin calificaciones'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="dashboard-panel">
                  <header>
                    <h3>Mis foros académicos abiertos</h3>
                  </header>
                  <div className="dashboard-activity-list">
                    {(resumen.misForosAbiertos || []).length === 0 ? (
                      <p className="dashboard-empty">No tienes foros abiertos.</p>
                    ) : (
                      resumen.misForosAbiertos?.map((foro) => (
                        <div className="dashboard-activity-item" key={foro.id}>
                          <strong>{foro.titulo}</strong>
                          <small>
                            {formatearFecha(foro.createdAt)} · Comentarios:{' '}
                            {formatearNumero(foro.comentarios)} ·{' '}
                            {foro.publico ? 'Público' : 'Institucional'}
                          </small>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </section>

              <section className="dashboard-grid two">
                <article className="dashboard-panel">
                  <header>
                    <h3>Proyectos donde soy docente</h3>
                  </header>
                  <div className="dashboard-activity-list">
                    {(resumen.proyectosDocente || []).length === 0 ? (
                      <p className="dashboard-empty">No tienes proyectos registrados.</p>
                    ) : (
                      resumen.proyectosDocente?.map((proyecto) => (
                        <div className="dashboard-activity-item" key={proyecto.id}>
                          <strong>{proyecto.titulo}</strong>
                          <small>
                            Estado: {proyecto.estadoLabel} · Fecha límite:{' '}
                            {formatearFecha(proyecto.fechaLimite)} · Integrantes:{' '}
                            {formatearNumero(proyecto.integrantes)}
                          </small>
                        </div>
                      ))
                    )}
                  </div>
                </article>

                <article className="dashboard-panel">
                  <header>
                    <h3>Entregas pendientes por revisar</h3>
                  </header>
                  <div className="dashboard-activity-list">
                    {(resumen.entregasPendientesRevision || []).length === 0 ? (
                      <p className="dashboard-empty">
                        No tienes entregas pendientes.
                      </p>
                    ) : (
                      resumen.entregasPendientesRevision?.map((entrega) => (
                        <div className="dashboard-activity-item" key={entrega.id}>
                          <strong>{entrega.proyectoTitulo}</strong>
                          <small>
                            Estudiante: {entrega.estudiante} · Entregada:{' '}
                            {formatearFecha(entrega.createdAt)}
                          </small>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </section>
            </>
          )}

          {resumen.alcance === 'estudiante' && (
            <>
              <section className="dashboard-grid two">
                <article className="dashboard-panel">
                  <header>
                    <h3>Mis proyectos</h3>
                    <span>{resumen.gradoEscolar?.nombre || 'Sin grado asignado'}</span>
                  </header>
                  <div className="dashboard-table-wrap">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Proyecto</th>
                          <th>Rol</th>
                          <th>Estado</th>
                          <th>Fecha límite</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(resumen.misProyectos || []).length === 0 ? (
                          <tr>
                            <td colSpan={4}>No tienes proyectos asignados.</td>
                          </tr>
                        ) : (
                          resumen.misProyectos?.map((proyecto) => (
                            <tr key={proyecto.id}>
                              <td>{proyecto.titulo}</td>
                              <td>{proyecto.rolProyecto}</td>
                              <td>{proyecto.estadoLabel}</td>
                              <td>{formatearFecha(proyecto.fechaLimite)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="dashboard-panel">
                  <header>
                    <h3>Foros académicos para mi grado</h3>
                  </header>
                  <div className="dashboard-activity-list">
                    {(resumen.forosDirigidosGrado || []).length === 0 ? (
                      <p className="dashboard-empty">
                        Aún no hay foros relacionados con tu grado.
                      </p>
                    ) : (
                      resumen.forosDirigidosGrado?.map((foro) => (
                        <div className="dashboard-activity-item" key={foro.id}>
                          <strong>{foro.titulo}</strong>
                          <small>
                            {foro.categoria} · Comentarios:{' '}
                            {formatearNumero(foro.comentarios)} ·{' '}
                            {foro.publico ? 'Público' : 'Institucional'}
                          </small>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </section>

              <section className="dashboard-grid two">
                <article className="dashboard-panel">
                  <header>
                    <h3>Mis rutas de aprendizaje</h3>
                  </header>
                  <div className="dashboard-activity-list">
                    {(resumen.misRutasAprendizaje || []).length === 0 ? (
                      <p className="dashboard-empty">No tienes rutas asignadas.</p>
                    ) : (
                      resumen.misRutasAprendizaje?.map((ruta) => (
                        <div className="dashboard-activity-item" key={ruta.id}>
                          <strong>{ruta.titulo}</strong>
                          <small>
                            Estado: {ruta.estado} · Avance:{' '}
                            {Number(ruta.porcentajeAvance || 0).toFixed(0)}% ·
                            Asignada: {formatearFecha(ruta.fechaAsignacion)}
                          </small>
                        </div>
                      ))
                    )}
                  </div>
                </article>

                <article className="dashboard-panel">
                  <header>
                    <h3>Último diagnóstico</h3>
                  </header>
                  {resumen.ultimoDiagnostico ? (
                    <div className="dashboard-activity-item">
                      <strong>{resumen.ultimoDiagnostico.tipoAprendizaje}</strong>
                      <small>
                        Puntaje: {resumen.ultimoDiagnostico.puntajeFinal} ·{' '}
                        Resultado: {resumen.ultimoDiagnostico.resultadoFinal}
                      </small>
                      <small>
                        Fecha: {formatearFecha(resumen.ultimoDiagnostico.createdAt)}
                      </small>
                    </div>
                  ) : (
                    <p className="dashboard-empty">
                      Aún no tienes diagnósticos registrados.
                    </p>
                  )}
                </article>
              </section>
            </>
          )}

          {resumen.alcance === 'administrativo' && (
            <>
              <section className="dashboard-actions-strip">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => navigate('/reportes')}
                >
                  Generar reporte de recursos
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={exportarAuditoria}
                  disabled={descargandoAuditoria}
                >
                  {descargandoAuditoria
                    ? 'Exportando auditoría...'
                    : 'Exportar auditoría en Excel'}
                </button>
              </section>

              <section className="dashboard-grid two">
                <TablaLogs logs={resumen.logsRecientes} />

                <article className="dashboard-panel">
                  <header>
                    <h3>Recursos publicados vs borradores por categoría</h3>
                  </header>
                  <div className="dashboard-table-wrap">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Categoría</th>
                          <th>Publicados</th>
                          <th>Borradores</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(resumen.recursosPublicadosVsBorradores || []).length === 0 ? (
                          <tr>
                            <td colSpan={4}>No hay recursos para mostrar.</td>
                          </tr>
                        ) : (
                          resumen.recursosPublicadosVsBorradores?.map((item) => (
                            <tr key={item.id}>
                              <td>{item.nombre}</td>
                              <td>{formatearNumero(item.publicados)}</td>
                              <td>{formatearNumero(item.borradores)}</td>
                              <td>{formatearNumero(item.total)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              </section>
            </>
          )}
        </>
      )}

      {!cargandoResumen && !errorResumen && !resumen && (
        <article className="dashboard-panel">
          <p className="dashboard-empty">No hay datos disponibles para este panel.</p>
        </article>
      )}
    </section>
  );
}
