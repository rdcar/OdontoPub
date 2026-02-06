# 🦷 OdontoPub - UFRN

O **OdontoPub** é um dashboard analítico e interativo desenvolvido em **React, Tailwind CSS, FastAPI e Python**, projetado para centralizar, monitorar e visualizar a produção acadêmica do corpo docente do Departamento de Odontologia da Universidade Federal do Rio Grande do Norte (UFRN).

O projeto resolve o problema da **dispersão de informações**, oferecendo aos alunos e pesquisadores uma interface única para identificar linhas de pesquisa, encontrar orientadores e acompanhar a evolução científica do departamento, sem a necessidade de navegar manualmente por dezenas de currículos individuais.

---

## 🚀 Principais Funcionalidades

### 📊 Dashboard de Estatísticas
Visualização centralizada com indicadores de impacto, incluindo o total de publicações únicas do departamento, áreas de atuação predominantes e linhas de pesquisa ativas.

### 🔍 Busca Global de Publicações
Motor de busca avançado que permite localizar artigos em toda a base de dados por:
*   Título ou Palavras-chave
*   Autores
*   Ano de Publicação
*   Revista (Journal)
*   PMID ou DOI

### 🌐 Rede de Colaboração
Visualização interativa baseada em grafos que mapeia as conexões científicas entre os professores do departamento, permitindo identificar clusters de pesquisa e parcerias produtivas.

### 📚 Linhas e Projetos de Pesquisa
Painel dedicado para explorar os projetos científicos em andamento ou concluídos, categorizados por docente, facilitando a identificação de frentes de investigação atuais.

### ✨ Experiência Visual Premium
Interface moderna com animações fluidas (*Diagonal Zoom*), modo responsivo e foco em usabilidade, proporcionando uma navegação intuitiva tanto em desktop quanto em dispositivos móveis.

<div style="text-align: center;">
  <img src="screenshots\screenshot1.png" alt="left" style="display: inline-flex; margin: 2px auto; width:25%">
  <img src="screenshots\screenshot2.png" alt="center" style="display: inline-flex; margin: 2px auto; width:24%">
  <img src="screenshots\screenshot3.png" alt="right" style="display: inline-flex; margin: 2px auto; width:24.3%">
</div>   

---

## 🛠 Arquitetura do Sistema

O projeto utiliza uma arquitetura moderna e desacoplada, separando a lógica de processamento de dados da interface do usuário.

### **Backend (FastAPI + Pandas)**
*   **Processamento:** Engine em Python que manipula grandes volumes de dados bibliográficos via Pandas.
*   **API:** Endpoints REST otimizados para filtragem rápida, busca global e geração de estatísticas em tempo real.
*   **Persistência:** Dados armazenados em arquivos CSV relacionais (`professores.csv`, `publicacoes.csv`, `vinculos.csv`, `projetos.csv`), garantindo portabilidade e facilidade de auditoria.

### **Frontend (React + Vite + Tailwind)**
*   **Interface:** SPA (Single Page Application) rápida e responsiva.
*   **Visualização:** Utiliza `react-force-graph` para a rede de colaboração e `Lucide React` para iconografia técnica.
*   **Estilização:** Tailwind CSS para um design consistente com animações personalizadas.

---

## 📂 Estrutura de Dados (CSVs)

O sistema opera sob uma estrutura ETL simplificada:
*   `professores.csv`: Cadastro mestre com nomes, variantes bibliográficas, áreas de atuação e linhas de pesquisa.
*   `publicacoes.csv`: Metadados completos dos artigos indexados (PubMed) e manuais.
*   `vinculos.csv`: Tabela de junção (N:N) que conecta artigos aos seus respectivos autores docentes.
*   `projetos.csv`: Listagem de projetos de pesquisa extraídos ou cadastrados.

---

## 💻 Como Executar o Projeto

### **1. Backend**
Certifique-se de ter o Python 3.9+ instalado.
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
Certifique-se de ter o Node.js instalado.
```bash
# Navegue até a pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```
O frontend ficará disponível em `http://localhost:5173`.

---

## ⚠️ Observação sobre Coleta de Dados
O projeto utiliza o **PubMed** como fonte primária para artigos internacionais através de scripts de mineração automatizados, contornando as restrições de CAPTCHAs da Plataforma Lattes e centralizando a produção científica de forma confiável.