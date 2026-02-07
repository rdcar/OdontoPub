const API_URL = "http://localhost:8000";

export const api = {
    getProfessores: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.nome) params.append("nome", filters.nome);
        if (filters.atuacao) params.append("atuacao", filters.atuacao);

        const res = await fetch(`${API_URL}/professores?${params}`);
        return res.json();
    },

    getProfessorById: async (id) => {
        const res = await fetch(`${API_URL}/professores/${id}`);
        if (!res.ok) throw new Error("Professor not found");
        return res.json();
    },

    getGraph: async () => {
        const res = await fetch(`${API_URL}/graph`);
        return res.json();
    },

    getProjetos: async () => {
        const res = await fetch(`${API_URL}/projetos`);
        return res.json();
    },

    getCollaborations: async (id) => {
        const res = await fetch(`${API_URL}/collaborations/${id}`);
        if (!res.ok) throw new Error("Collaborations not found");
        return res.json();
    },

    getStats: async () => {
        const res = await fetch(`${API_URL}/stats`);
        return res.json();
    },

    searchPublications: async (query) => {
        const res = await fetch(`${API_URL}/publicacoes/busca?q=${encodeURIComponent(query)}`);
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
    }
};
