import { Link } from 'react-router-dom';
import { Network, Home, Search } from 'lucide-react';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                                <span className="text-2xl">🦷</span>
                                <span className="font-bold text-xl text-slate-800">OdontoPub</span>
                            </Link>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link to="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-900 border-b-2 border-transparent hover:border-sky-500">
                                    <Home className="w-4 h-4 mr-2" />
                                    Início
                                </Link>
                                <Link to="/projetos" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 hover:text-slate-900 border-b-2 border-transparent hover:border-sky-500">
                                    <span className="mr-2">📚</span>
                                    Projetos de Pesquisa
                                </Link>
                                <Link to="/network" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 hover:text-slate-900 border-b-2 border-transparent hover:border-sky-500">
                                    <Network className="w-4 h-4 mr-2" />
                                    Rede de Colaboração
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
