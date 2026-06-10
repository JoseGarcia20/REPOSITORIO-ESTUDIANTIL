import { AppRoutes } from './rutas/appRoutes';
import { ErrorBoundary } from './componentes/errorBoundary/errorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;
