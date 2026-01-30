import requests
import xml.etree.ElementTree as ET
import time
import pandas as pd
import os
import unicodedata

# ----------------- CONFIGURAÇÕES -----------------
ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
EMAIL = "renatodc89@gmail.com"
DELAY_SECS = 1

# ----------------- FUNÇÕES DE APOIO -----------------

def normalizar_texto(texto):
    """Normalize text: lowercase, remove accents, and common particles."""
    if not texto: return ""
    # Remove acentos
    n = unicodedata.normalize('NFD', texto)
    n = n.encode('ascii', 'ignore').decode("utf-8")
    n = n.lower()
    # Remove partículas comuns de nomes em português e caracteres especiais
    for p in [" de ", " da ", " do ", " dos ", " das ", " e "]:
        n = n.replace(p, " ")
    return n.strip()

def safe_get(url, params=None, data=None):
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
    if not pmids_lista: return []
    
    data = {
        "db": "pubmed",
        "id": ",".join(pmids_lista),
        "retmode": "xml",
        "email": EMAIL
    }
    
    res = safe_get(EFETCH_URL, data=data)
    
    if res is None:
        return []

    root = ET.fromstring(res.text)
    artigos_data = []

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

        # Lista de autores para o banco de dados
        autores_nomes = []
        for a in article.findall(".//Author"):
            last = a.findtext("LastName") or ""
            init = a.findtext("Initials") or ""
            autores_nomes.append(f"{last} {init}".strip())

        artigos_data.append({
            "pmid": pmid,
            "doi": doi,
            "titulo": title,
            "revista": revista,
            "ano": year,
            "autores_string": "; ".join(autores_nomes),
            "autores_lista": autores_nomes # lista real para o matcher
        })
    return artigos_data

# ----------------- EXECUÇÃO PRINCIPAL -----------------

def rodar_coleta():
    # 1. Carregar Professores
    df_prof = pd.read_csv("professores.csv")
    pmids_para_coletar = set()
    
    # 2. Coletar PMIDs Manuais (se houver arquivo)
    if os.path.exists("pmids_manuais.txt"):
        with open("pmids_manuais.txt", "r") as f:
            manuais = [line.strip() for line in f if line.strip()]
            pmids_para_coletar.update(manuais)
            print(f"✅ {len(manuais)} PMIDs manuais adicionados.")

    # 3. Buscar PMIDs por Variantes de Nome (Automático)
    for index, row in df_prof.iterrows():
        variantes = str(row['variantes']).split(';')
        for v in variantes:
            v = v.strip()
            if not v: continue
            print(f"Buscando PubMed para: {v}...")
            params = {"db": "pubmed", "term": f"{v}[Author]", "retmode": "json", "email": EMAIL}
            res = safe_get(ESEARCH_URL, params)
            if res:
                data = res.json()
                id_list = data.get("esearchresult", {}).get("idlist", [])
                pmids_para_coletar.update(id_list)
            time.sleep(DELAY_SECS)

    # 4. Baixar Metadados de todos os PMIDs únicos encontrados
    print(f"📥 Baixando metadados de {len(pmids_para_coletar)} artigos únicos...")
    todos_artigos = obter_metadados_pubmed(list(pmids_para_coletar))

    # 5. Lógica de Vínculos (Matching)
    vinculos = []
    publicacoes_final = []

    for art in todos_artigos:
        # Adiciona o artigo à lista de publicações (apenas dados do artigo)
        publicacoes_final.append({
            "pmid": art['pmid'],
            "doi": art['doi'],
            "titulo": art['titulo'],
            "revista": art['revista'],
            "ano": art['ano'],
            "autores": art['autores_string']
        })

        # Verifica quais professores da nossa base estão neste artigo
        for _, prof in df_prof.iterrows():
            variantes_prof = [normalizar_texto(v) for v in str(prof['variantes']).split(';')]
            autores_artigo_norm = [normalizar_texto(a) for a in art['autores_lista']]
            
            # Match flexível: qualquer variante do professor contida em qualquer autor do artigo (ou vice-versa)
            match_encontrado = False
            for v in variantes_prof:
                if not v: continue
                for a in autores_artigo_norm:
                    if not a: continue
                    # Verifica se v é uma sub-string de a ou vice-versa (ex: "gurgel bc" in "vasconcelos gurgel bc")
                    if v == a or (len(v) > 5 and (v in a or a in v)):
                        match_encontrado = True
                        break
                if match_encontrado: break

            if match_encontrado:
                vinculos.append({
                    "pmid": art['pmid'],
                    "id_professor": prof['id_professor']
                })

    # 6. Salvar Arquivos
    pd.DataFrame(publicacoes_final).drop_duplicates(subset="pmid").to_csv("publicacoes.csv", index=False)
    pd.DataFrame(vinculos).drop_duplicates().to_csv("vinculos.csv", index=False)
    
    print("\n🚀 Sincronização concluída!")
    print(f"- {len(publicacoes_final)} artigos únicos em publicacoes.csv")
    print(f"- {len(vinculos)} conexões criadas em vinculos.csv")

if __name__ == "__main__":
    rodar_coleta()
