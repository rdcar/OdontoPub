import { Link } from 'react-router-dom';
import { User, BookOpen } from 'lucide-react';

export default function ProfessorCard({ professor }) {
    // Parse areas if string
    const getAreas = () => {
        if (!professor.atuacao) return [];
        return professor.atuacao.split(';').map(s => s.trim()).filter(Boolean).slice(0, 3);
    };

    return (
        <Link to={`/professor/${professor.id_professor}`} className="group">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="p-4 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                        {/* Photo Fallback */}
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            <img
                                src={`http://localhost:8000/assets/${professor.nome.toLowerCase().split(' ').join('_')}.jpg`}
                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerHTML = '👤' }}
                                alt={professor.nome}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sky-600 truncate">
                            {professor.categoria}
                        </p>
                        <p className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-sky-700">
                            {professor.nome}
                        </p>
                    </div>
                </div>
                <div className="px-4 pb-4 mt-auto space-y-3">
                    <div className="flex flex-wrap gap-1 mt-2">
                        {getAreas().map((area, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                {area}
                            </span>
                        ))}
                        {getAreas().length === 0 && (
                            <span className="text-xs text-slate-400 italic">Sem área definida</span>
                        )}
                    </div>
                    <div className="pt-2 space-y-2">
                        <div className="flex items-center justify-center w-full py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-sky-600 rounded-lg border border-slate-200 transition-colors shadow-sm">
                            <BookOpen className="w-3 h-3 mr-2" />
                            Publicações
                        </div>

                        {professor.lattes_id && (
                            <a
                                href={`http://lattes.cnpq.br/${professor.lattes_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center w-full py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-sky-700 rounded-lg border border-slate-200 transition-colors"
                            >
                                <span className="mr-1">📄</span> Currículo Lattes
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
