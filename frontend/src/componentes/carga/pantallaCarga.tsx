import './pantallaCarga.css';

type PantallaCargaProps = {
  mensaje?: string;
  detalle?: string;
  modo?: 'pantalla' | 'panel' | 'compacto';
};

const LOGO_NEXORA = '/logo-solo.png';

export function PantallaCarga({
  mensaje = 'Preparando experiencia',
  detalle = 'Estamos cargando la información de NEXORA AI.',
  modo = 'pantalla',
}: PantallaCargaProps) {
  return (
    <div className={`nexora-loading nexora-loading-${modo}`} role="status">
      <div className="nexora-loading-card">
        <div className="nexora-loading-brand">
          <div className="nexora-loading-logo">
            <img src={LOGO_NEXORA} alt="NEXORA AI" />
          </div>
          <div>
            <span>NEXORA</span>
            <strong>AI</strong>
          </div>
        </div>

        <div className="nexora-loading-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="nexora-loading-copy">
          <h1>{mensaje}</h1>
          <p>{detalle}</p>
        </div>

        <div className="nexora-loading-bar" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
