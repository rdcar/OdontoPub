import { useState, useEffect } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import { Search, Users, FileText, ExternalLink, ChevronDown, ChevronUp, X } from 'lucide-react';

export function NetworkProfessorItem({ prof, isSelected, onSelect }) {
    const [imgError, setImgError] = useState(false);

    return (
        <button
            onClick={onSelect}
            className={`w-full text-left p-3 rounded-xl transition-all ${isSelected
                ? 'bg-sky-100 dark:bg-sky-900/30 ring-2 ring-sky-500 shadow-md'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-600 shadow flex-shrink-0 flex items-center justify-center">
                    {imgError ? (
                        <Users className="w-6 h-6 text-slate-400" />
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
                        ? 'text-sky-900 dark:text-sky-400'
                        : 'text-slate-800 dark:text-slate-200'
                        } truncate`}>
                        {prof.nome}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{prof.categoria}</p>
                </div>
            </div>
        </button>
    );
}

function CollabIconWrapper({ collab }) {
    const [imgError, setImgError] = useState(false);
    return imgError ? (
        <Users className="w-7 h-7 text-slate-400" />
    ) : (
        <img
            src={`http://localhost:8000/assets/${collab.nome.toLowerCase().split(' ').join('_')}.jpg`}
            onError={() => setImgError(true)}
            alt=""
            className="w-full h-full object-cover"
        />
    );
}

