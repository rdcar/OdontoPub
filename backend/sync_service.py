import requests
import xml.etree.ElementTree as ET
import time
import pandas as pd
import os
import unicodedata
from typing import List

# Import normalizer and PubMed credentials from existing data_manager if we want,
# but we can replicate cleanly here for the API to avoid CLI logic.

ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
EMAIL = os.getenv("EMAIL_USER", "renatodc89@gmail.com")
DELAY_SECS = 1.0

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def normalizar_texto(texto):
    if not texto: return ""
    n = unicodedata.normalize('NFD', str(texto))
    n = n.encode('ascii', 'ignore').decode("utf-8")
    n = n.lower()
    for p in [" de ", " da ", " do ", " dos ", " das ", " e "]:
        n = n.replace(p, " ")
    return n.strip()

def safe_get(url, params=None, data=None):
    for i in range(3):
        try:
            if data:
                r = requests.post(url, data=data, timeout=30)
            else:
                r = requests.get(url, params=params, timeout=30)
            r.raise_for_status()
            return r
        except Exception as e:
            print(f"Tentativa {i+1} falhou: {e}. Tentando novamente em {i+2}s...")
            time.sleep(i + 2) 
    return None

def obter_metadados_pubmed(pmids_lista):
    if not pmids_lista: return []
    tamanho_lote = 200
    todos_artigos = []

    for i in range(0, len(pmids_lista), tamanho_lote):
        lote = pmids_lista[i:i + tamanho_lote]
        data = {"db": "pubmed", "id": ",".join(lote), "retmode": "xml", "email": EMAIL}
        res = safe_get(EFETCH_URL, data=data)
        if res is None: continue

        try:
            root = ET.fromstring(res.text)
            for article in root.findall(".//PubmedArticle"):
                pmid = article.findtext(".//PMID")
                title = article.findtext(".//ArticleTitle") or "Sem título"
                revista = article.findtext(".//Journal/Title") or "N/A"
                
                year = article.findtext(".//PubDate/Year")
                if not year:
                    medline_date = article.findtext(".//PubDate/MedlineDate")
                    year = medline_date[:4] if medline_date else "N/A"

                doi_elem = article.find(".//ArticleId[@IdType='doi']")
                doi = doi_elem.text if doi_elem is not None else "N/A"

                autores_nomes = []
                for a in article.findall(".//Author"):
                    last = a.findtext("LastName") or ""
                    init = a.findtext("Initials") or ""
                    autores_nomes.append(f"{last} {init}".strip())

                issns = [i.text.strip() for i in article.findall(".//Journal/ISSN") if i.text]
                issn = "; ".join(set(issns)) if issns else "N/A"

                abstract_texts = []
                abstract_node = article.find(".//Abstract")
                if abstract_node is not None:
                    for abs_text in abstract_node.iter("AbstractText"):
                        full_text = "".join(abs_text.itertext()).strip()
                        label = abs_text.get("Label")
                        if label: full_text = f"{label}: {full_text}"
                        abstract_texts.append(full_text)
                
                abstract = " ".join(abstract_texts).strip() if abstract_texts else "N/A"

                todos_artigos.append({
                    "pmid": pmid, "doi": doi, "issn": issn, "titulo": title,
                    "revista": revista, "ano": year, "autores_string": "; ".join(autores_nomes),
                    "autores_lista": autores_nomes, "abstract": abstract
                })
        except ET.ParseError:
            pass
        time.sleep(DELAY_SECS)
        
    return todos_artigos

