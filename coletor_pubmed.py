import requests
import xml.etree.ElementTree as ET
import time
import pandas as pd
import os
import unicodedata
import datetime

# ----------------- CONFIGURAÇÕES -----------------
ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
EMAIL = "renatodc89@gmail.com"
DELAY_SECS = 1.0  # Delay respeitoso para a API

# ----------------- FUNÇÕES DE APOIO -----------git------

def normalizar_texto(texto):
    """Normalize text: lowercase, remove accents, and common particles."""
    if not texto: return ""
    n = unicodedata.normalize('NFD', texto)
    n = n.encode('ascii', 'ignore').decode("utf-8")
    n = n.lower()
    for p in [" de ", " da ", " do ", " dos ", " das ", " e "]:
        n = n.replace(p, " ")
    return n.strip()

def safe_get(url, params=None, data=None):
    """Executa requisição HTTP com tratamento de erro e retry."""
    for i in range(3):  # Tenta até 3 vezes
        try:
            if data: # Se houver data, usa POST
                r = requests.post(url, data=data, timeout=30)
            else:    # Caso contrário, usa GET
                r = requests.get(url, params=params, timeout=30)
            r.raise_for_status()
            return r
        except Exception as e:
            print(f"Tentativa {i+1} falhou: {e}. Tentando novamente em {i+2}s...")
            time.sleep(i + 2) 
    return None

def obter_metadados_pubmed(pmids_lista):
    """Busca metadados XML do PubMed para uma lista de PMIDs."""
    if not pmids_lista: return []
    
    # Processa em lotes de 200 para não sobrecarregar a URL
    tamanho_lote = 200
    todos_artigos = []

    for i in range(0, len(pmids_lista), tamanho_lote):
        lote = pmids_lista[i:i + tamanho_lote]
        
        data = {
            "db": "pubmed",
            "id": ",".join(lote),
            "retmode": "xml",
            "email": EMAIL
        }
        
        res = safe_get(EFETCH_URL, data=data)
        if res is None: continue

        try:
            root = ET.fromstring(res.text)
            for article in root.findall(".//PubmedArticle"):
                pmid = article.findtext(".//PMID")
                title = article.findtext(".//ArticleTitle") or "Sem título"
                revista = article.findtext(".//Journal/Title") or "N/A"
                
                # Ano
                year = article.findtext(".//PubDate/Year")
                if not year:
                    medline_date = article.findtext(".//PubDate/MedlineDate")
                    year = medline_date[:4] if medline_date else "N/A"

                # DOI
                doi_elem = article.find(".//ArticleId[@IdType='doi']")
                doi = doi_elem.text if doi_elem is not None else "N/A"

                # Lista de autores
                autores_nomes = []
                for a in article.findall(".//Author"):
                    last = a.findtext("LastName") or ""
                    init = a.findtext("Initials") or ""
                    autores_nomes.append(f"{last} {init}".strip())

                # Abstract
                abstract_texts = []
                # Use iter("AbstractText") to find all nodes, and itertext() to get full content (including <b>, <i> etc)
                abstract_node = article.find(".//Abstract")
                if abstract_node is not None:
                    for abs_text in abstract_node.iter("AbstractText"):
                        full_text = "".join(abs_text.itertext()).strip()
                        label = abs_text.get("Label")
                        if label:
                            full_text = f"{label}: {full_text}"
                        abstract_texts.append(full_text)
                
                abstract = " ".join(abstract_texts).strip() if abstract_texts else "N/A"

                todos_artigos.append({
                    "pmid": pmid,
                    "doi": doi,
                    "titulo": title,
                    "revista": revista,
                    "ano": year,
                    "autores_string": "; ".join(autores_nomes),
                    "autores_lista": autores_nomes,
                    "abstract": abstract
                })
        except ET.ParseError:
            print("Erro ao processar XML deste lote.")
            
        time.sleep(DELAY_SECS)
        
    return todos_artigos

# ----------------- EXECUÇÃO PRINCIPAL -----------------