export default function Network() {
    const [professors, setProfessors] = useState([]);
    const [selectedProfessor, setSelectedProfessor] = useState(null);
    const [collaborationData, setCollaborationData] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterArea, setFilterArea] = useState("");
    const [expandedCollab, setExpandedCollab] = useState(null);
    const [expandedPub, setExpandedPub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImgError, setSelectedImgError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setSelectedImgError(false);
    }, [selectedProfessor]);

    useEffect(() => {
        api.getProfessores().then(data => {
            setProfessors(data);
            setLoading(false);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedProfessor) {
            setLoading(true);
            api.getCollaborations(selectedProfessor.id_professor)
                .then(data => {
                    setCollaborationData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [selectedProfessor]);

    // Extract unique areas
    const areas = [...new Set(professors.flatMap(p => p.atuacao ? p.atuacao.split(';').map(a => a.trim()) : []))].sort();

    // Filter professors
    const filteredProfessors = professors.filter(p => {
        const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchArea = filterArea ? (p.atuacao && p.atuacao.includes(filterArea)) : true;
        return matchSearch && matchArea;
    });

    return (
        <div className="flex flex-col h-[92vh] space-y-4 animate-diagonal-zoom">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-sky-500 to-cyan-600 dark:from-sky-700 dark:to-cyan-800 rounded-2xl p-6 text-white shadow-lg flex-shrink-0 transition-all">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-2">Rede de Colaboração</h1>
                        <p className="text-sky-100 text-sm leading-relaxed max-w-3xl">
                            Explore as conexões entre os docentes através de suas publicações científicas em coautoria. Selecione um professor no painel à esquerda para visualizar seus colaboradores, o número de publicações compartilhadas e os detalhes de cada artigo em comum.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-sky-200">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                                Selecione um docente
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                                Veja colaboradores e nº de publicações
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                                Expanda para ver artigos e resumos
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Two Panel Layout */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                {/* Left Panel - Professor Selection */}
                <div className="md:w-1/3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-br from-sky-50 to-white dark:from-slate-800 dark:to-slate-800">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-sky-600 dark:text-sky-500" />
                            Selecionar Docente
                        </h2>

                        {/* Search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nome..."
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-colors"
                            value={filterArea}
                            onChange={e => setFilterArea(e.target.value)}
                        >
                            <option value="">Todas as Áreas</option>
                            {areas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    {/* Professor List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-900/50">
                        {filteredProfessors.map(p => (
                            <NetworkProfessorItem
                                key={p.id_professor}
                                prof={p}
                                isSelected={selectedProfessor?.id_professor === p.id_professor}
                                onSelect={() => setSelectedProfessor(p)}
                            />
                        ))}

                        {filteredProfessors.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Nenhum professor encontrado</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Collaboration View */}
                <div className="md:flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
                    {!selectedProfessor ? (
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <div>
                                <div className="w-24 h-24 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-12 h-12 text-sky-600 dark:text-sky-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Rede de Colaboração</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md">
                                    Selecione um docente no painel à esquerda para visualizar suas colaborações e publicações compartilhadas
                                </p>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-slate-500 dark:text-slate-400">Carregando colaborações...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Selected Professor Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-br from-white via-sky-50/30 to-white dark:from-slate-800 dark:via-sky-900/10 dark:to-slate-800 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-600 overflow-hidden ring-4 ring-white dark:ring-slate-600 shadow-lg flex-shrink-0 flex items-center justify-center">
                                        {selectedImgError ? (
                                            <Users className="w-10 h-10 text-slate-400" />
                                        ) : (
                                            <img
                                                src={`http://localhost:8000/assets/${selectedProfessor.nome.toLowerCase().split(' ').join('_')}.jpg`}
                                                onError={() => setSelectedImgError(true)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{selectedProfessor.nome}</h2>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{selectedProfessor.categoria}</p>
                                        <div className="flex gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                <span className="text-slate-600 dark:text-slate-300">
                                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{collaborationData?.total_collaborators || 0}</span> colaboradores
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                                                <span className="text-slate-600 dark:text-slate-300">
                                                    <span className="font-bold text-sky-700 dark:text-sky-400">{collaborationData?.total_shared_publications || 0}</span> pubs colaborativas
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/professor/${selectedProfessor.id_professor}`)}
                                        className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors shadow-sm"
                                    >
                                        Ver Perfil
                                    </button>
                                </div>
                            </div>

                            {/* Collaborators Grid */}
                            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-800">
                                {collaborationData?.collaborators?.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>Nenhuma colaboração encontrada</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {collaborationData?.collaborators?.map(collab => (
                                            <div key={collab.id_professor} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
                                                {/* Collaborator Header */}
                                                <button
                                                    onClick={() => setExpandedCollab(expandedCollab === collab.id_professor ? null : collab.id_professor)}
                                                    className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                                                >
                                                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-600 shadow flex-shrink-0 flex items-center justify-center">
                                                        <CollabIconWrapper collab={collab} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{collab.nome}</h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{collab.categoria}</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full"
                                                                    style={{ width: `${Math.min(100, (collab.shared_count / 10) * 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                                                {collab.shared_count} pub{collab.shared_count > 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {expandedCollab === collab.id_professor ? (
                                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </button>

                                                {/* Publications List */}
                                                {expandedCollab === collab.id_professor && (
                                                    <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-2">
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                                            <FileText className="w-3 h-3" />
                                                            Publicações Compartilhadas ({collab.publications.length})
                                                        </h4>
                                                        {collab.publications.map((pub, idx) => (
                                                            <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-500 transition-colors">
                                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-xs font-semibold rounded">
                                                                                {pub.year}
                                                                            </span>
                                                                        </div>
                                                                        <h5 className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug mb-2">
                                                                            {pub.title}
                                                                        </h5>
                                                                        <div className="flex gap-2 text-xs">
                                                                            {pub.pmid && (
                                                                                <a
                                                                                    href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium hover:underline"
                                                                                >
                                                                                    <ExternalLink className="w-3 h-3" />
                                                                                    PMID: {pub.pmid}
                                                                                </a>
                                                                            )}
                                                                            {pub.doi && (
                                                                                <a
                                                                                    href={`https://doi.org/${pub.doi}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium hover:underline"
                                                                                >
                                                                                    <ExternalLink className="w-3 h-3" />
                                                                                    DOI
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {pub.abstract && (
                                                                        <button
                                                                            onClick={() => setExpandedPub(expandedPub === `${collab.id_professor}-${idx}` ? null : `${collab.id_professor}-${idx}`)}
                                                                            className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors whitespace-nowrap"
                                                                        >
                                                                            {expandedPub === `${collab.id_professor}-${idx}` ? 'Ocultar' : 'Resumo'}
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Abstract Expansion */}
                                                                {pub.abstract && expandedPub === `${collab.id_professor}-${idx}` && (
                                                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                                                            {pub.abstract}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
