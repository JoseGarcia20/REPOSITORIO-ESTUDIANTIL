import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  construirUrlArchivoProtegido,
  obtenerAuditoriaLogs,
  descargarExcelAuditoria,
  obtenerUsuarioAutenticado,
} from '../../api/adminApi';
import type {
  AuditoriaLogItem,
  ConsultaPaginada,
  EntidadAuditoria,
} from '../../api/adminApi';
import './auditoria.css';

const APP_LOGO_SRC = '/logo-solo.png';

const entidadesDisponibles: { valor: EntidadAuditoria; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todas las entidades' },
  { valor: 'recurso', etiqueta: 'Recursos' },
  { valor: 'foro', etiqueta: 'Foros' },
  { valor: 'proyecto_colaborativo', etiqueta: 'Aula Colaborativa' },
  { valor: 'preparador_ia', etiqueta: 'Preparador IA' },
  { valor: 'usuario', etiqueta: 'Usuarios' },
  { valor: 'institucion', etiqueta: 'Instituciones' },
];

const etiquetaAccion: Record<string, string> = {
  creado: 'Creado',
  editado: 'Editado',
  inactivado: 'Inactivado',
  reactivado: 'Reactivado',
  cerrado: 'Cerrado',
  creada: 'Creada',
  editada: 'Editada',
  inactivada: 'Inactivada',
  reactivada: 'Reactivada',
  entrega_aprobada: 'Entrega aprobada',
  entrega_requiere_ajustes: 'Requiere ajustes',
  material_guardado: 'Material guardado',
};

function etiquetarAccion(accion: string): string {
  return etiquetaAccion[accion] || accion;
}

function etiquetarEntidad(entidad: string): string {
  const mapa: Record<string, string> = {
    recurso: 'Recurso',
    foro: 'Foro',
    proyecto_colaborativo: 'Aula Colaborativa',
    preparador_ia: 'Preparador IA',
    usuario: 'Usuario',
    institucion: 'Institución',
  };
  return mapa[entidad] || entidad;
}

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString('es-CO');
}

function extraerDetalle(detalles: Record<string, unknown> | null): string {
  if (!detalles) return '';
  if (typeof detalles === 'string') return detalles;

  const partes: string[] = [];

  if (detalles.usuario) partes.push(String(detalles.usuario));
  if (detalles.titulo) partes.push(String(detalles.titulo));
  if (detalles.nombre) partes.push(String(detalles.nombre));
  if (detalles.tema) partes.push(String(detalles.tema));
  if (detalles.correo) partes.push(String(detalles.correo));
  if (detalles.codigo) partes.push(String(detalles.codigo));

  if (detalles.camposActualizados && Array.isArray(detalles.camposActualizados)) {
    const campos = (detalles.camposActualizados as string[])
      .filter((c: string) => !['updatedAt', 'id'].includes(c))
      .map((c: string) => {
        const mapa: Record<string, string> = {
          nombres: 'nombres',
          apellidos: 'apellidos',
          correo: 'correo',
          contrasena: 'contraseña',
          documento: 'documento',
          fechaNacimiento: 'fecha nac.',
          genero: 'género',
          telefono: 'teléfono',
          direccion: 'dirección',
          sitioWeb: 'sitio web',
          ciudad: 'ciudad',
          departamento: 'departamento',
          institucionId: 'institución',
          rolId: 'rol',
          gradoEscolarId: 'grado escolar',
          tipoDocumento: 'tipo doc.',
          estado: 'estado',
          publicado: 'publicado',
          titulo: 'título',
          descripcion: 'descripción',
          categoriaId: 'categoría',
          tipoRecursoId: 'tipo recurso',
          palabrasClave: 'palabras clave',
          contenidoResumen: 'resumen',
          rutaRecurso: 'archivo',
          urlRecurso: 'URL',
          fuente: 'fuente',
          autorNombre: 'autor',
          nivelAcademico: 'nivel acad.',
          objetivo: 'objetivo',
          instrucciones: 'instrucciones',
          publico: 'público',
          fechaLimite: 'fecha límite',
        };
        return mapa[c] || c;
      });
    partes.push(`Editado: ${campos.join(', ')}`);
  }

  if (detalles.cambiosSensibles) {
    const cambios = detalles.cambiosSensibles as Record<string, { anterior: unknown; nuevo: unknown }>;
    for (const [campo, cambio] of Object.entries(cambios)) {
      if (campo === 'rolId') partes.push(`Rol: ${String(cambio.anterior)} → ${String(cambio.nuevo)}`);
      else if (campo === 'institucionId') partes.push(`Institución ID: ${String(cambio.anterior)} → ${String(cambio.nuevo)}`);
    }
  }

  if (detalles.tipoMaterial) partes.push(`Tipo: ${String(detalles.tipoMaterial)}`);
  if (detalles.calificacion !== undefined && detalles.calificacion !== null) {
    partes.push(`Calificación: ${String(detalles.calificacion)}`);
  }

  return partes.join(' · ');
}

