import { API_URL } from './index';

// Helper for authorized fetch
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('adminToken');
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } else {
    // browser will set multipart/form-data with boundary
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_URL}/api/admin${url}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
    throw new Error('Não autorizado');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(err.detail || 'Erro na requisição');
  }

  return response.json();
};

export const adminApi = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Falha no login' }));
      throw new Error(err.detail);
    }
    return response.json();
  },

  getProfessores: () => fetchWithAuth('/professores'),
  addProfessor: (data) => fetchWithAuth('/professores', { method: 'POST', body: JSON.stringify(data) }),
  editProfessor: (id, data) => fetchWithAuth(`/professores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProfessor: (id) => fetchWithAuth(`/professores/${id}`, { method: 'DELETE' }),
  
  uploadPhoto: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchWithAuth(`/professores/${id}/foto`, { method: 'POST', body: formData });
  },

  getPublicacoes: (limit = 100) => fetchWithAuth(`/publicacoes?limit=${limit}`),
  addPublicacao: (data) => fetchWithAuth('/publicacoes', { method: 'POST', body: JSON.stringify(data) }),
  editPublicacao: (pmid, data) => fetchWithAuth(`/publicacoes/${pmid}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePublicacao: (pmid) => fetchWithAuth(`/publicacoes/${pmid}`, { method: 'DELETE' }),

  syncPubmed: (id_professor, mode = 'variantes') => 
    fetchWithAuth('/sync', { method: 'POST', body: JSON.stringify({ id_professor, mode }) }),
};
