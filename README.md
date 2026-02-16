# 🦷 OdontoPub - UFRN

O **OdontoPub** é um dashboard analítico e interativo desenvolvido em **React, Tailwind CSS, FastAPI e Python**, projetado para centralizar, visualizar e monitorar o impacto (Qualis/CAPES) da produção acadêmica do corpo docente do Departamento de Odontologia da Universidade Federal do Rio Grande do Norte (UFRN).

O projeto resolve o problema da **dispersão de informações**, oferecendo aos alunos e pesquisadores uma interface única para identificar linhas de pesquisa, encontrar orientadores, explorar redes de colaboração e acompanhar a evolução científica do departamento. Há também uma central de ferramentas úteis para a vida acadêmica, incluindo acesso à literatura, metodologia e estatística, normatização e gestão de referências.

---

## Principais Funcionalidades

### Dashboard de Estatísticas
Visualização centralizada com indicadores de impacto, incluindo o total de publicações únicas do departamento, áreas de atuação e linhas de pesquisa ativas.

### Recursos Úteis e Apoio ao Pesquisador
Uma central de ferramentas essenciais para a vida acadêmica, incluindo:
*   **Acesso à Literatura:** Links diretos para CAPES, BVS, SciELO e LILACS.
*   **Metodologia e Estatística:** Ferramentas para escolha de testes, cálculo amostral (G*Power) e alternativas ao SPSS (Jamovi).
*   **Normatização:** Guias ABNT/UFRN e Vancouver.
*   **Gestão de Referências:** Acesso rápido ao Zotero, Mendeley e EndNote.

### Canal de Contato
Formulário integrado para reporte de erros, sugestões ou dúvidas, com envio direto para a administração do sistema.

### Busca Global de Publicações
Motor de busca avançado que permite localizar artigos em toda a base de dados por Título, Autores, Ano, Revista, PMID ou DOI.

### Rede de Colaboração
Visualização interativa baseada em grafos que mapeia as conexões científicas entre os professores.

### Linhas e Projetos de Pesquisa
Painel dedicado para explorar os projetos científicos em andamento ou concluídos.

---

## 🛠 Arquitetura do Sistema

### **Backend (FastAPI)**
*   **API REST:** Endpoints otimizados para busca e filtragem.
*   **Email Service:** Sistema de envio de mensagens via SMTP (configurável).
*   **Dados:** Manipulação de CSVs via Pandas.

### **Frontend (React + Tailwind)**
*   **SPA:** Interface rápida com navegação fluida.
*   **Design Premium:** Animações personalizadas (*Diagonal Zoom*) e layout responsivo.

---

## Como Executar o Projeto

### **1. Backend**
```bash
# Navegue até a pasta raiz
cd OdontoPub

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor
python backend/main.py
```
O backend ficará disponível em `http://localhost:8000`.

### **2. Frontend**
```bash
# Navegue até a pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```
O frontend ficará disponível em `http://localhost:5173`.