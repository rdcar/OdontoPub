import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { AuthProvider } from './context/AuthContext';

// Public pages
import Home from './pages/Home';
import ProfessorDetail from './pages/ProfessorDetail';
import Network from './pages/Network';
import Projects from './pages/Projects';
import Resources from './pages/Resources';
import ImpactDashboard from './pages/ImpactDashboard';
import Support from './pages/Support';

// Admin pages
import Login from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import ProfessoresManager from './pages/admin/ProfessoresManager';
import PublicacoesManager from './pages/admin/PublicacoesManager';
import DataSync from './pages/admin/DataSync';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="professores" element={<ProfessoresManager />} />
            <Route path="publicacoes" element={<PublicacoesManager />} />
            <Route path="sync" element={<DataSync />} />
          </Route>

          {/* Public Routes with standard layout */}
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/professor/:id" element={<ProfessorDetail />} />
                  <Route path="/projetos" element={<Projects />} />
                  <Route path="/network" element={<Network />} />
                  <Route path="/recursos" element={<Resources />} />
                  <Route path="/impacto" element={<ImpactDashboard />} />
                  <Route path="/suporte" element={<Support />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
