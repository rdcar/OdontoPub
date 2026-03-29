import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { RefreshCw, Database, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DataSync() {
  const [professores, setProfessores] = useState([]);
  const [syncState, setSyncState] = useState({
    loading: false,
    selectedProf: '',
    mode: 'variantes',
    result: null,
    error: null
  });

  useEffect(() => {
    adminApi.getProfessores().then(setProfessores).catch(console.error);
  }, []);

  const handleSync = async () => {
    if (!syncState.selectedProf) return alert("Selecione um professor primeiro.");
    
    setSyncState(prev => ({ ...prev, loading: true, result: null, error: null }));
    
    try {
      const resp = await adminApi.syncPubmed(parseInt(syncState.selectedProf), syncState.mode);
      setSyncState(prev => ({ ...prev, loading: false, result: resp }));
    } catch (err) {
      setSyncState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Database className="mr-3 text-blue-600" /> Sincronização PubMed API
        </h1>
        <p className="text-gray-500 mt-2">
          Integração automatizada com os bancos de dados do NCBI para indexação e atualização de artigos.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Nova Varredura</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">1. Selecione o Pesquisador Base</label>
            <select 
              value={syncState.selectedProf}
              onChange={e => setSyncState({...syncState, selectedProf: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Selecione para Buscar --</option>
              {professores.map(p => (
                <option key={p.id_professor} value={p.id_professor}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">2. Método de Busca (Recomendação: Variantes)</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                <input 
                  type="radio" 
                  name="mode" 
                  value="variantes" 
                  checked={syncState.mode === 'variantes'}
                  onChange={e => setSyncState({...syncState, mode: e.target.value})}
                  className="mr-3 h-4 w-4 text-blue-600" 
                />
                <div>
                  <div className="font-semibold text-gray-800">Busca Inteligente (Seguro)</div>
                  <div className="text-xs text-gray-500">Usa os termos "variantes" + Match de Letras. Filtra falsos-positivos de autores homônimos (Recomendado).</div>
                </div>
              </label>

              <label className="flex items-center cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                <input 
                  type="radio" 
                  name="mode" 
                  value="nome_exato" 
                  checked={syncState.mode === 'nome_exato'}
                  onChange={e => setSyncState({...syncState, mode: e.target.value})}
                  className="mr-3 h-4 w-4 text-blue-600" 
                />
                <div>
                  <div className="font-semibold text-gray-800">Nome Oficial e Vínculo Cego</div>
                  <div className="text-xs text-gray-500">Busca pelo Nome (Ex: Silva A), aceita e vincula a este professor todos os resultados. Funciona melhor para nomes únicos.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              * A API tem limite HTTP. Uma requisição muito longa pode demorar até 10-15s (Processo bloqueante).
            </span>
            <button 
              onClick={handleSync}
              disabled={syncState.loading || !syncState.selectedProf}
              className={`flex items-center px-6 py-3 rounded-lg font-medium text-white transition-all shadow-sm
                ${syncState.loading || !syncState.selectedProf 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
            >
              {syncState.loading ? (
                <><RefreshCw className="w-5 h-5 mr-3 animate-spin"/> Mapeando e Sincronizando... </>
              ) : (
                <><RefreshCw className="w-5 h-5 mr-3" /> Iniciar Varredura </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados da Sincronização */}
      {(syncState.result || syncState.error) && (
        <div className={`mt-6 p-6 rounded-xl border ${syncState.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start">
            {syncState.error ? (
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-0.5 shrink-0" />
            )}
            <div>
              <h3 className={`font-bold ${syncState.error ? 'text-red-800' : 'text-green-800'}`}>
                {syncState.error ? 'Falha na Sincronização' : 'Sincronização Concluída'}
              </h3>
              
              {syncState.error && (
                 <p className="mt-1 text-red-700 text-sm whitespace-pre-wrap">{syncState.error}</p>
              )}
              
              {syncState.result && (
                <div className="mt-2 text-green-800 text-sm space-y-1">
                   <p>Status da rotina: <strong>{syncState.result.status}</strong></p>
                   {syncState.result.fetched !== undefined && (
                     <p>Metadados Re-baixados do PubMed: <strong>{syncState.result.fetched} artigos</strong></p>
                   )}
                   {syncState.result.novos_vinculos !== undefined && (
                     <p>Novos artigos vinculados com sucesso: <strong>{syncState.result.novos_vinculos} associações</strong></p>
                   )}
                   <p className="mt-2 opacity-80 italic">As tabelas em memória já foram regeradas e o site principal atualizado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
