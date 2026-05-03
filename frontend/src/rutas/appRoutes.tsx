import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../paginas/login/login';
import { AppLayout } from '../componentes/layout/appLayout';
import { Inicio } from '../paginas/inicio/inicio';
import { Instituciones } from '../paginas/instituciones/instituciones';

export function AppRoutes() {
  const token = localStorage.getItem('token');

  if (!token) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/admin/instituciones" element={<Instituciones />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}