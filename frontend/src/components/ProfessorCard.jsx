import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, BookOpen, FileText } from 'lucide-react';

export default function ProfessorCard({ professor }) {
    const [imgError, setImgError] = useState(false);

    // Parse areas if string
    const getAreas = () => {
        if (!professor.atuacao) return [];
        return professor.atuacao.split(';').map(s => s.trim()).filter(Boolean).slice(0, 3);
    };

    return (
        <Link to={`/professor/${professor.id_professor}`} className="group">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="p-4 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                        {/* Photo Fallback */}
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600">
                            {imgError ? (
                                <User className="w-8 h-8 text-slate-400" />
                            ) : (
                                <img
                                    src={`http://localhost:8000/assets/${professor.nome.toLowerCase().split(' ').join('_')}.jpg`}
                                    onError={() => setImgError(true)}
                                    alt={professor.nome}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sky-600 dark:text-sky-400 truncate">
                            {professor.categoria}
                        </p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-sky-700 dark:group-hover:text-sky-400">
                            {professor.nome}
                        </p>
                    </div>
                </div>
                <div className="px-4 pb-4 mt-auto space-y-3">
                    <div className="flex flex-wrap gap-1 mt-2">
                        {getAreas().map((area, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                {area}
                            </span>
                        ))}
                        {getAreas().length === 0 && (
                            <span className="text-xs text-slate-400 italic">Sem área definida</span>
                        )}
                    </div>
                    <div className="pt-2 space-y-2">
                        <div className="flex items-center justify-center w-full py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors shadow-sm">
                            <BookOpen className="w-3 h-3 mr-2 text-sky-500" />
                            Publicações
                        </div>

                        {professor.lattes_id && (
                            <a
                                href={`http://lattes.cnpq.br/${professor.lattes_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center w-full py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-sky-700 dark:hover:text-sky-300 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                            >
                                <FileText className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                Currículo Lattes
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
