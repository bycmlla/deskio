import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import AbrirChamado from './pages/public/AbrirChamado/AbrirChamado';
import Confirmacao from './pages/public/Confirmacao/Confirmacao';
import DetalhesChamado from './pages/public/DetalhesChamado/DetalhesChamado';
import ListaChamados from './pages/public/ListaChamados/ListaChamados';

import Login from './pages/admin/Login/Login';
import Dashboard from './pages/admin/Dashboard/Dashboard';
import ListaChamadosAdmin from './pages/admin/ListaChamadosAdmin/ListaChamadosAdmin';
import DetalhesChamadoAdmin from './pages/admin/DetalhesChamadoAdmin/DetalhesChamadoAdmin';
import Setores from './pages/admin/Setores/Setores';

function PrivateRoute({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/admin/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { usuario } = useAuth();
  return !usuario ? children : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<AbrirChamado />} />
          <Route path="/chamado/confirmacao/:protocolo" element={<Confirmacao />} />
          <Route path="/chamado/:protocolo" element={<DetalhesChamado />} />
          <Route path="/chamados" element={<ListaChamados />} />

          <Route path="/admin/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/admin" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/admin/chamados" element={<PrivateRoute><ListaChamadosAdmin /></PrivateRoute>} />
          <Route path="/admin/chamados/:id" element={<PrivateRoute><DetalhesChamadoAdmin /></PrivateRoute>} />
          <Route path="/admin/setores" element={<PrivateRoute><Setores /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}