import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';

export default function PublicacoesManager() {
  const [publicacoes, setPublicacoes] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPmid, setEditingPmid] = useState(null);

  const [searchPmid, setSearchPmid] = useState('');

  const [formData, setFormData] = useState({
    pmid: '',
    id_professor: '',
    doi: '',
    issn: '',
    titulo: '',
    revista: '',
    ano: '',
    autores: '',
    abstract: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar publicações
      const qs = searchPmid ? `?pmid=${searchPmid}&limit=50` : '?limit=50';
      const token = localStorage.getItem('adminToken');
      const resPub = await fetch(`http://localhost:8000/api/admin/publicacoes${qs}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resPub.ok) setPublicacoes(await resPub.json());

      // Carregar professores para o dropdown
      const dataProf = await adminApi.getProfessores();
      setProfessores(dataProf);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchPmid]);

  const handleOpenModal = (pub = null) => {
    if (pub) {
      setEditingPmid(pub.pmid);
      setFormData({
        pmid: pub.pmid || '',
        id_professor: '',
        doi: pub.doi || '',
        issn: pub.issn || '',
        titulo: pub.titulo || '',
        revista: pub.revista || '',
        ano: pub.ano || '',
        autores: pub.autores || '',
        abstract: pub.abstract || ''
      });
    } else {
      setEditingPmid(null);
      setFormData({
        pmid: '', // Deixa vazio para o admin preencher ou auto-gerar
        id_professor: '',
        doi: '', issn: '', titulo: '', revista: '', ano: new Date().getFullYear().toString(), autores: '', abstract: ''
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let finalData = { ...formData };

      if (editingPmid) {
        await adminApi.editPublicacao(editingPmid, finalData);
        alert("Salvo com sucesso!");
      } else {
        if (!finalData.id_professor) return alert("Selecione o professor orientador/autor para vincular o novo artigo.");

        // Se o PMID estiver vazio, gera um interno
        if (!finalData.pmid || finalData.pmid.trim() === '') {
          finalData.pmid = `MAN_${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
        }

        await adminApi.addPublicacao({
          ...finalData,
          id_professor: parseInt(finalData.id_professor)
        });
        alert("Adicionado com sucesso!");
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (pmid) => {
    if (window.confirm("Remover esta publicação afetará as métricas gerais. Deseja continuar?")) {
      try {
        await adminApi.deletePublicacao(pmid);
        alert("Removida.");
        loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Publicações</h1>
          <p className="text-gray-500">Adição manual e edição de artigos do repositório.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium transition"
        >
          <Plus className="w-5 h-5 mr-2" /> Cadastro Manual
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por PMID..."
              value={searchPmid}
              onChange={e => setSearchPmid(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium text-sm text-left">
                  <th className="px-6 py-4">PMID</th>
                  <th className="px-6 py-4 min-w-[300px]">Publicação</th>
                  <th className="px-6 py-4">Ano</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {publicacoes.map((p) => (
                  <tr key={p.pmid} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{p.pmid}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 line-clamp-2">{p.titulo}</p>
                      <p className="text-xs text-gray-500 mt-1">{p.revista} • {p.autores}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{p.ano}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.pmid)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {publicacoes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">Nenhuma publicação encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPmid ? 'Editar Publicação' : 'Nova Publicação Manual'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">

                {!editingPmid && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PMID (Válido ou Vazio)</label>
                      <input
                        type="text"
                        value={formData.pmid}
                        onChange={e => setFormData({ ...formData, pmid: e.target.value })}
                        className="w-full border rounded-lg p-2 font-mono outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Deixe em branco p/ ID automático"
                      />
                      <p className="text-xs text-gray-500 mt-1">Se vazio, gera: MAN_YYYYMMDD...</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Professor Orientador / Autor *</label>
                      <select
                        required
                        value={formData.id_professor}
                        onChange={e => setFormData({ ...formData, id_professor: e.target.value })}
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="">-- Selecione o Professor --</option>
                        {professores.map(p => (
                          <option key={p.id_professor} value={p.id_professor}>{p.nome}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Obrigatório para ligar artigo ao autor no banco.</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <textarea required value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} rows={2} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Revista / Evento</label>
                    <input required type="text" value={formData.revista} onChange={e => setFormData({ ...formData, revista: e.target.value })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                    <input required type="text" value={formData.ano} onChange={e => setFormData({ ...formData, ano: e.target.value })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ISSN</label>
                    <input type="text" value={formData.issn} onChange={e => setFormData({ ...formData, issn: e.target.value })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Co-autores (Secundários)</label>
                  <input required type="text" value={formData.autores} onChange={e => setFormData({ ...formData, autores: e.target.value })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Silva A; Castro R" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Abstract</label>
                  <textarea value={formData.abstract} onChange={e => setFormData({ ...formData, abstract: e.target.value })} rows={5} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
