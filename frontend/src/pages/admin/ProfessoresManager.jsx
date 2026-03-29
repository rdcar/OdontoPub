import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../api/adminApi';
import { Pencil, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { getProfessorPhotoUrl } from '../../api/index';

export default function ProfessoresManager() {
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Photo upload state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedProfForPhoto, setSelectedProfForPhoto] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nome: '',
    lattes_id: '',
    categoria: '',
    variantes: '',
    atuacao: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getProfessores();
      setProfessores(data);
    } catch (e) {
      alert("Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (prof = null) => {
    if (prof) {
      setEditingId(prof.id_professor);
      setFormData({
        nome: prof.nome || '',
        lattes_id: prof.lattes_id || '',
        categoria: prof.categoria || '',
        variantes: prof.variantes || '',
        atuacao: prof.atuacao || ''
      });
    } else {
      setEditingId(null);
      setFormData({ nome: '', lattes_id: '', categoria: '', variantes: '', atuacao: '' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminApi.editProfessor(editingId, formData);
        alert("Salvo com sucesso!");
      } else {
        await adminApi.addProfessor(formData);
        alert("Adicionado com sucesso!");
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja mesmo remover este professor? Suas publicações também perderão o vínculo.")) {
      try {
        await adminApi.deleteProfessor(id);
        alert("Removido.");
        loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Selecione um arquivo .jpg");

    try {
      await adminApi.uploadPhoto(selectedProfForPhoto.id_professor, selectedFile);
      alert("Foto salva com sucesso! (Pode demorar um pouco para o cache do navegador atualizar)");
      setPhotoModalOpen(false);
      setSelectedFile(null);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Professores</h1>
          <p className="text-gray-500">Gerenciamento de docentes e variantes de busca.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium transition"
        >
          <Plus className="w-5 h-5 mr-2" /> Novo Professor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium text-sm text-left">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Foto / Nome</th>
                  <th className="px-6 py-4">Atuação</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {professores.map((p) => (
                  <tr key={p.id_professor} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-500">{p.id_professor}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={getProfessorPhotoUrl(p.nome)}
                          alt="Foto"
                          className="w-10 h-10 rounded-full object-cover mr-4 border border-gray-200"
                          onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Sem+Foto" }}
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{p.nome}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{p.variantes}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.atuacao || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedProfForPhoto(p);
                            setPhotoModalOpen(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition tooltip"
                          title="Alterar Foto"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar Professor"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id_professor)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Professor Editor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Professor' : 'Novo Professor'}
              </h2>
            </div>
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input required type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: RENATO DE CASTRO" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Lattes</label>
                    <input type="text" value={formData.lattes_id} onChange={e => setFormData({ ...formData, lattes_id: e.target.value })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Área de Atuação</label>
                    <input type="text" value={formData.atuacao} onChange={e => setFormData({ ...formData, atuacao: e.target.value })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <input type="text" value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variantes de Busca PubMed</label>
                  <textarea value={formData.variantes} onChange={e => setFormData({ ...formData, variantes: e.target.value })} rows={3} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: de Almeida EO; Almeida E"></textarea>
                  <p className="text-xs text-gray-500 mt-1">Separe por ponto e vírgula (;).</p>
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {photoModalOpen && selectedProfForPhoto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Foto de Perfil</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedProfForPhoto.nome}</p>
            </div>
            <form onSubmit={handlePhotoUpload}>
              <div className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {selectedFile ? (
                      <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-400 w-8 h-8" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg, image/jpg"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Selecione Imagem .JPG
                  </button>
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => { setPhotoModalOpen(false); setSelectedFile(null); }} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancelar</button>
                <button type="submit" disabled={!selectedFile} className="px-4 py-2 font-medium bg-blue-600 disabled:bg-blue-300 hover:bg-blue-700 text-white rounded-lg transition">Salvar Foto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
