import { useState, useEffect } from 'react';
import { api } from '../api';
import ProfessorCard from '../components/ProfessorCard';
import { Search } from 'lucide-react';

export default function Home() {
    const [professores, setProfessores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [term, setTerm] = useState("");
    const [filterArea, setFilterArea] = useState("");
    const [filterLine, setFilterLine] = useState("");

    useEffect(() => {
        loadProfessores();
    }, []);

    const loadProfessores = async () => {
        try {
            const data = await api.getProfessores();
            setProfessores(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <div className="space-y-8">
            {/* Hero / Warning Section */}
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Produção Científica - Odontologia UFRN</h1>
                <p className="opacity-90 max-w-2xl">
                    Visualize a produção acadêmica, identifique linhas ou projetos de pesquisa e explore a rede de colaboração do nosso departamento de forma centralizada e rápida.
                    <br />
                    Navegue pelos cards para acessar a produção científica de cada docente.
                </p>
            </div>

            {/* Info Disclosure */}
            <details className="group bg-amber-50 rounded-xl border border-amber-100 overflow-hidden open:shadow-sm transition-all open:bg-white open:border-slate-200">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-amber-700 font-medium hover:bg-amber-100/50 transition-colors group-open:text-slate-700 group-open:bg-slate-50">
                    <div className="flex items-center gap-2">
                        <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">?</span>
                        <span>Não encontrou o que procura?</span>
                    </div>
                    <span className="text-xl transition-transform group-open:rotate-180 text-amber-500 group-open:text-slate-400">⌄</span>
                </summary>
                <div className="p-4 pt-2 text-sm text-slate-600 bg-white border-t border-slate-100 leading-relaxed">
                    <p>
                        Esta base é alimentada via <strong>PubMed/MEDLINE</strong> e <strong>SIGAA/Lattes</strong>.
                        Publicações sem DOI <em>(Digital Object Identifier)</em> ou não indexadas em periódicos internacionais podem não aparecer automaticamente aqui no OdontoPub.
                    </p>
                    <p className="mt-2">
                        Para uma lista completa e oficial, recomendamos sempre consultar diretamente o <strong>Currículo Lattes</strong> do docente, acessível através do botão disponível em cada card.
                    </p>
                </div>
            </details>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-all"
                        placeholder="Buscar por nome..."
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                    />
                </div>

                {/* Area Filter */}
                <select
                    className="block w-full md:w-48 pl-3 pr-8 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    value={filterArea}
                    onChange={(e) => setFilterArea(e.target.value)}
                >
                    <option value="">Todas as Áreas</option>
                    {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>

                {/* Research Line Filter */}
                <select
                    className="block w-full md:w-64 pl-3 pr-8 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm truncate"
                    value={filterLine}
                    onChange={(e) => setFilterLine(e.target.value)}
                >
                    <option value="">Todas as Linhas de Pesquisa</option>
                    {uniqueLines.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12 text-slate-500">Carregando dados...</div>
            ) : (
                <>
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-lg font-semibold text-slate-700">Docentes ({filtered.length})</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map(prof => (
                            <ProfessorCard key={prof.id_professor} professor={prof} />
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-slate-400 italic">
                            Nenhum docente encontrado para "{term}"
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