export function Auditoria() {
  const usuario = obtenerUsuarioAutenticado();
  const [logs, setLogs] = useState<AuditoriaLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [entidadFiltro, setEntidadFiltro] = useState<EntidadAuditoria>('');
  const [entidadIdFiltro, setEntidadIdFiltro] = useState('');

  useEffect(() => {
    cargarLogs();
  }, [pagina]);

  async function cargarLogs() {
    try {
      setCargando(true);
      setError('');
      const query: ConsultaPaginada & { entidad?: string; entidadId?: string } = {
        pagina,
        limite: 20,
      };
      if (entidadFiltro) query.entidad = entidadFiltro;
      if (entidadIdFiltro) query.entidadId = entidadIdFiltro;
      const respuesta = await obtenerAuditoriaLogs(query);
      setLogs(respuesta.data);
      setTotal(respuesta.total);
      setTotalPaginas(respuesta.totalPaginas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar auditoría');
    } finally {
      setCargando(false);
    }
  }

  function manejarFiltro(event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) {
    const { name, value } = event.target;
    if (name === 'entidad') setEntidadFiltro(value as EntidadAuditoria);
    if (name === 'entidadId') setEntidadIdFiltro(value);
  }

  function aplicarFiltros(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPagina(1);
    cargarLogs();
  }

  async function manejarExcel() {
    try {
      await descargarExcelAuditoria({
        ...(entidadFiltro ? { entidad: entidadFiltro } : {}),
        ...(entidadIdFiltro ? { entidadId: entidadIdFiltro } : {}),
      });
    } catch {
      setError('No se pudo descargar el archivo Excel.');
    }
  }

  function imprimir() {
    window.print();
  }

  return (
    <section className="instituciones-page">
      <div className="instituciones-header no-print">
        <div>
          <span className="section-label">Administración</span>
          <h1>Auditoría</h1>
          <p>
            Registro de acciones realizadas en el sistema durante el último mes.
          </p>
        </div>
      </div>

      <div className="instituciones-card no-print">
        <form className="table-tools" onSubmit={aplicarFiltros}>
          <select name="entidad" value={entidadFiltro} onChange={manejarFiltro}>
            {entidadesDisponibles.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="entidadId"
            value={entidadIdFiltro}
            onChange={manejarFiltro}
            placeholder="Filtrar por ID..."
          />
          <button className="primary-button" type="submit" disabled={cargando}>
            {cargando ? 'Buscando...' : 'Filtrar'}
          </button>
          <button className="secondary-button" type="button" onClick={imprimir}>
            Imprimir / PDF
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={manejarExcel}
          >
            Exportar Excel
          </button>
        </form>

        {cargando && <p className="state-message">Cargando registros...</p>}
        {error && <p className="state-message error">{error}</p>}

        {!cargando && !error && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Entidad</th>
                  <th>Acción</th>
                  <th>Usuario</th>
                  <th>Institución</th>
                  <th>Detalle</th>
                  <th>IP</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-table">
                      No hay registros de auditoría para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td data-label="ID">{log.id}</td>
                      <td data-label="Entidad">{etiquetarEntidad(log.entidad)}</td>
                      <td data-label="Acción">{etiquetarAccion(log.accion)}</td>
                      <td data-label="Usuario">
                        {log.usuario.nombres} {log.usuario.apellidos}
                        <br />
                        <small>{log.usuario.correo}</small>
                      </td>
                      <td data-label="Institución">{log.institucion?.nombre || '-'}</td>
                      <td data-label="Detalle">{extraerDetalle(log.detalles)}</td>
                      <td data-label="IP">{log.direccionIp || '-'}</td>
                      <td data-label="Fecha">{formatearFecha(log.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPaginas > 1 && (
              <div className="pagination-bar">
                <span>
                  {total} registros · Página {pagina} de {totalPaginas}
                </span>
                <div>
                  <button
                    className="secondary-button"
                    onClick={() => setPagina((prev) => Math.max(prev - 1, 1))}
                    disabled={pagina <= 1}
                  >
                    Anterior
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => setPagina((prev) => Math.min(prev + 1, totalPaginas))}
                    disabled={pagina >= totalPaginas}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <article className="report-document-auditoria">
        <div className="report-document-actions no-print">
          <button className="secondary-button" onClick={imprimir}>
            Imprimir / Guardar PDF
          </button>
        </div>

        <header className="report-document-header">
          <div className="report-logos">
            <div className="report-logo">
              <img src={APP_LOGO_SRC} alt="NEXORA AI" />
            </div>
            {usuario?.institucion?.logo && (
              <div className="report-logo">
                <img
                  src={construirUrlArchivoProtegido(usuario.institucion.logo)}
                  alt={usuario.institucion.nombre}
                />
              </div>
            )}
          </div>
          <div>
            <span>{usuario?.institucion?.nombre || 'NEXORA AI'}</span>
            <h2>Auditoría del Sistema</h2>
            <p>
              Registro de acciones realizadas en la plataforma · {entidadFiltro ? etiquetarEntidad(entidadFiltro) : 'Todas las entidades'}
              {entidadIdFiltro ? ` · ID: ${entidadIdFiltro}` : ''}
            </p>
          </div>
          <dl>
            <div>
              <dt>Generado</dt>
              <dd>{new Date().toLocaleString('es-CO')}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{usuario?.nombres} {usuario?.apellidos}</dd>
            </div>
            <div>
              <dt>Registros</dt>
              <dd>{total}</dd>
            </div>
          </dl>
        </header>

        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Entidad</th>
                <th>Acción</th>
                <th>Usuario</th>
                <th>Institución</th>
                <th>Detalle</th>
                <th>IP</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8}>No hay registros.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{etiquetarEntidad(log.entidad)}</td>
                    <td>{etiquetarAccion(log.accion)}</td>
                    <td>
                      {log.usuario.nombres} {log.usuario.apellidos}
                      <br />
                      <small>{log.usuario.correo}</small>
                    </td>
                    <td>{log.institucion?.nombre || '-'}</td>
                    <td>{extraerDetalle(log.detalles)}</td>
                    <td>{log.direccionIp || '-'}</td>
                    <td>{formatearFecha(log.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="report-footer">
          Documento generado por NEXORA AI.
        </footer>
      </article>
    </section>
  );
}
