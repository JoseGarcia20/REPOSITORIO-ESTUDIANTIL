import { Component, type ErrorInfo, type ReactNode } from 'react';
import './errorBoundary.css';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  tieneError: boolean;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    tieneError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { tieneError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de interfaz capturado por ErrorBoundary', error, info);
  }

  recargar = () => {
    this.setState({ tieneError: false });
    window.location.reload();
  };

  render() {
    if (this.state.tieneError) {
      return (
        <main className="error-boundary-page">
          <section className="error-boundary-panel">
            <span>NEXORA AI</span>
            <h1>No se pudo cargar esta vista</h1>
            <p>
              La aplicación encontró un problema temporal en la interfaz.
              Puedes recargar para volver a intentarlo.
            </p>
            <button type="button" onClick={this.recargar}>
              Recargar
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
