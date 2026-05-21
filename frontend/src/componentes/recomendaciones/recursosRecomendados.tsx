import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerRecomendacionesRecursos,
  PERMISOS,
  usuarioTienePermiso,
} from '../../api/adminApi';
import type { RecursoAsistente } from '../../api/adminApi';
import './recursosRecomendados.css';

type RecursosRecomendadosProps = {
  titulo?: string;
  descripcion?: string;
  tema?: string;
  categoriaId?: number | string;
  categoriaIds?: number | string;
  gradoEscolarId?: number | string;
  tipoRecursoId?: number | string;
  excluirRecursoId?: number | string;
  limite?: number;
  compacto?: boolean;
  ocultarSiVacio?: boolean;
  etiquetaSeleccion?: string;
  onSeleccionarRecurso?: (recurso: RecursoAsistente) => void;
};

export function RecursosRecomendados({
  titulo = 'Recursos recomendados',
  descripcion = 'Sugerencias generadas según tu rol, institución, grado y contexto académico.',
  tema = '',
  categoriaId,
  categoriaIds,
  gradoEscolarId,
  tipoRecursoId,
  excluirRecursoId,
  limite = 5,
  compacto = false,
  ocultarSiVacio = false,
  etiquetaSeleccion,
  onSeleccionarRecurso,
}: RecursosRecomendadosProps) {
  const navigate = useNavigate();
  const puedeVerRecursos = usuarioTienePermiso(PERMISOS.RECURSOS_VER);
  const [recursos, setRecursos] = useState<RecursoAsistente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!puedeVerRecursos) {
      return;
    }

    cargarRecomendaciones();
  }, [
    puedeVerRecursos,
    tema,
    categoriaId,
    categoriaIds,
    gradoEscolarId,
    tipoRecursoId,
    excluirRecursoId,
    limite,
  ]);

  async function cargarRecomendaciones() {
    try {
      setCargando(true);
      setError('');
      const respuesta = await obtenerRecomendacionesRecursos({
        tema,
        categoriaId,
        categoriaIds,
        gradoEscolarId,
        tipoRecursoId,
        excluirRecursoId,
        limite,
      });
      setRecursos(respuesta.recursos);
    } catch {
      setError('No se pudieron cargar recomendaciones.');
    } finally {
      setCargando(false);
    }
  }

  function abrirRecurso(recurso: RecursoAsistente) {
    navigate(recurso.rutaRepositorio);
  }

  if (!puedeVerRecursos) {
    return null;
  }

  if (ocultarSiVacio && !cargando && (error || recursos.length === 0)) {
    return null;
  }

  return (
    <section
      className={`recommended-resources ${compacto ? 'compact' : ''}`}
      aria-label={titulo}
    >
      <div className="recommended-header">
        <div>
          <span className="section-label">Recomendador académico</span>
          <h2>{titulo}</h2>
          <p>{descripcion}</p>
        </div>
      </div>

      {cargando && (
        <p className="recommended-state">Buscando recursos relacionados...</p>
      )}

      {!cargando && error && <p className="recommended-state error">{error}</p>}

      {!cargando && !error && recursos.length === 0 && (
        <p className="recommended-state">
          No hay recomendaciones disponibles para este contexto.
        </p>
      )}

      {!cargando && !error && recursos.length > 0 && (
        <div className="recommended-list">
          {recursos.map((recurso) => (
            <article className="recommended-card" key={recurso.id}>
              <span>{recurso.tipoRecurso || 'Recurso'}</span>
              <strong>{recurso.titulo}</strong>
              <small>
                {[recurso.categoria, recurso.gradoEscolar]
                  .filter(Boolean)
                  .join(' · ') || 'Disponible en el repositorio'}
              </small>
              {recurso.motivos && recurso.motivos.length > 0 && (
                <em>{recurso.motivos[0]}</em>
              )}
              <div className="recommended-actions">
                <button type="button" onClick={() => abrirRecurso(recurso)}>
                  Ver recurso
                </button>
                {onSeleccionarRecurso && (
                  <button
                    className="recommended-primary-action"
                    type="button"
                    onClick={() => onSeleccionarRecurso(recurso)}
                  >
                    {etiquetaSeleccion || 'Usar recurso'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
