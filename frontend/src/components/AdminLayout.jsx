import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  
  return children;
};

const AdminSidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const links = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Professores', icon: Users, path: '/admin/professores' },
    { name: 'Publicações', icon: BookOpen, path: '/admin/publicacoes' },
    { name: 'Sincronizar PubMed', icon: RefreshCw, path: '/admin/sync' },
  ];

  return (
    <div className="w-64 bg-gray-900 min-h-screen flex flex-col text-gray-300">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Admin Panel</h2>
        <div className="h-1 w-12 bg-blue-500 rounded"></div>
      </div>
      <nav className="flex-1 mt-6">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path || (link.path !== '/admin' && location.pathname.startsWith(link.path));
          return (
            <Link 
              key={link.name} 
              to={link.path}
              className={`flex items-center px-6 py-3 transition-colors ${
                isActive ? 'bg-gray-800 text-blue-400 border-l-4 border-blue-500' : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-6">
        <button 
          onClick={logout}
          className="flex items-center text-gray-400 hover:text-red-400 transition-colors w-full"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

export const AdminLayout = () => {
  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-gray-50 font-sans">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </RequireAuth>
  );
};
