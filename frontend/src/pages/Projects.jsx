import { useState, useEffect } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, ArrowRight, Search } from 'lucide-react';

export default function Projects() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await api.getProjetos();
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(prof =>
        prof.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-12 text-center text-slate-500">Carregando projetos...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Linhas e Projetos de Pesquisa</h1>
                <p className="opacity-90 max-w-2xl">
                    Explore os projetos de pesquisa em andamento e concluídos, organizados por docente.
                </p>
            </div>

            {/* Filter Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 -mt-6 mx-4 relative z-10">
                <div className="relative max-w-md mx-auto md:mx-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Filtrar por nome do professor..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-8 pt-4">
                {filteredData.map(prof => (
                    <div key={prof.id_professor} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                        {/* Professor Info Column */}
                        <div className="md:w-1/4 bg-slate-50 p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-100">
                            <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-sm overflow-hidden mb-4">
                                <img
                                    src={`http://localhost:8000/assets/${prof.nome.toLowerCase().split(' ').join('_')}.jpg`}
                                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerHTML = '👤' }}
                                    alt={prof.nome}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">{prof.nome}</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-4">{prof.categoria}</p>

                            {prof.linhas_pesquisas && (
                                <div className="mb-6 text-left w-full bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                                        <BookOpen className="w-3 h-3 mr-1" />
                                        Linhas de Pesquisa
                                    </h5>
                                    <div className="flex flex-wrap gap-1.5">
                                        {prof.linhas_pesquisas.split(';').map((line, i) => (
                                            <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-medium leading-tight">
                                                {line.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Link
                                to={`/professor/${prof.id_professor}`}
                                className="mt-auto inline-flex items-center text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline decoration-sky-300 underline-offset-4"
                            >
                                Ver Perfil Completo <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>

                        {/* Projects List Column */}
                        <div className="flex-1 p-6">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                    Projetos de Pesquisa ({prof.projetos.length})
                                </h4>
                            </div>

                            <div className="space-y-3">
                                {prof.projetos.length > 0 ? (
                                    prof.projetos.map((proj, idx) => (
                                        <div key={idx} className="flex gap-4 group hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2">
                                            <div className="flex-shrink-0 pt-0.5">
                                                <span className="flex items-center justify-center px-2.5 py-1 bg-emerald-100/50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-100">
                                                    <Calendar className="w-3 h-3 mr-1 opacity-70" />
                                                    {proj.ano}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-slate-700 text-sm leading-relaxed group-hover:text-slate-900 font-medium transition-colors">
                                                    {proj.titulo}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Nenhum projeto cadastrado.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))
                }

                {filteredData.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-4">🔍</div>
                        <h3 className="text-lg font-medium text-slate-900">Nenhum professor encontrado</h3>
                        <p className="text-slate-500">Tente buscar por outro nome.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
