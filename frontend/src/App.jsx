import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ProfessorDetail from './pages/ProfessorDetail';
import Network from './pages/Network';
import Projects from './pages/Projects';
import Resources from './pages/Resources';
import ImpactDashboard from './pages/ImpactDashboard';
import Support from './pages/Support';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
