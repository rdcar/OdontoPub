import requests
import xml.etree.ElementTree as ET
import time
import pandas as pd

# ----------------- CONFIGURAÇÕES -----------------
ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
EMAIL = "renatodc89@gmail.com" # Atualizado com o seu e-mail
ARQUIVO_PROFESSORES = "professores.csv"
DELAY_SECS = 0.4

# ----------------- FUNÇÕES -----------------

def safe_get(url, params):
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        return r
    except requests.RequestException as e:
        print("Erro na requisição:", e)
        return None

def parse_pubmed_xml(xml_content, professor_alvo):
    try:
        root = ET.fromstring(xml_content)
    except Exception as e:
        print("Erro ao parsear XML:", e)
        return []

    artigos = []

    for article in root.findall(".//PubmedArticle"):
        pmid = article.findtext(".//PMID") or "N/A"
        title = article.findtext(".//ArticleTitle") or "Sem título"
        
        # Extração do Nome da Revista (Periódico)
        revista = article.findtext(".//Journal/Title") or "N/A"

        year = article.findtext(".//PubDate/Year")
        if year is None:
            medline_date = article.findtext(".//PubDate/MedlineDate")
            year = medline_date[:4] if medline_date else "N/A"

        doi_elem = article.find(".//ArticleId[@IdType='doi']")
        doi = doi_elem.text if doi_elem is not None else "N/A"

        autores = []
        for a in article.findall(".//Author"):
            last = a.findtext("LastName") or ""
            init = a.findtext("Initials") or ""
            nome_autor = f"{last} {init}".strip()
            if nome_autor:
                autores.append(nome_autor)

        artigos.append({
            "PMID": pmid,
            "DOI": doi,
            "Titulo": title,
            "Revista": revista, # Nova Coluna
            "Ano": year,
            "Autores": "; ".join(autores),
            "professor_responsavel": professor_alvo,
            "Link": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        })

    return artigos

def buscar_por_professor(nome):
    query = f"{nome}[Author]"
    print(f"Buscando: {nome}...")

    params_search = {
        "db": "pubmed",
        "term": query,
        "usehistory": "y",
        "retmode": "xml",
        "email": EMAIL
    }

    res = safe_get(ESEARCH_URL, params_search)
    if res is None:
        return []

    root = ET.fromstring(res.text)
    count = int(root.findtext("Count") or 0)
    if count == 0:
        return []

    webenv = root.findtext("WebEnv")
    query_key = root.findtext("QueryKey")

    params_fetch = {
        "db": "pubmed",
        "query_key": query_key,
        "WebEnv": webenv,
        "retmode": "xml",
        "email": EMAIL
    }

    res_fetch = safe_get(EFETCH_URL, params_fetch)
    if res_fetch is None:
        return []

    return parse_pubmed_xml(res_fetch.text, nome)

# ----------------- EXECUÇÃO -----------------
try:
    df_prof = pd.read_csv(ARQUIVO_PROFESSORES)
    todas_publicacoes = []

    for nome in df_prof["nome"]:
        resultados = buscar_por_professor(nome)
        todas_publicacoes.extend(resultados)
        time.sleep(DELAY_SECS)

    if not todas_publicacoes:
        print("Nenhuma publicação encontrada.")
    else:
        df_final = pd.DataFrame(todas_publicacoes)

        # Agrupamento ajustado para incluir a Revista
        df_final = (
            df_final
            .groupby(["PMID", "professor_responsavel"], as_index=False)
            .agg({
                "DOI": "first",
                "Titulo": "first",
                "Revista": "first", # Garantindo a revista no CSV final
                "Ano": "first",
                "Autores": "first",
                "Link": "first"
            })
        )

        df_final.to_csv("publicacoes.csv", index=False)
        print(f"\nSucesso! {len(df_final)} vínculos de artigos encontrados com nomes de revistas.")

except Exception as e:
    print(f"Erro geral: {e}")