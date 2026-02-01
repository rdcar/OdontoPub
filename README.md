# 🦷 OdontoPub - UFRN

O **OdontoPub** é um dashboard analítico e interativo desenvolvido em **Python** e **Streamlit**, projetado para centralizar, monitorar e visualizar a produção acadêmica do corpo docente do Departamento de Odontologia da Universidade Federal do Rio Grande do Norte (UFRN).
O projeto resolve o problema da **dispersão de informações**, oferecendo aos alunos e pesquisadores uma interface única para identificar linhas de pesquisa, encontrar orientadores e acompanhar a evolução científica do departamento, sem a necessidade de navegar manualmente por dezenas de currículos individuais.

## 🛠 Arquitetura e Fluxo de Dados

O projeto opera sob uma arquitetura de ETL (*Extract, Transform, Load*) simplificada, armazenando os dados em arquivos CSV relacionais para garantir portabilidade e facilidade de manutenção.

1. **Entrada (Input):** Lista controlada de docentes (`professores.csv`) contendo nomes, variações bibliográficas e IDs.
2. **Extração (Mining):**
* **Via API (PubMed):** Script automatizado que busca artigos indexados.
* **Via Input Manual:** Script para inserção de obras não indexadas (revistas locais, anais).


3. **Armazenamento (Database):**
* `publicacoes.csv`: Metadados dos artigos (Título, DOI, Revista, Ano, Autores).
* `vinculos.csv`: Tabela de junção que conecta artigos (PMID) aos professores (ID).


4. **Visualização (Frontend):** Aplicação Web (`app.py`) que consome os CSVs e gera gráficos e perfis em tempo real.

## 🚀 Funcionalidades

### 1. Coleta Híbrida de Dados

O sistema possui um coletor robusto (`coletor_pubmed.py`) capaz de operar em três modos distintos para maximizar a recuperação de artigos:

* **Busca por Variantes (Match Inteligente):** Busca o professor pelas variações de nome cadastradas e valida se ele consta na lista de autores do XML retornado.
* **Busca por Nome Oficial:** Vinculação direta baseada no nome principal. Nesse caso, a API se encarrega de pesquisar possíveis variações.
* **Busca por Query Personalizada:** Permite ao operador inserir termos específicos (ex: *"de Almeida ÉO"* para Érica Janine Dantas da Silveira) para encontrar autores cujos nomes foram abreviados de forma não padronizada pelo PubMed.

### 2. Cadastro Manual de Obras (`cadastrar_manual.py`)

Para contornar a ausência de indexação de revistas locais ou anais de congressos no PubMed, foi criado um script dedicado que:

* Gera IDs únicos internos (`MAN_YYYYMM...`) para evitar colisão com o PubMed.
* Permite popular a base com artigos relevantes que não possuem DOI ou PMID.

### 3. Dashboard Interativo (`app.py`)

* **Perfis Individuais:** Exibe foto, categoria, link para o Lattes e lista cronológica de publicações.
* **Filtros Dinâmicos:** Filtragem por ano, nome do docente ou palavras-chave no título.
* **Indicadores:** Contagem total de publicações e período de atividade.

## ⚠️ Limitações Técnicas e Metodológicas

A arquitetura atual foi desenhada para contornar restrições importantes na obtenção de dados acadêmicos no Brasil:

### 1. A Questão do Lattes (ScriptLattes/XML)

Antigamente, ferramentas como o `scriptLattes` permitiam a extração massiva de dados diretamente da Plataforma Lattes. Atualmente, devido à implementação de **CAPTCHAs agressivos e Firewalls (WAF)** pelo CNPq, a extração automatizada direta do Lattes tornou-se inviável para projetos abertos.

* **Impacto:** O projeto não consegue "baixar" o currículo do professor automaticamente.
* **Solução:** Utilizamos o **PubMed** como fonte primária de verdade para artigos internacionais e o cadastro manual para complementar a produção nacional/regional.

### 2. O Desafio dos Homônimos

Diferente do Lattes, que usa um ID único (CPF/LattesID), a busca via API do PubMed baseia-se em **strings de texto (nomes de autores)**.

* **Risco:** Um professor chamado "José Silva" pode ter sua produção misturada com um homônimo de outra instituição ou área (ex: Física).
* **Mitigação:** O algoritmo de "Match Inteligente" tenta cruzar variantes, mas a validação humana ou o uso da **Busca por Query Personalizada** (implementada neste projeto) são essenciais para garantir a integridade dos dados.

## 💻 Como Executar o Projeto

### Pré-requisitos

* Python 3.8+
* Bibliotecas listadas em `requirements.txt`

### Passo 1: Instalação

Clone o repositório e instale as dependências:

```bash
pip install -r requirements.txt

```

### Passo 2: Atualizar a Base de Dados

Você tem duas opções para alimentar o sistema:

**Opção A: Coleta Automática (PubMed)**
Execute o script principal e siga as instruções do menu (escolha entre busca por variantes, nome exato ou query manual):

```bash
python coletor_pubmed.py

```

*O script fará o update dos arquivos `publicacoes.csv` e `vinculos.csv` sem apagar registros anteriores.*

**Opção B: Cadastro Manual**
Para inserir um artigo que não está no PubMed:

```bash
python cadastrar_manual.py

```

### Passo 3: Iniciar o Dashboard

Para visualizar os dados no navegador:

```bash
streamlit run app.py

```
## 📂 Estrutura de Arquivos

* `app.py`: Interface do usuário (Streamlit).
* `coletor_pubmed.py`: Motor de busca na API do NCBI.
* `cadastrar_manual.py`: Ferramenta de inserção de dados offline.
* `professores.csv`: Cadastro mestre dos docentes.
* `publicacoes.csv`: Banco de dados de artigos.
* `vinculos.csv`: Tabela relacional (N:N) entre publicações e autores.