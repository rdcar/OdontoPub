const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = {
    getProfessores: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.nome) params.append("nome", filters.nome);
        if (filters.atuacao) params.append("atuacao", filters.atuacao);

        const res = await fetch(`${API_URL}/professores?${params}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Network error" }));
            throw new Error(err.detail || "Erro ao buscar professores");
        }
        return res.json();
    },

    getProfessorById: async (id) => {
        const res = await fetch(`${API_URL}/professores/${id}`);
        if (!res.ok) throw new Error("Professor not found");
        return res.json();
    },

    getGraph: async () => {
        const res = await fetch(`${API_URL}/graph`);
        if (!res.ok) throw new Error("Erro ao buscar dados do grafo");
        return res.json();
    },

    getProjetos: async () => {
        const res = await fetch(`${API_URL}/projetos`);
        if (!res.ok) throw new Error("Erro ao buscar projetos");
        return res.json();
    },

    getCollaborations: async (id) => {
        const res = await fetch(`${API_URL}/collaborations/${id}`);
        if (!res.ok) throw new Error("Erro ao buscar colaborações");
        return res.json();
    },

    getStats: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.ano) params.append("ano", filters.ano);
        if (filters.atuacao) params.append("atuacao", filters.atuacao);

        const res = await fetch(`${API_URL}/stats?${params}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Network error" }));
            throw new Error(err.detail || "Erro ao buscar estatísticas");
        }
        return res.json();
    },

    searchPublications: async (query) => {
        const res = await fetch(`${API_URL}/publicacoes/busca?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Erro ao buscar publicações");
        return res.json();
    },

    sendContact: async (data) => {
        const res = await fetch(`${API_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Erro ao enviar mensagem");
        return res.json();
    },

    uploadTemplate: async (formData) => {
        const res = await fetch(`${API_URL}/upload-template`, {
            method: 'POST',
            body: formData, // Fetch handles Content-Type for FormData automatically
        });
        if (!res.ok) throw new Error("Erro ao fazer upload do arquivo");
        return res.json();
    }
};
