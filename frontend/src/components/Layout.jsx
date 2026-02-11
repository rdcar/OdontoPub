import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Network, Home, Sun, Moon, Activity, FolderKanban, Wrench, Mail, Menu, X, BookOpenText } from 'lucide-react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

const navLinks = [
    { to: '/', label: 'Início', icon: Home, color: 'text-sky-500' },
    { to: '/projetos', label: 'Projetos de Pesquisa', icon: FolderKanban, color: 'text-amber-500' },
    { to: '/impacto', label: 'Impacto', icon: Activity, color: 'text-rose-500' },
    { to: '/network', label: 'Rede de Colaboração', icon: Network, color: 'text-sky-500' },
    { to: '/recursos', label: 'Recursos Úteis', icon: Wrench, color: 'text-violet-500' },
    { to: '/suporte', label: 'Suporte', icon: Mail, color: 'text-rose-500' },
];

function LayoutContent({ children }) {
    const { theme, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

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
                            {/* Desktop Nav */}
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {navLinks.map(({ to, label, icon: Icon, color }) => (
                                    <Link
                                        key={to}
                                        to={to}
                                        className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${isActive(to)
                                                ? 'text-slate-900 dark:text-white border-sky-500'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-transparent hover:border-sky-500'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 mr-2 ${color}`} />
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                                aria-label="Toggle Theme"
                            >
                                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </button>
                            {/* Mobile Hamburger */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="sm:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                                aria-label="Toggle Menu"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Panel */}
                <div
                    className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                >
                    <div className="px-4 pb-4 pt-2 space-y-1 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                        {navLinks.map(({ to, label, icon: Icon, color }) => (
                            <Link
                                key={to}
                                to={to}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${isActive(to)
                                        ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${color}`} />
                                {label}
                            </Link>
                        ))}
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
