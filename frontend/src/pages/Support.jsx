import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Download, Upload, ExternalLink, Info, FileText, X } from 'lucide-react';
import { api } from '../api';

export default function Support() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [templateFile, setTemplateFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, sending, success, error
    const [selectedImage, setSelectedImage] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setTemplateFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');

        try {
            // First send the contact form
            await api.sendContact(formData);

            // If there's a file, upload it
            if (templateFile) {
                const uploadData = new FormData();
                uploadData.append('file', templateFile);
                uploadData.append('professor_name', formData.name);
                await api.uploadTemplate(uploadData);
            }

            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
            setTemplateFile(null);
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col space-y-10 animate-diagonal-zoom pb-12">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 dark:from-pink-700 dark:to-rose-800 rounded-3xl p-8 text-white shadow-xl flex-shrink-0 text-center transition-all">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                    <Mail className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-3 tracking-tight">Suporte ao Usuário</h1>
                <p className="text-pink-50 text-base leading-relaxed max-w-2xl mx-auto opacity-90">
                    Estamos aqui para ajudar! Se você tiver dúvidas, sugestões ou precisar de apoio com a importação de seus dados científicos, utilize os canais abaixo.
                </p>
            </div>

            {/* Manual Import Guide Section */}
            <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Não encontrei meu artigo. O que fazer?</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Entenda por que alguns dados podem não ser capturados automaticamente e como resolver.</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Explanation */}
                    <div className="flex gap-4 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                        <Info className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
                        <div className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                            <p className="font-semibold mb-1">Restrições Técnicas do Lattes:</p>
                            Infelizmente, a plataforma Lattes implementou diversas barreiras para a coleta automatizada (web scraping), incluindo sistemas de <strong>Captcha</strong>, <strong>bloqueios de IP</strong> e a recente <strong>interrupção do download direto do XML (currículo estruturado)</strong>. Assim, a utilização da Plataforma Lattes para importação automatizada de dados relativos às produções científicas se tornou impraticável.
                            <br />
                            <br />
                            Nossa principal fonte de metadados de produções científicas é o <strong>PubMed</strong>, uma base de dados biomédicos de acesso público mantida pelos Institutos Nacionais de Saúde dos Estados Unidos (NIH). Porém, nem todos os pesquisadores possuem suas produções indexadas devido à ausência de DOI e/ou de indexação de periódicos regionais/nacionais menores.
                            <br />
                            <br />
                            Para contornar isso, o <strong>OdontoPub</strong> oferece uma solução eficiente: o <strong>download do template</strong> e posterior upload dele já preenchido pelo usuário, no sistema. Este método garante a integridade dos seus dados e é a forma mais segura e recomendada para incluir suas informações não indexadas no PubMed.
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                Passo a Passo para Inserção
                            </h3>

                            <ol className="space-y-4">
                                <li className="flex gap-4">
                                    <span className="flex-shrink-0 w-6 h-6 bg-rose-500 text-white rounded-full text-xs font-bold flex items-center justify-center">1</span>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        Baixe o nosso <a href="http://localhost:8000/assets/template_publicacoes.csv" className="text-rose-600 dark:text-rose-400 font-bold hover:underline inline-flex items-center gap-1"><Download className="w-3 h-3" /> template oficial</a> em formato CSV.
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <span className="flex-shrink-0 w-6 h-6 bg-rose-500 text-white rounded-full text-xs font-bold flex items-center justify-center">2</span>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        Abra e edite usando o <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1">Google Sheets <ExternalLink className="w-3 h-3" /></a>, MS Excel, OnlyOffice ou LibreOffice. <br /><br /><strong>Importante:</strong> Ao abrir e também ao salvar, utilize a <strong>vírgula</strong> como delimitador. Salve o arquivo em <strong>formato CSV</strong>.
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <span className="flex-shrink-0 w-6 h-6 bg-rose-500 text-white rounded-full text-xs font-bold flex items-center justify-center">3</span>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        Renomeie o arquivo com o seu nome completo (Ex: <code>NOME DO PROFESSOR.csv</code>) para correta identificação na base de dados.
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <span className="flex-shrink-0 w-6 h-6 bg-rose-500 text-white rounded-full text-xs font-bold flex items-center justify-center">4</span>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        Anexe o arquivo preenchido no formulário de contato abaixo. Nossa equipe fará a validação e importação em até 48h.
                                    </div>
                                </li>
                            </ol>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-sky-500" />
                                Guia Visual do Template
                            </h3>
                            <div className="space-y-4">
                                <div
                                    className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm cursor-zoom-in hover:border-rose-400 dark:hover:border-rose-500 transition-colors"
                                    onClick={() => setSelectedImage("http://localhost:8000/assets/template_guideline1.png")}
                                >
                                    <img src="http://localhost:8000/assets/template_guideline1.png" alt="Guideline 1" className="w-full h-auto" />
                                </div>
                                <div
                                    className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm cursor-zoom-in hover:border-rose-400 dark:hover:border-rose-500 transition-colors"
                                    onClick={() => setSelectedImage("http://localhost:8000/assets/template_guideline2.png")}
                                >
                                    <img src="http://localhost:8000/assets/template_guideline2.png" alt="Guideline 2" className="w-full h-auto" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Form Section */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 md:p-12 transition-colors">
                {status === 'success' ? (
                    <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">Mensagem Recebida!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-sm mx-auto text-lg">
                            Obrigado pelo seu envio. Se anexou um template, nossa equipe processará os dados em breve.
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-8 py-3 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all hover:scale-105 active:scale-95"
                        >
                            Enviar nova mensagem
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-10 text-center">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Formulário de Contato</h2>
                            <p className="text-slate-500 dark:text-slate-400">Preencha os campos abaixo para falar conosco ou enviar seu template.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Seu Nome / Professor</label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-5 py-3 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="Ex: João Silva da Souza"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Seu Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-5 py-3 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="seu@contato.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Assunto</label>
                                <input
                                    type="text"
                                    name="subject"
                                    id="subject"
                                    required
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="w-full px-5 py-3 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                    placeholder="Ex: Envio de template preenchido..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Mensagem ou Observações</label>
                                <textarea
                                    name="message"
                                    id="message"
                                    rows="4"
                                    required
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="w-full px-5 py-3 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none resize-none bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                    placeholder="Descreva brevemente o motivo do contato..."
                                ></textarea>
                            </div>

                            {/* File Upload Field */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Anexar Template Preenchido (Opcional)</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full px-5 py-4 border-2 border-dashed rounded-2xl transition-all flex items-center justify-between ${templateFile ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-200 dark:border-slate-600 group-hover:border-rose-300 dark:group-hover:border-rose-500 bg-slate-50/50 dark:bg-slate-700/30'}`}>
                                        <div className="flex items-center gap-3">
                                            <Upload className={`w-5 h-5 ${templateFile ? 'text-sky-500' : 'text-slate-400'}`} />
                                            <span className={`text-sm ${templateFile ? 'text-sky-700 dark:text-sky-300 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {templateFile ? templateFile.name : 'Selecionar arquivo CSV...'}
                                            </span>
                                        </div>
                                        {templateFile && (
                                            <CheckCircle className="w-5 h-5 text-sky-500 animate-in zoom-in" />
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 pl-1 italic">Apenas arquivos .csv são permitidos.</p>
                            </div>

                            {status === 'error' && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-100 dark:border-red-900/50 animate-in shake duration-300">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    Ocorreu um erro ao enviar. Verifique o arquivo e tente novamente.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'sending'}
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 dark:shadow-rose-900/20 hover:shadow-rose-300 dark:hover:shadow-rose-900/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                            >
                                {status === 'sending' ? (
                                    <>
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                        Enviando Dados...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Enviar
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* Modal for Image Expansion */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 pointer-events-auto"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <div
                        className="relative max-w-7xl max-h-full overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage}
                            alt="Visualização Expandida"
                            className="w-full h-auto max-h-[90vh] object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
