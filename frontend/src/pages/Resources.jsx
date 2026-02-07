import { ExternalLink, Calculator, PenTool, Database, FileText, Wrench } from 'lucide-react';

export default function Resources() {
    return (
        <div className="flex flex-col space-y-8 animate-diagonal-zoom">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 dark:from-violet-700 dark:to-purple-800 rounded-2xl p-6 text-white shadow-lg flex-shrink-0 transition-all">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-2">Recursos Úteis</h1>
                        <p className="text-violet-50 text-sm leading-relaxed max-w-3xl">
                            Uma coleção curada de ferramentas essenciais para o pesquisador. Acesse bases de dados, softwares estatísticos, gerenciadores de referência e guias de normalização.
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid of Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">

                {/* Buscas e Acesso à Literatura */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Database className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        Buscas e Acesso à Literatura
                    </h2>
                    <div className="grid gap-4">
                        <ResourceCard
                            title="Periódicos CAPES"
                            description="Portal brasileiro de acesso a bases como PubMed, Scopus e Web of Science."
                            link="https://www.periodicos.capes.gov.br/"
                        />
                        <ResourceCard
                            title="BVS Odontologia"
                            description="Biblioteca Virtual em Saúde especializada em odontologia."
                            link="https://odontologia.bvs.br/"
                        />
                        <ResourceCard
                            title="SciELO"
                            description="Biblioteca eletrônica que abrange uma coleção selecionada de periódicos científicos brasileiros."
                            link="https://www.scielo.br/"
                        />
                        <ResourceCard
                            title="LILACS"
                            description="Literatura Latino-Americana e do Caribe em Ciências da Saúde."
                            link="https://lilacs.bvsalud.org/"
                        />
                    </div>
                </section>

                {/* Estatística e Metodologia */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        Estatística e Metodologia
                    </h2>
                    <div className="grid gap-4">
                        <ResourceCard
                            title="Canal Pesquise (Tutorial)"
                            description="Tutorial para ajudar na escolha da melhor ferramenta estatística."
                            link="https://www.canalpesquise.com.br/tutorial"
                        />
                        <ResourceCard
                            title="Jamovi"
                            description="Alternativa gratuita e simples ao SPSS. Software estatístico robusto e open-source."
                            link="https://www.jamovi.org/"
                        />
                        <ResourceCard
                            title="Balaio Científico (Jamovi)"
                            description="Artigo sobre como substituir o SPSS pelo Jamovi."
                            link="https://balaiocientifico.com/jamovi/substituir-o-spss/"
                        />
                        <ResourceCard
                            title="Cálculo Amostral (G*Power)"
                            description="Tutorial de como fazer o cálculo de tamanho amostral no G*Power."
                            link="https://www.blog.psicometriaonline.com.br/como-fazer-o-calculo-de-tamanho-amostral-no-gpower/"
                        />
                    </div>
                </section>

                {/* Gestão de Referências */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        Gestão de Referências
                    </h2>
                    <div className="grid gap-4">
                        <ResourceCard
                            title="Zotero"
                            description="Ferramenta gratuita e fácil de usar para ajudar você a coletar, organizar, citar e compartilhar pesquisas."
                            link="https://www.zotero.org/"
                        />
                        <ResourceCard
                            title="Mendeley"
                            description="Gerenciador de referências e rede social acadêmica que pode ajudá-lo a organizar sua pesquisa."
                            link="https://www.mendeley.com/"
                        />
                        <ResourceCard
                            title="EndNote"
                            description="Software padrão da indústria para publicação e gerenciamento de bibliografias, citações e referências."
                            link="https://endnote.com/"
                        />
                    </div>
                </section>

                {/* Escrita Acadêmica e Ética */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        Escrita Acadêmica e Normalização
                    </h2>
                    <div className="grid gap-4">
                        <ResourceCard
                            title="Plataforma Brasil"
                            description="Base nacional e unificada de registros de pesquisas envolvendo seres humanos (CEP/CONEP)."
                            link="https://plataformabrasil.saude.gov.br/login.jsf"
                        />
                        <ResourceCard
                            title="Equator Network"
                            description="Guias para escrita de artigos de alta qualidade (CONSORT, PRISMA, STROBE)."
                            link="https://www.equator-network.org/"
                        />
                        <ResourceCard
                            title="Normas ABNT (UFRN)"
                            description="Guia de normalização e templates para trabalhos acadêmicos da BCZM (UFRN)."
                            link="https://sisbi.ufrn.br/biblioteca/bczm/orientacoes/trabalhosacademicos"
                        />
                        <ResourceCard
                            title="Estilo Vancouver"
                            description="Citing Medicine: The NLM Style Guide for Authors, Editors, and Publishers."
                            link="https://www.ufrgs.br/bibicbs/vancouver/"
                        />
                    </div>
                </section>

            </div>
        </div>
    );
}

function ResourceCard({ title, description, link }) {
    return (
        <a href={link} target="_blank" rel="noopener noreferrer" className="block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-violet-300 dark:hover:border-violet-500 hover:shadow-md transition-all group h-full">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors mb-2 flex items-center gap-2">
                        {title}
                        <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover:text-violet-500 dark:group-hover:text-violet-400" />
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </a>
    );
}
