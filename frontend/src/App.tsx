import { Login } from './paginas/login/login';
import { Dashboard } from './paginas/dashboard/dashboard';

function App() {
  const token = localStorage.getItem('token');

  return token ? <Dashboard /> : <Login />;
}

export default App;