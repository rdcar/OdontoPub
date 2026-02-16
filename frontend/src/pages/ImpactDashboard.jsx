
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { BarChart, PieChart, Activity, BookOpen, TrendingUp, Info, Users } from 'lucide-react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
} from 'chart.js';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title
);

export default function ImpactDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showInfo, setShowInfo] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        ano: '',
        atuacao: ''
    });

    useEffect(() => {
        loadStats();
    }, [filters]); // Reload when filters change

    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getStats(filters);
            setStats(data);
        } catch (error) {
            console.error("Error loading stats:", error);
            setError("Não foi possível carregar as estatísticas de impacto.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const clearFilters = () => {
        setFilters({ ano: '', atuacao: '' });
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Carregando dados de impacto...</div>;

    if (error) return (
        <div className="p-12 text-center space-y-4">
            <div className="text-rose-500 font-bold">{error}</div>
            <button
                onClick={loadStats}
                className="px-6 py-2 bg-sky-500 text-white rounded-xl shadow-md hover:bg-sky-600 transition-all font-bold"
            >
                Tentar Novamente
            </button>
        </div>
    );

    if (!stats) return null;

    // --- Data Preparation for Charts ---

    // 1. Qualis Distribution (Pie Chart)
    const qualisData = {
        labels: Object.keys(stats.qualis_distribution || {}),
        datasets: [
            {
                label: '# de Artigos',
                data: Object.values(stats.qualis_distribution || {}),
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)', // A1 - Emerald 500
                    'rgba(52, 211, 153, 0.8)', // A2 - Emerald 400
                    'rgba(110, 231, 183, 0.8)', // A3 - Emerald 300
                    'rgba(167, 243, 208, 0.8)', // A4 - Emerald 200
                    'rgba(251, 191, 36, 0.8)',  // B1 - Amber 400
                    'rgba(252, 211, 77, 0.8)',  // B2 - Amber 300
                    'rgba(253, 230, 138, 0.8)', // B3 - Amber 200
                    'rgba(254, 243, 199, 0.8)', // B4 - Amber 100
                    'rgba(203, 213, 225, 0.8)', // N/A - Slate 300
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(52, 211, 153, 1)',
                    'rgba(110, 231, 183, 1)',
                    'rgba(167, 243, 208, 1)',
                    'rgba(251, 191, 36, 1)',
                    'rgba(252, 211, 77, 1)',
                    'rgba(253, 230, 138, 1)',
                    'rgba(254, 243, 199, 1)',
                    'rgba(203, 213, 225, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // 2. Top Journals (Bar Chart)
    // Assuming backend sends `top_journals` as { "Journal Name": count, ... }
    const topJournalsLabels = Object.keys(stats.top_journals || {}).slice(0, 10);
    const topJournalsData = Object.values(stats.top_journals || {}).slice(0, 10);

    const journalsData = {
        labels: topJournalsLabels,
        datasets: [
            {
                label: 'Artigos Publicados',
                data: topJournalsData,
                backgroundColor: 'rgba(56, 189, 248, 0.6)', // Sky 400
                borderColor: 'rgba(56, 189, 248, 1)',
                borderWidth: 1,
            },
        ],
    };

    // 3. Evolution (Line Chart - Mock data if not available in stats yet, or use `publications_by_year` if mapped)
    // Ideally update backend to send `qualis_evolution`
    // For now, let's just show total publications by year as a proxy for "production evolution"
    const years = Object.keys(stats.publications_by_year || {}).sort();
    const evolutionData = {
        labels: years,
        datasets: [
            {
                label: 'Total de Publicações',
                data: years.map(y => stats.publications_by_year[y]),
                borderColor: 'rgb(99, 102, 241)', // Indigo 500
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                tension: 0.3,
            },
        ]
    };

    // 3. Top Researchers (Bar Chart)
    const topResearchersLabels = Object.keys(stats.top_researchers || {}).slice(0, 15);
    const topResearchersData = Object.values(stats.top_researchers || {}).slice(0, 15);

    const researchersData = {
        labels: topResearchersLabels,
        datasets: [
            {
                label: 'Total de Publicações',
                data: topResearchersData,
                backgroundColor: 'rgba(99, 102, 241, 0.6)', // Indigo 400
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="space-y-8 animate-diagonal-zoom pb-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Estatísticas de Impacto</h1>
                        <p className="text-emerald-50 text-sm leading-relaxed">
                            Análise quantitativa e qualitativa da produção científica do DOD/UFRN.
                        </p>
                    </div>
                </div>
            </div>

            {/* Educational Section (Expandable) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="w-full flex items-center justify-between text-left focus:outline-none"
                >
                    <div className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-sky-500" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                            Entenda o Qualis/CAPES
                        </h2>
                    </div>
                    <span className="text-sm text-sky-500 font-semibold">
                        {showInfo ? 'Ocultar Informações' : 'Saiba Mais'}
                    </span>
                </button>

                {showInfo && (
                    <div className="mt-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-4 border-t border-slate-100 dark:border-slate-700 pt-4 animate-fadeIn">
                        <p>
                            As categorias do <strong>Qualis CAPES</strong> classificam periódicos científicos em níveis que refletem sua qualidade, impacto e visibilidade na comunidade acadêmica. O sistema atual (quadriênio 2021–2024) utiliza uma estrutura de 9 categorias principais:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <strong className="text-emerald-600 dark:text-emerald-400 block mb-1">A1 – Excelência Internacional</strong>
                                Revistas com alto impacto global, indexadas em bases como Scopus/WoS, com revisão por pares rigorosa. Equivalentes a Q1/Q2.
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <strong className="text-emerald-500 dark:text-emerald-300 block mb-1">A2 – Alta Qualidade</strong>
                                Impacto significativo, ligeiramente inferior ao A1. Geralmente correspondem a Q1/Q2.
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <strong className="text-emerald-400 dark:text-emerald-200 block mb-1">A3 e A4 – Qualidade Consolidada</strong>
                                Reconhecimento nacional/regional e perfil científico consistente. A4 pode corresponder a Q3/Q4.
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <strong className="text-amber-500 dark:text-amber-400 block mb-1">B1 a B4 – Intermediária</strong>
                                Atendem aos mínimos de publicação científica. Importantes para pesquisas locais ou setoriais.
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 italic mt-2">
                            * A CAPES está em transição para um novo modelo (2025–2028) focado em métricas individuais de artigos.
                        </p>
                    </div>
                )}
            </div>

            {/* Charts Grid - Top Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 1. Qualis Distribution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <PieChart className="w-4 h-4" /> Distribuição por Qualis
                    </h3>
                    <div className="h-64 flex justify-center">
                        <Pie data={qualisData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                {/* 2. Evolution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Evolução da Produção
                    </h3>
                    <div className="h-64">
                        <Line data={evolutionData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
                    </div>
                </div>
            </div>

            {/* Filter Bar for Detailed Analysis */}
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-sky-500" />
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Análise Detalhada</h3>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 uppercase tracking-tight">Filtre os rankings abaixo por ano e área</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                        <label className="text-base font-bold text-slate-500">Ano:</label>
                        <select
                            name="ano"
                            value={filters.ano}
                            onChange={handleFilterChange}
                            className="text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none transition-all cursor-pointer text-slate-700 dark:text-slate-200 shadow-sm w-full sm:w-auto"
                        >
                            <option value="">Todos os Anos</option>
                            {stats.available_years?.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                        <label className="text-sm font-bold text-slate-500">Área:</label>
                        <select
                            name="atuacao"
                            value={filters.atuacao}
                            onChange={handleFilterChange}
                            className="text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none transition-all cursor-pointer text-slate-700 dark:text-slate-200 shadow-sm min-w-[150px] w-full sm:w-auto"
                        >
                            <option value="">Todas as Áreas</option>
                            {stats.available_areas?.map(area => (
                                <option key={area} value={area}>{area}</option>
                            ))}
                        </select>
                    </div>

                    {(filters.ano || filters.atuacao) && (
                        <button
                            onClick={clearFilters}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline px-2 transition-all"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Row - Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 3. Top Researchers */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Principais Pesquisadores
                    </h3>
                    <div className="h-80 sm:h-64">
                        <Bar
                            data={researchersData}
                            options={{
                                maintainAspectRatio: false,
                                indexAxis: 'y',
                                plugins: {
                                    legend: { display: false },
                                    tooltip: { callbacks: { title: (items) => items[0]?.label || '' } }
                                },
                                scales: {
                                    x: { beginAtZero: true },
                                    y: { ticks: { callback: function (value) { const label = this.getLabelForValue(value); return label.length > 20 ? label.substring(0, 18) + '…' : label; } } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* 4. Top Journals */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Principais Periódicos
                    </h3>
                    <div className="h-80 sm:h-64">
                        <Bar
                            data={journalsData}
                            options={{
                                maintainAspectRatio: false,
                                indexAxis: 'y',
                                plugins: {
                                    legend: { display: false },
                                    tooltip: { callbacks: { title: (items) => items[0]?.label || '' } }
                                },
                                scales: {
                                    x: { beginAtZero: true },
                                    y: { ticks: { callback: function (value) { const label = this.getLabelForValue(value); return label.length > 20 ? label.substring(0, 18) + '…' : label; } } }
                                }
                            }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