def rodar_coleta():
    # 1. Carregar Professores
    if not os.path.exists("professores.csv"):
        print("❌ Erro: arquivo 'professores.csv' não encontrado.")
        return

    df_prof = pd.read_csv("professores.csv")
    
    pmids_para_coletar = set()
    novos_vinculos = [] # Lista temporária para esta execução

    # 2. Carregar PMIDs Manuais (se houver)
    if os.path.exists("pmids_manuais.txt"):
        with open("pmids_manuais.txt", "r") as f:
            manuais = [line.strip() for line in f if line.strip()]
            pmids_para_coletar.update(manuais)

    # --- MENU DE OPÇÕES ---
    print("\n-------------------------------------------")
    print("      COLETOR DE DADOS PUBMED (ODONTO)     ")
    print("-------------------------------------------")
    print("Escolha o modo de busca:")
    print("1) Variantes (Busca 'variantes' + Match Inteligente)")
    print("2) Nome Oficial (Busca 'nome' exato + Vínculo Direto)")
    print("3) Busca Manual (Você digita o termo para um professor específico)")
    print("4) Cadastro Manual de Artigo (Você digita todos os dados)")
    
    opcao = input("Digite o número da opção (1, 2, 3 ou 4): ").strip()
    
    professores_alvo = [] # Tuplas (id, nome, termos_de_busca)

    professores_alvo = [] # Tuplas (id, nome, termos_de_busca)
    lista_publicacoes = [] # Inicializa lista de publicações

    if opcao == '4':
        # --- CADASTRO MANUAL INTEGRADO ---
        print("\n--- CADASTRO MANUAL DE ARTIGO ---")
        print("Selecione o(s) professor(es) (separados por vírgula):")
        prof_list = df_prof[['id_professor', 'nome']].values.tolist()
        for i, (pid, pnome) in enumerate(prof_list):
            print(f"{i}) {pnome}")
        
        professores_selecionados = []
        try:
             indices_str = input("Números dos professores (ex: 0, 3): ")
             indices = [int(x.strip()) for x in indices_str.split(',') if x.strip()]
             
             for idx in indices:
                 if 0 <= idx < len(df_prof):
                     prof_row = df_prof.iloc[idx]
                     professores_selecionados.append({
                         'id': prof_row['id_professor'],
                         'nome': prof_row['nome']
                     })
                 else:
                     print(f"⚠️ Índice {idx} inválido ignorado.")

             if not professores_selecionados:
                 print("❌ Nenhum professor válido selecionado.")
                 return

        except ValueError:
             print("❌ Entrada inválida. Use apenas números separados por vírgula.")
             return

        names_str = ", ".join([p['nome'] for p in professores_selecionados])
        print(f"\nCadastrando para: {names_str}")

        titulo = input("Título do Artigo: ").strip()
        revista = input("Nome da Revista/Evento: ").strip()
        ano = input("Ano (ex: 2023): ").strip()
        doi = input("DOI (se não tiver, aperte Enter): ").strip() or "N/A"
        autores = input("Autores (separados por ponto e vírgula): ").strip()
        abstract = input("Abstract (se não tiver, aperte Enter): ").strip() or "N/A"

        pmid_manual = f"MAN_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        lista_publicacoes.append({
            "pmid": pmid_manual, "doi": doi, "titulo": titulo,
            "revista": revista, "ano": ano, "autores": autores, "abstract": abstract
        })
        
        for prof in professores_selecionados:
            novos_vinculos.append({
                "pmid": pmid_manual,
                "id_professor": prof['id']
            })
        
        # Garante que não entre nas buscas automáticas
        pmids_para_coletar = []

    elif opcao == '3':
        # Seleção de Professor Específico
        print("\nSelecione o professor para vincular:")
        prof_list = df_prof[['id_professor', 'nome']].values.tolist()
        for i, (pid, pnome) in enumerate(prof_list):
            print(f"{i}) {pnome}")
        
        try:
            idx = int(input("Número do professor: "))
            prof_selecionado = df_prof.iloc[idx]
            
            termo_input = input(f"\nDigite o(s) termo(s) de autor para '{prof_selecionado['nome']}'\n(Separe por ponto e vírgula se for mais de um. Ex: de Almeida EO; Almeida E): ")
            termos_manual = [t.strip() for t in termo_input.split(';') if t.strip()]
            
            # Monta estrutura para o loop de busca
            professores_alvo.append({
                'id': prof_selecionado['id_professor'],
                'nome': prof_selecionado['nome'],
                'termos': termos_manual,
                'row_completa': prof_selecionado # Necessário para Opção 1 se fosse usada aqui, mas na 3 não precisa
            })
            print(f"✅ Busca configurada para: {termos_manual}")
            
        except (ValueError, IndexError):
            print("Seleção inválida.")
            return

    else:
        # Opções 1 e 2: Prepara todos os professores
        for _, row in df_prof.iterrows():
            termos = []
            if opcao == '2':
                termos = [str(row['nome']).strip()]
            else: # Opção 1
                termos = str(row['variantes']).split(';')
            
            professores_alvo.append({
                'id': row['id_professor'],
                'nome': row['nome'],
                'termos': termos,
                'row_completa': row
            })

    # 3. Executar Busca no PubMed
    print(f"\n🔎 Iniciando busca para {len(professores_alvo)} professor(es)...")
    
    for prof in professores_alvo:
        id_atual = prof['id']
        
        for t in prof['termos']:
            t = t.strip()
            if not t: continue
            
            print(f"Buscando PubMed para: {t}...")
            
            params = {
                "db": "pubmed", 
                "term": f"{t}[Author]", 
                "retmode": "json", 
                "retmax": 1000, # Garante trazer todos os resultados
                "email": EMAIL
            }
            
            res = safe_get(ESEARCH_URL, params)
            if res:
                data = res.json()
                id_list = data.get("esearchresult", {}).get("idlist", [])
                
                if id_list:
                    print(f"   -> {len(id_list)} artigos encontrados.")
                    
                    # SE FOR OPÇÃO 2 OU 3: Cria vínculo direto (Confiança na query)
                    if opcao in ['2', '3']:
                        for pmid_encontrado in id_list:
                            novos_vinculos.append({
                                "pmid": pmid_encontrado,
                                "id_professor": id_atual
                            })
                    
                    pmids_para_coletar.update(id_list)
                else:
                    print("   -> Nenhum resultado.")
            
            time.sleep(DELAY_SECS)

    # 4. Baixar Metadados
    if not pmids_para_coletar:
        print("\nNenhum artigo novo ou existente encontrado para processar.")
        # Ainda assim, pode haver processamento de manuais, segue o fluxo
    
    print(f"\n📥 Baixando metadados de {len(pmids_para_coletar)} artigos únicos...")
    todos_artigos = obter_metadados_pubmed(list(pmids_para_coletar))

    # 5. Processamento (Preparar DataFrames)
    # 5. Processamento (Preparar DataFrames)
    # Lista já pode conter manuais se Opção 4
    
    for art in todos_artigos:
        lista_publicacoes.append({
            "pmid": art['pmid'], "doi": art['doi'], "titulo": art['titulo'],
            "revista": art['revista'], "ano": art['ano'], "autores": art['autores_string'],
            "abstract": art.get('abstract', 'N/A')
        })

        # Lógica de Vínculo APENAS para Opção 1 (Variantes/Match Inteligente)
        # Nas Opções 2 e 3, os vínculos já foram criados na etapa de busca
        if opcao == '1':
            # Varre todos os professores alvo (que são todos na Op 1)
            for prof in professores_alvo:
                row = prof['row_completa']
                match_encontrado = False
                
                variantes_prof = [normalizar_texto(v) for v in str(row['variantes']).split(';')]
                autores_artigo_norm = [normalizar_texto(a) for a in art['autores_lista']]
                
                for v in variantes_prof:
                    if not v: continue
                    for a in autores_artigo_norm:
                        if v == a or (len(v) > 5 and (v in a or a in v)):
                            match_encontrado = True
                            break
                    if match_encontrado: break

                if match_encontrado:
                    # Verifica duplicidade na lista local antes de adicionar
                    novo_v = {"pmid": art['pmid'], "id_professor": prof['id']}
                    if novo_v not in novos_vinculos:
                        novos_vinculos.append(novo_v)

    # 6. Salvar e Atualizar Arquivos (UPDATE SEGURO)
    print("\n💾 Salvando e atualizando arquivos...")
    
    # --- Publicacoes.csv ---
    if os.path.exists("publicacoes.csv"):
        df_pub_antigo = pd.read_csv("publicacoes.csv")
        # Converte a coluna pmid para string para garantir match correto
        df_pub_antigo['pmid'] = df_pub_antigo['pmid'].astype(str)
        print(f"- Lidos {len(df_pub_antigo)} artigos existentes.")
    else:
        df_pub_antigo = pd.DataFrame()
        print("- Arquivo publicacoes.csv não existia, criando novo.")

    df_pub_novo = pd.DataFrame(lista_publicacoes)
    if not df_pub_novo.empty:
        df_pub_novo['pmid'] = df_pub_novo['pmid'].astype(str)
        # Concatena novo + antigo
        df_pub_final = pd.concat([df_pub_antigo, df_pub_novo], ignore_index=True)
        # Remove duplicatas mantendo a última versão (a nova, que tem abstract)
        df_pub_final = df_pub_final.drop_duplicates(subset=['pmid'], keep='last')
    else:
        df_pub_final = df_pub_antigo

    df_pub_final.to_csv("publicacoes.csv", index=False)
    print(f"✅ publicacoes.csv atualizado: {len(df_pub_final)} registros totais.")

    # --- Vinculos.csv ---
    if os.path.exists("vinculos.csv"):
        df_vin_antigo = pd.read_csv("vinculos.csv")
        df_vin_antigo['pmid'] = df_vin_antigo['pmid'].astype(str)
        print(f"- Lidos {len(df_vin_antigo)} vínculos existentes.")
    else:
        df_vin_antigo = pd.DataFrame()

    df_vin_novo = pd.DataFrame(novos_vinculos)
    if not df_vin_novo.empty:
        df_vin_novo['pmid'] = df_vin_novo['pmid'].astype(str)
        # Concatena
        df_vin_final = pd.concat([df_vin_antigo, df_vin_novo], ignore_index=True)
        # Remove duplicatas exatas (mesmo pmid e mesmo id_professor)
        df_vin_final = df_vin_final.drop_duplicates(subset=['pmid', 'id_professor'])
    else:
        df_vin_final = df_vin_antigo
        
    df_vin_final.to_csv("vinculos.csv", index=False)
    print(f"✅ vinculos.csv atualizado: {len(df_vin_final)} conexões totais.")
    
    print("\n🚀 Processo concluído com sucesso!")

if __name__ == "__main__":
    rodar_coleta()