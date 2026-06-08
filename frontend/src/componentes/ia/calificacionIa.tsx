import { useState } from 'react';
import {
  crearCalificacionUsoIa,
  type PayloadCalificacionUsoIa,
} from '../../api/adminApi';
import './calificacionIa.css';

type CalificacionIaProps = Omit<PayloadCalificacionUsoIa, 'calificacion' | 'comentario'> & {
  titulo?: string;
  descripcion?: string;
};

export function CalificacionIa({
  titulo = '¿Cómo calificas esta generación con AI?',
  descripcion = 'Tu valoración ayuda a mejorar la calidad del resultado generado.',
  modulo,
  funcionalidad,
  entidadTipo,
  entidadId,
  metadata,
}: CalificacionIaProps) {
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [error, setError] = useState('');

  async function guardar() {
    if (!calificacion || enviando) {
      return;
    }

    try {
      setEnviando(true);
      setError('');
      await crearCalificacionUsoIa({
        modulo,
        funcionalidad,
        entidadTipo,
        entidadId,
        calificacion,
        comentario: comentario.trim() || undefined,
        metadata,
      });
      setEnviada(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar la calificación.',
      );
    } finally {
      setEnviando(false);
    }
  }

  if (enviada) {
    return (
      <div className="ai-rating-card saved">
        <strong>Calificación registrada: {calificacion}/5</strong>
        <span>Gracias, esta valoración queda asociada a esta función con AI.</span>
      </div>
    );
  }

  return (
    <div className="ai-rating-card">
      <div className="ai-rating-copy">
        <strong>{titulo}</strong>
        <span>{descripcion}</span>
      </div>

      <div className="ai-rating-scale" aria-label="Calificación de generación con AI">
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            className={calificacion === valor ? 'active' : ''}
            onClick={() => setCalificacion(valor)}
            aria-pressed={calificacion === valor}
          >
            {valor}
          </button>
        ))}
      </div>

      {calificacion > 0 && (
        <div className="ai-rating-comment">
          <textarea
            value={comentario}
            onChange={(event) => setComentario(event.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="Comentario opcional"
          />
          <button type="button" onClick={guardar} disabled={enviando}>
            {enviando ? 'Guardando...' : 'Enviar'}
          </button>
        </div>
      )}

      {error && <p className="ai-rating-error">{error}</p>}
    </div>
  );
}
