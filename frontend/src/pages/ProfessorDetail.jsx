import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { ChevronDown, ChevronUp, BookOpen, User, ArrowLeft, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProfessorDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const res = await api.getProfessorById(id);
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando perfil...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Erro ao carregar perfil.</div>;

    return (
        <div className="flex flex-col space-y-8 animate-diagonal-zoom">
            <Link to="/" className="inline-flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar para lista
            </Link>

            {/* Header Profile */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 flex flex-col md:flex-row gap-8 items-start transition-colors">
                <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-slate-50 dark:border-slate-600 overflow-hidden shadow-inner flex-shrink-0 flex items-center justify-center">
                    {imgError ? (
                        <User className="w-16 h-16 text-slate-400" />
                    ) : (
                        <img
                            src={`http://localhost:8000/assets/${data.nome.toLowerCase().split(' ').join('_')}.jpg`}
                            onError={() => setImgError(true)}
                            alt={data.nome}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
                <div className="flex-1 space-y-4">
                    <div>
                        <span className="inline-block px-2 py-1 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-semibold rounded uppercase tracking-wide">
                            {data.categoria}
                        </span>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{data.nome}</h1>
                    </div>

                    {/* Areas */}
                    {data.atuacao && (
                        <div className="flex flex-wrap gap-2">
                            {data.atuacao.split(';').map((a, i) => (
                                <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm">
                                    {a.trim()}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Lattes Button */}
                    {data.lattes_id && (
                        <div className="pt-2">
                            <a
                                href={`http://lattes.cnpq.br/${data.lattes_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-sky-700 dark:hover:text-sky-300 transition w-full md:w-auto justify-center"
                            >
                                <FileText className="w-4 h-4 mr-2 text-slate-400" /> Ver Currículo Lattes
                            </a>
                        </div>
                    )}

                    {/* Research Lines */}
                    {data.linhas_pesquisas && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2 flex items-center">
                                <BookOpen className="w-4 h-4 mr-2 text-sky-500" />
                                Linhas de Pesquisa
                            </h3>
                            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                {data.linhas_pesquisas.split(';').map((l, i) => (
                                    <li key={i}>{l.trim()}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats (Simplified for now) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Total Publicações</div>
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{data.total_publicacoes}</div>
                </div>
                {/* Add more stats later */}
            </div>

            {/* Publications Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Produção por Ano</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(data.publicacoes.reduce((acc, pub) => {
                            const year = pub.ano || 'ND';
                            acc[year] = (acc[year] || 0) + 1;
                            return acc;
                        }, {})).map(([year, count]) => ({ year, count })).sort((a, b) => a.year - b.year)}>
                            <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} stroke="#94a3b8" />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: 'var(--tw-prose-invert-lead)' }} // Simplified cursor color
                            />
                            <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Publicações" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Publications List */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                    Publicações ({data.publicacoes.length})
                </h2>

                <div className="space-y-4">
                    {data.publicacoes.map((pub) => (
                        <PublicationItem key={pub.pmid} pub={pub} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function PublicationItem({ pub }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <div className="flex gap-4">
                <div className="flex-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{pub.ano} • {pub.revista}</div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{pub.titulo}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">{pub.autores}</p>

                    <div className="flex gap-3 mt-3 text-sm">
                        {pub.doi !== 'N/A' && (
                            <a href={`https://doi.org/${pub.doi}`} target="_blank" className="text-sky-600 dark:text-sky-400 hover:underline">DOI ↗</a>
                        )}
                        <a href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`} target="_blank" className="text-sky-600 dark:text-sky-400 hover:underline">PubMed ↗</a>

                        {pub.abstract && pub.abstract !== 'N/A' && (
                            <button
                                onClick={() => setOpen(!open)}
                                className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 ml-auto"
                            >
                                {open ? "Ocultar Resumo" : "Ver Resumo"}
                                {open ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {open && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded">
                    {pub.abstract}
                </div>
            )}
        </div>
    )
}
