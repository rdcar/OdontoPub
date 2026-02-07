import { useState, useEffect } from 'react';
import { api } from '../api';
import ProfessorCard from '../components/ProfessorCard';
import { Search, BookOpenText, FileText, Users } from 'lucide-react';

export default function Home() {
    const [professores, setProfessores] = useState([]);
    const [stats, setStats] = useState({ total_publicacoes: 0 });
    const [loading, setLoading] = useState(true);
    const [term, setTerm] = useState("");
    const [filterArea, setFilterArea] = useState("");
    const [filterLine, setFilterLine] = useState("");

    const [pubSearch, setPubSearch] = useState("");
    const [pubResults, setPubResults] = useState([]);
    const [pubLoading, setPubLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profData, statsData] = await Promise.all([
                api.getProfessores(),
                api.getStats()
            ]);
            setProfessores(profData);
            setStats(statsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Effect for publication search with debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (pubSearch.length >= 2) {
                setPubLoading(true);
                try {
                    const results = await api.searchPublications(pubSearch);
                    setPubResults(results);
                } catch (e) {
                    console.error(e);
                } finally {
                    setPubLoading(false);
                }
            } else {
                setPubResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [pubSearch]);

    // Extract unique options
    const uniqueAreas = [...new Set(professores.flatMap(p => p.atuacao ? p.atuacao.split(';').map(s => s.trim()) : []))].sort();
    const uniqueLines = [...new Set(professores.flatMap(p => p.linhas_pesquisas ? p.linhas_pesquisas.split(';').map(s => s.trim()) : []))].sort();

    const filtered = professores.filter(p => {
        const matchTerm = p.nome.toLowerCase().includes(term.toLowerCase()) ||
            (p.atuacao && p.atuacao.toLowerCase().includes(term.toLowerCase()));
        const matchArea = filterArea ? (p.atuacao && p.atuacao.includes(filterArea)) : true;
        const matchLine = filterLine ? (p.linhas_pesquisas && p.linhas_pesquisas.includes(filterLine)) : true;

        return matchTerm && matchArea && matchLine;
    });

    if (loading) return <div className="p-12 text-center text-slate-500">Carregando dados...</div>;

    return (
        <div className="flex flex-col space-y-8 animate-diagonal-zoom">
            {/* Hero / Warning Section */}
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden flex-shrink-0">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BookOpenText className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex flex-1 flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">Produção Científica - Odontologia UFRN</h1>
                            <p className="text-sky-50 text-sm leading-relaxed max-w-2xl">
                                Visualize a produção acadêmica, identifique linhas ou projetos de pesquisa e explore a rede de colaboração do nosso departamento.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col items-center justify-center min-w-[160px]">
                            <span className="text-sky-100 text-[10px] uppercase font-bold tracking-widest mb-1">Total Produção</span>
                            <span className="text-3xl font-black text-white">{stats.total_publicacoes}</span>
                            <span className="text-sky-200 text-xs">Artigos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Double Search Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Professor Filters */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-4 transition-colors">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-4 h-4" /> Buscar Docentes
                    </h3>
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                placeholder="Nome ou área..."
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="block w-full md:w-32 pl-3 pr-8 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-xs focus:ring-2 focus:ring-sky-500 transition-all truncate text-slate-900 dark:text-slate-100"
                            value={filterArea}
                            onChange={(e) => setFilterArea(e.target.value)}
                        >
                            <option value="">Áreas</option>
                            {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>

                {/* Global Publication Search */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-4 transition-colors">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Buscar Publicações
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                            placeholder="Título, autor, pmid, doi, revista..."
                            value={pubSearch}
                            onChange={(e) => setPubSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="space-y-8 pb-12">
                {/* Publication Results (Shown only when searching) */}
                {pubSearch.length >= 2 && (
                    <div className="animate-diagonal-zoom">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 px-2 flex items-center justify-between">
                            Artigos Encontrados
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{pubResults.length} resultados</span>
                        </h2>

                        {pubLoading ? (
                            <div className="text-center py-8 text-slate-400">Buscando artigos...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pubResults.length > 0 ? (
                                    pubResults.map(pub => (
                                        <div key={pub.pmid} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group">
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 px-2 py-0.5 rounded uppercase">{pub.revista}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">{pub.ano}</span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors mb-2 line-clamp-2">
                                                {pub.titulo}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">{pub.autores}</p>
                                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50 dark:border-slate-700">
                                                <div className="flex gap-2 text-[10px]">
                                                    <a href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`} target="_blank" className="text-sky-600 dark:text-sky-400 font-bold hover:underline">PMID</a>
                                                    {pub.doi && pub.doi !== 'N/A' && (
                                                        <a href={`https://doi.org/${pub.doi}`} target="_blank" className="text-sky-600 dark:text-sky-400 font-bold hover:underline">DOI</a>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400 italic">via {pub.professor_name ? pub.professor_name.split(' ')[0] : '...'}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="md:col-span-2 text-center py-8 text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        Nenhuma publicação corresponde à sua busca.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Docentes Results */}
                {pubSearch.length < 2 && (
                    <div className="animate-diagonal-zoom">
                        <div className="flex justify-between items-center px-2 mb-4">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Docentes em Destaque</h2>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{filtered.length} encontrados</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filtered.map(prof => (
                                <ProfessorCard key={prof.id_professor} professor={prof} />
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className="text-center py-12 text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                Nenhum docente encontrado para "{term}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
