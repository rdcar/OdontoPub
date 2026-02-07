import { Link } from 'react-router-dom';
import { Network, Home, Search, Sun, Moon, Sparkles, FolderKanban, Wrench, Mail, Activity, BookOpenText } from 'lucide-react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function LayoutContent({ children }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                                <BookOpenText className="w-8 h-8 text-sky-500" />
                                <span className="font-bold text-xl text-slate-800 dark:text-white">OdontoPub</span>
                            </Link>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link to="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-900 dark:text-slate-100 border-b-2 border-transparent hover:border-sky-500">
                                    <Home className="w-4 h-4 mr-2 text-sky-500" />
                                    Início
                                </Link>
                                <Link to="/projetos" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-b-2 border-transparent hover:border-sky-500">
                                    <FolderKanban className="w-4 h-4 mr-2 text-emerald-500" />
                                    Projetos de Pesquisa
                                </Link>
                                <Link to="/recursos" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-b-2 border-transparent hover:border-sky-500">
                                    <Wrench className="w-4 h-4 mr-2 text-violet-500" />
                                    Recursos Úteis
                                </Link>
                                <Link to="/network" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-b-2 border-transparent hover:border-sky-500">
                                    <Network className="w-4 h-4 mr-2 text-sky-500" />
                                    Rede de Colaboração
                                </Link>
                                <Link to="/contato" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-b-2 border-transparent hover:border-sky-500">
                                    <Mail className="w-4 h-4 mr-2 text-rose-500" />
                                    Contato
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                                aria-label="Toggle Theme"
                            >
                                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </button>
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

export default function Layout({ children }) {
    return (
        <ThemeProvider>
            <LayoutContent>{children}</LayoutContent>
        </ThemeProvider>
    );
}
