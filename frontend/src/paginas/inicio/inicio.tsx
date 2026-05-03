export function Inicio() {
  const usuarioGuardado = localStorage.getItem('usuario');
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  const logo = usuario?.institucion?.logo
    ? `http://localhost:3000${usuario.institucion.logo}`
    : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      color: '#1f2a44',
    }}>
      <div style={{
        width: '140px',
        height: '140px',
        borderRadius: '32px',
        background: '#ffffff',
        border: '2px dashed #cdd7ef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        overflow: 'hidden',
      }}>
        {logo ? (
          <img
            src={logo}
            alt="Logo institución"
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '16px' }}
          />
        ) : (
          <span style={{ color: '#9aa8c7', fontWeight: 700, fontSize: '20px' }}>Logo</span>
        )}
      </div>

      <h1 style={{ margin: '0 0 8px', fontSize: '28px' }}>
        {usuario?.institucion?.nombre || 'Plataforma Estudiantil'}
      </h1>
      <p style={{ color: '#7b8499', fontSize: '15px', margin: 0 }}>
        Selecciona un módulo del menú lateral para comenzar.
      </p>
    </div>
  );
}