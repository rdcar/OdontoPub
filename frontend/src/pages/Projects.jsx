import { useState, useEffect } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, ArrowRight, Search, Users, FileText, FolderKanban } from 'lucide-react';

// Professor List Item Component
function ProfessorListItem({ prof, isSelected, onSelect }) {
    const [imgError, setImgError] = useState(false);

    return (
        <button
            onClick={onSelect}
            className={`w-full text-left p-3 rounded-xl transition-all ${isSelected
                ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-600 shadow-sm flex-shrink-0 flex items-center justify-center">
                    {imgError ? (
                        <Users className="w-5 h-5 text-slate-400" />
                    ) : (
                        <img
                            src={`http://localhost:8000/assets/${prof.nome.toLowerCase().split(' ').join('_')}.jpg`}
                            onError={() => setImgError(true)}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm ${isSelected
                        ? 'text-emerald-900 dark:text-emerald-400'
                        : 'text-slate-800 dark:text-slate-200'
                        } truncate`}>
                        {prof.nome}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">{prof.categoria}</p>
                </div>
            </div>
        </button>
    );
}

export default function Projects() {
    const [professorsData, setProfessorsData] = useState([]);
    const [selectedProfessor, setSelectedProfessor] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedImgError, setSelectedImgError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    // Reset selected image error when selected professor changes
    useEffect(() => {
        setSelectedImgError(false);
    }, [selectedProfessor]);

    const loadData = async () => {
        try {
            const res = await api.getProjetos();
            setProfessorsData(res);
            // Pre-select first professor if available
            if (res.length > 0) {
                setSelectedProfessor(res[0]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredProfessors = professorsData.filter(prof =>
        prof.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-12 text-center text-slate-500">Carregando projetos...</div>;

    return (
        <div className="flex flex-col h-[92vh] space-y-4 animate-diagonal-zoom">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-2xl p-6 text-white shadow-lg flex-shrink-0 transition-all">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-2">Linhas e Projetos de Pesquisa</h1>
                        <p className="text-emerald-50 text-sm leading-relaxed max-w-3xl">
                            Explore as linhas de pesquisa e os projetos científicos em andamento ou concluídos de cada docente. Selecione um professor no painel à esquerda para detalhar suas frentes de investigação e histórico de projetos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content - Two Panel Layout */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                {/* Left Panel - Professor Selection */}
                <div className="md:w-1/3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-800">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                            Docentes
                        </h2>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por professor..."
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Professor List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-900/50">
                        {filteredProfessors.map(prof => (
                            <ProfessorListItem
                                key={prof.id_professor}
                                prof={prof}
                                isSelected={selectedProfessor?.id_professor === prof.id_professor}
                                onSelect={() => setSelectedProfessor(prof)}
                            />
                        ))}

                        {filteredProfessors.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Nenhum docente encontrado</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Context View */}
                <div className="md:flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
                    {!selectedProfessor ? (
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <div>
                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Projetos de Pesquisa</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-xs text-sm">
                                    Selecione um docente à esquerda para visualizar sua produção científica e linhas de pesquisa.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Selected Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-br from-white via-emerald-50/20 to-white dark:from-slate-800 dark:via-emerald-900/10 dark:to-slate-800 flex-shrink-0 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-700 overflow-hidden ring-4 ring-white dark:ring-slate-600 shadow flex-shrink-0 flex items-center justify-center">
                                            {selectedImgError ? (
                                                <Users className="w-8 h-8 text-slate-400" />
                                            ) : (
                                                <img
                                                    src={`http://localhost:8000/assets/${selectedProfessor.nome.toLowerCase().split(' ').join('_')}.jpg`}
                                                    onError={() => setSelectedImgError(true)}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-0.5">{selectedProfessor.nome}</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">{selectedProfessor.categoria}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/professor/${selectedProfessor.id_professor}`)}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
                                    >
                                        Ver Perfil
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-slate-800">
                                {/* Research Lines */}
                                {selectedProfessor.linhas_pesquisas && (
                                    <section>
                                        <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                                            Linhas de Pesquisa
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProfessor.linhas_pesquisas.split(';').map((line, i) => (
                                                <div key={i} className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-medium">
                                                    {line.trim()}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Projects */}
                                <section>
                                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                                        Projetos Científicos ({selectedProfessor.projetos.length})
                                    </h4>

                                    <div className="space-y-4">
                                        {selectedProfessor.projetos.length > 0 ? (
                                            selectedProfessor.projetos.map((proj, idx) => (
                                                <div key={idx} className="bg-white dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-colors flex gap-4 text-left group">
                                                    <div className="flex-shrink-0">
                                                        <div className="flex flex-col items-center justify-center p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg min-w-[60px] border border-emerald-100 dark:border-emerald-800">
                                                            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{proj.ano}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                                                            {proj.titulo}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                                                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                                <p className="text-slate-400 dark:text-slate-500 text-sm">Nenhum projeto registrado no SIGAA para este docente.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