def run_sync_for_professor(id_professor: int, mode="variantes") -> dict:
    """
    Executa a coleta do PubMed sem a interação do usuário.
    mode: "variantes" ou "nome_exato"
    Returns um dict com métricas do que fez.
    """
    PROF_CSV = os.path.join(BASE_DIR, "professores.csv")
    if not os.path.exists(PROF_CSV):
        return {"error": "Sem professores"}

    df_prof = pd.read_csv(PROF_CSV)
    prof_row = df_prof[df_prof['id_professor'] == id_professor]
    if prof_row.empty:
        return {"error": "Professor não encontrado"}
    
    prof_data = prof_row.iloc[0]
    
    if mode == "nome_exato":
        termos = [str(prof_data['nome']).strip()]
    else:
        termos = str(prof_data['variantes']).split(';')
        
    termos = [t.strip() for t in termos if t.strip()]
    if not termos:
        return {"error": "Sem termos de busca válidos"}

    pmids_para_coletar = set()
    novos_vinculos = []
    
    # Busca 
    for t in termos:
        params = {"db": "pubmed", "term": f"{t}[Author]", "retmode": "json", "retmax": 1000, "email": EMAIL}
        res = safe_get(ESEARCH_URL, params)
        if res:
            data = res.json()
            id_list = data.get("esearchresult", {}).get("idlist", [])
            pmids_para_coletar.update(id_list)
            
            # Se for buscar por nome_exato, confia integralmente na API e já gera vínculo
            if mode == "nome_exato":
                for pmid in id_list:
                    novos_vinculos.append({"pmid": pmid, "id_professor": id_professor})
        time.sleep(DELAY_SECS)
        
    if not pmids_para_coletar:
        return {"status": "success", "fetched": 0, "novos_vinculos": 0}

    todos_artigos = obter_metadados_pubmed(list(pmids_para_coletar))
    lista_publicacoes = []
    
    for art in todos_artigos:
        lista_publicacoes.append({
            "pmid": art['pmid'], "doi": art['doi'], "issn": art.get('issn', 'N/A'),
            "titulo": art['titulo'], "revista": art['revista'], "ano": art['ano'], 
            "autores": art['autores_string'], "abstract": art.get('abstract', 'N/A')
        })

        if mode == "variantes":
            match_encontrado = False
            variantes_prof = [normalizar_texto(v) for v in str(prof_data['variantes']).split(';')]
            autores_artigo_norm = [normalizar_texto(a) for a in art['autores_lista']]
            
            for v in variantes_prof:
                if not v: continue
                for a in autores_artigo_norm:
                    if v == a or (len(v) > 5 and (v in a or a in v)):
                        match_encontrado = True
                        break
                if match_encontrado: break

            if match_encontrado:
                novos_vinculos.append({"pmid": art['pmid'], "id_professor": id_professor})

    # Saving
    PUB_CSV = os.path.join(BASE_DIR, "publicacoes.csv")
    VIN_CSV = os.path.join(BASE_DIR, "vinculos.csv")
    
    if os.path.exists(PUB_CSV):
        df_pub_antigo = pd.read_csv(PUB_CSV)
        df_pub_antigo['pmid'] = df_pub_antigo['pmid'].astype(str)
    else:
        df_pub_antigo = pd.DataFrame()

    df_pub_novo = pd.DataFrame(lista_publicacoes)
    if not df_pub_novo.empty:
        df_pub_novo['pmid'] = df_pub_novo['pmid'].astype(str)
        df_pub_final = pd.concat([df_pub_antigo, df_pub_novo], ignore_index=True)
        df_pub_final = df_pub_final.drop_duplicates(subset=['pmid'], keep='last')
    else:
        df_pub_final = df_pub_antigo
        
    df_pub_final.to_csv(PUB_CSV, index=False)

    if os.path.exists(VIN_CSV):
        df_vin_antigo = pd.read_csv(VIN_CSV)
        df_vin_antigo['pmid'] = df_vin_antigo['pmid'].astype(str)
    else:
        df_vin_antigo = pd.DataFrame()

    df_vin_novo = pd.DataFrame(novos_vinculos)
    if not df_vin_novo.empty:
        df_vin_novo['pmid'] = df_vin_novo['pmid'].astype(str)
        df_vin_final = pd.concat([df_vin_antigo, df_vin_novo], ignore_index=True)
        df_vin_final = df_vin_final.drop_duplicates(subset=['pmid', 'id_professor'])
    else:
        df_vin_final = df_vin_antigo
        
    df_vin_final.to_csv(VIN_CSV, index=False)
    
    # Reload server memory data
    try:
        from .main import load_data
        load_data()
    except Exception as e:
        print("Failed to auto reload memory", e)

    return {
        "status": "success",
        "fetched": len(lista_publicacoes),
        "novos_vinculos": len(df_vin_novo) if not df_vin_novo.empty else 0
    }
