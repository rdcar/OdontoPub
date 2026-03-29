from fastapi import FastAPI, HTTPException, Query, Body, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from contextlib import asynccontextmanager
import pandas as pd
from typing import List, Optional
import os
import smtplib
import shutil
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Lifespan Handler ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load data on startup
    load_data()
    yield
    # Clean up on shutdown if needed
    pass

app = FastAPI(title="OdontoPub API", version="2.0", lifespan=lifespan)

# Import and include Admin Routes
from .admin_routes import router as admin_router
app.include_router(admin_router, prefix="/api/admin")

# --- Models ---
class ContactForm(BaseModel):
    name: str
    email: str
    subject: str
    message: str
    
# --- Email Configuration ---
# Para Railway (ou outro cloud que bloqueie porta 587), use SMTP_SSL na porta 465.
# Se migrar para VPS próprio, descomente a seção STARTTLS e comente a seção SSL.
SMTP_SERVER = "smtp.gmail.com"
# SMTP_PORT_SSL = 465      # Porta SSL (Railway-compatible)
SMTP_PORT_TLS = 587    # Porta STARTTLS (para VPS/local — descomente se precisar)
SENDER_EMAIL = os.getenv("EMAIL_USER") 
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD") 

# Check for crucial configuration
if not SENDER_PASSWORD:
    print("⚠️  AVISO: EMAIL_PASSWORD não definido nas variáveis de ambiente (.env). O envio de e-mails falhará.")

@app.post("/contact")
def send_contact_email(form: ContactForm):
    """
    Receives contact form data and sends an email to the administrator.
    """
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = "renatodc89@gmail.com"
        msg['Subject'] = f"[OdontoPub Contato] {form.subject}"

        body = f"""
        Mensagem recebida pelo formulário de contato do OdontoPub:
        
        Nome: {form.name}
        Email: {form.email}
        Assunto: {form.subject}
        
        Mensagem:
        {form.message}
        """
        msg.attach(MIMEText(body, 'plain'))

        # Connect to server
        if SENDER_PASSWORD and SENDER_PASSWORD != "your_app_password_here":
            # O código abaixo detecta qual porta foi descomentada acima e usa o protocolo correto.
            # Se SMTP_PORT_SSL estiver definido, usa SSL (Porta 465).
            # Se apenas SMTP_PORT_TLS estiver definido, usa STARTTLS (Porta 587).
            
            try:
                if 'SMTP_PORT_SSL' in locals() or 'SMTP_PORT_SSL' in globals():
                    server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT_SSL)
                    server.login(SENDER_EMAIL, SENDER_PASSWORD)
                    print(f"✅ Email enviado via SMTP_SSL (porta {SMTP_PORT_SSL}).")
                else:
                    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT_TLS)
                    server.starttls()
                    server.login(SENDER_EMAIL, SENDER_PASSWORD)
                    print(f"✅ Email enviado via STARTTLS (porta {SMTP_PORT_TLS}).")
                
                text = msg.as_string()
                server.sendmail(SENDER_EMAIL, "renatodc89@gmail.com", text)
                server.quit()
            except NameError as ne:
                print(f"⚠️ Erro de configuração: Nenhuma porta SMTP definida (SSL ou TLS). {ne}")
                raise HTTPException(status_code=500, detail="Configuração de email incompleta.")
        else:
            print("⚠️ Email não enviado: Senha de aplicativo não configurada (EMAIL_PASSWORD).")
        
        # Log for detailed debug
        print("--------------- EMAIL LOG ---------------")
        print(f"From: {form.email}")
        print(f"To: renatodc89@gmail.com")
        print(f"Subject: [OdontoPub Contato] {form.subject}")
        print(f"Body: {body.strip()}")
        print("-----------------------------------------")
        
        return {"message": "Mensagem enviada com sucesso!"}
        
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail="Erro ao enviar mensagem.")


# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static assets (photos)
# Path to assets relative to this script: ../assets
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")

if not os.path.exists(ASSETS_DIR):
    os.makedirs(ASSETS_DIR, exist_ok=True)
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

# Global Dataframes (loaded on startup for performance)
df_prof = None
df_pub = None
df_vin = None
df_proj = None
df_qualis = None

def load_qualis():
    """Carrega o arquivo de Qualis e cria um dicionário de ISSN -> Estrato"""
    global df_qualis
    qualis_path = os.path.join(BASE_DIR, "qualis_odontologia.csv")
    if os.path.exists(qualis_path):
        try:
            # Lê o CSV com tratamento de BOM (utf-8-sig)
            df = pd.read_csv(qualis_path, encoding='utf-8-sig')
            # Normaliza ISSN (remove traços e espaços) para comparação
            df['issn_clean'] = df['ISSN'].astype(str).str.replace('-', '').str.replace(' ', '').str.upper()
            df_qualis = df.set_index('issn_clean')['Estrato'].to_dict()
            print(f"[OK] Qualis carregado: {len(df_qualis)} revistas.")
        except Exception as e:
            print(f"[ERROR] Erro ao carregar Qualis: {e}")
            df_qualis = {}
    else:
        print("[WARN] Arquivo qualis_odontologia.csv não encontrado.")
        df_qualis = {}

def get_qualis_stratum(issn_str):
    """
    Retorna o melhor estrato Qualis para uma string que pode conter múltiplos ISSNs 
    separados por ';'. Tenta o match para cada um e retorna o melhor.
    """
    if not issn_str or issn_str == "N/A" or not df_qualis:
        return "N/A"
    
    # Ordem de importância do Qualis
    hierarchy = {"A1": 1, "A2": 2, "A3": 3, "A4": 4, "B1": 5, "B2": 6, "B3": 7, "B4": 8, "N/A": 9}
    
    # Divide a string em diversos ISSNs (PubMed costuma enviar Print e Electronic)
    issns = [i.strip() for i in str(issn_str).split(';') if i.strip()]
    
    results = []
    for issn in issns:
        # Normaliza cada ISSN
        issn_clean = issn.replace('-', '').replace(' ', '').upper()
        res = df_qualis.get(issn_clean, "N/A")
        results.append(res)
    
    if not results:
        return "N/A"
    
    # Ordena os resultados pela hierarquia e pega o melhor (o que tem menor valor numérico)
    best_stratum = min(results, key=lambda x: hierarchy.get(x, 9))
    return best_stratum

def load_data():
    global df_prof, df_pub, df_vin, df_proj, df_qualis
    import traceback
    
    # Initialize with empty DataFrames to prevent crashes if files are missing or broken
    df_prof = pd.DataFrame(columns=["id_professor", "nome", "categoria", "atuacao"])
    df_pub = pd.DataFrame(columns=["pmid", "doi", "titulo", "revista", "ano", "autores", "abstract", "issn", "qualis"])
    df_vin = pd.DataFrame(columns=["pmid", "id_professor"])
    df_proj = pd.DataFrame(columns=["professor_nome", "ano", "titulo"])
    
    try:
        print("--- Iniciando carregamento de dados ---")
        # Log to file for verification if print is buffered
        with open(os.path.join(BASE_DIR, "backend_startup.log"), "a") as f:
            f.write(f"\n[{pd.Timestamp.now()}] Iniciando carregamento de dados...\n")
        # Load Qualis first
        load_qualis()

        # Load CSVs from root directory
        prof_path = os.path.join(BASE_DIR, "professores.csv")
        pub_path = os.path.join(BASE_DIR, "publicacoes.csv")
        vin_path = os.path.join(BASE_DIR, "vinculos.csv")

        if os.path.exists(prof_path):
            print(f"Lendo {prof_path}...")
            # Forçamos lattes_id como string para evitar perda de precisão em números de 16 dígitos
            df_prof = pd.read_csv(prof_path, dtype={'lattes_id': str})
        else:
            print(f"[WARN] {prof_path} não encontrado.")

        if os.path.exists(pub_path):
            print(f"Lendo {pub_path}...")
            df_pub = pd.read_csv(pub_path)
            # Converte para string para evitar erros de tipo em filtros e buscas
            df_pub['pmid'] = df_pub['pmid'].astype(str).str.strip()
        else:
            print(f"[WARN] {pub_path} não encontrado.")

        if os.path.exists(vin_path):
            print(f"Lendo {vin_path}...")
            df_vin = pd.read_csv(vin_path)
            
            # Garantir integridade referencial (remover órfãos)
            if not df_pub.empty and not df_vin.empty:
                original_count = len(df_vin)
                # Converte para string para garantir match
                df_vin['pmid'] = df_vin['pmid'].astype(str).str.strip()
                pub_pmids = set(df_pub['pmid'].astype(str).str.strip().unique())
                
                df_vin = df_vin[df_vin['pmid'].isin(pub_pmids)]
                removed = original_count - len(df_vin)
                if removed > 0:
                    print(f"[DATA INTEGRITY] Removidos {removed} vínculos órfãos (PMIDs não encontrados em publicacoes.csv).")
        else:
            print(f"[WARN] {vin_path} não encontrado.")
        
        # Load Projects if exists
        proj_path = os.path.join(BASE_DIR, "projetos.csv")
        if os.path.exists(proj_path):
             print(f"Lendo {proj_path}...")
             df_proj = pd.read_csv(proj_path)
             df_proj = df_proj.fillna("")
        else:
             print("Aviso: projetos.csv não encontrado.")
             df_proj = pd.DataFrame(columns=["professor_nome", "ano", "titulo"])
        
        # Ensure new columns exist even if CSV is old format (safety)
        if 'atuacao' not in df_prof.columns:
            df_prof['atuacao'] = ""
        
        # Ensure ISSN column exists in publications
        if 'issn' not in df_pub.columns:
            df_pub['issn'] = "N/A"

        # Apply Qualis to Publications (New column 'qualis')
        print("Mapeando Qualis para publicações...")
        df_pub['qualis'] = df_pub['issn'].apply(get_qualis_stratum)
            
        # Helper: Fill NaNs
        df_prof = df_prof.fillna("")
        df_pub = df_pub.fillna("")
        
        # --- Calculate Per-Professor Qualis Stats ---
        print("Calculando estatísticas de Qualis por professor...")
        qualis_stats_list = []
        for _, prof in df_prof.iterrows():
            prof_id = prof['id_professor']
            # Find pubs for this professor
            prof_vin = df_vin[df_vin['id_professor'] == prof_id]
            prof_pmids = prof_vin['pmid'].astype(str).tolist()
            prof_pubs = df_pub[df_pub['pmid'].astype(str).isin(prof_pmids)]
            
            # Count Qualis
            counts = prof_pubs['qualis'].value_counts().to_dict()
            # Ensure keys
            stats = {
                "A1": int(counts.get("A1", 0)),
                "A2": int(counts.get("A2", 0)),
                "A3": int(counts.get("A3", 0)),
                "A4": int(counts.get("A4", 0)),
                "B1": int(counts.get("B1", 0)),
                "B2": int(counts.get("B2", 0)),
                "B3": int(counts.get("B3", 0)),
                "B4": int(counts.get("B4", 0)),
                "N/A": int(counts.get("N/A", 0))
            }
            qualis_stats_list.append(stats)
        
        df_prof['qualis_stats'] = qualis_stats_list
        
        # SORT PROFESSORS ALPHABETICALLY
        if not df_prof.empty:
            df_prof = df_prof.sort_values(by="nome").reset_index(drop=True)
        print("[OK] Dados carregados com sucesso!")
        
    except Exception as e:
        print(f"[ERROR] ERRO CRÍTICO no carregamento de dados: {e}")
        traceback.print_exc()
        # Fallback empty data is already set at start of function


@app.get("/")
def read_root():
    return {"message": "OdontoPub API is running"}

@app.get("/professores")
def get_professores(
    nome: Optional[str] = None, 
    atuacao: Optional[str] = None
):
    """
    Returns list of professors with basic info.
    Supports filtering by name (partial) and area (atuacao).
    """
    if df_prof is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    result = df_prof.copy()
    
    if nome:
        result = result[result['nome'].str.contains(nome, case=False, na=False)]
    
    if atuacao:
        result = result[result['atuacao'].str.contains(atuacao, case=False, na=False)]
        
    # Convert to list of dicts
    return result.to_dict(orient="records")

@app.get("/professores/{id_professor}")
def get_professor_details(id_professor: int):
    """
    Returns full details for a professor: bio, stats, and publications.
    """
    if df_prof is None:
         raise HTTPException(status_code=500, detail="Data not loaded")

    prof = df_prof[df_prof['id_professor'] == id_professor]
    if prof.empty:
        raise HTTPException(status_code=404, detail="Professor not found")
    
    prof_data = prof.iloc[0].to_dict()
    
    # Get Publications
    # Link: Professor -> Vinculos -> Publicacoes
    vinculos = df_vin[df_vin['id_professor'] == id_professor]
    pmids = vinculos['pmid'].astype(str).tolist()
    
    # Filter Pubs (ensure types match for merge/isin)
    # Convert Pub PMID to str to match
    pubs = df_pub[df_pub['pmid'].astype(str).isin(pmids)].copy()
    
    # Sort by year desc
    try:
        pubs = pubs.sort_values(by="ano", ascending=False)
    except:
        pass # Handle messy year data if any

    prof_data['publicacoes'] = pubs.to_dict(orient="records")
    
    # Simple Stats
    prof_data['total_publicacoes'] = len(pubs)
    
    return prof_data

@app.get("/graph")
def get_graph_data():
    """
    Returns nodes and links for force-directed graph.
    Nodes: Professors
    Links: Shared publications (Co-authorship)
    """
    if df_prof is None or df_vin is None:
        raise HTTPException(status_code=500, detail="Data not loaded")

    # Calculate publication counts per professor
    pub_counts = df_vin.groupby('id_professor').size().to_dict()

    # Nodes
    nodes = df_prof[['id_professor', 'nome', 'atuacao', 'categoria']].to_dict(orient="records")
    # Rename for graph lib compatibility commonly used (id, label)
    for n in nodes:
        n['id'] = n['id_professor']
        n['label'] = n['nome']
        # Photo URL logic: defaults to local asset
        n['photo'] = f"/assets/{n['nome']}.jpg"
        # Add publication count for node sizing
        n['total_publicacoes'] = pub_counts.get(n['id_professor'], 0) 

    # Links (Co-authorship)
    # Self-join vinculos on pmid
    # This is heavy for large datasets but ok for hundreds of refs
    # v1: pmid, prof_a | v2: pmid, prof_b
    # v1: pmid, prof_a | v2: pmid, prof_b
    df_vin_str = df_vin.copy()
    df_vin_str['pmid'] = df_vin_str['pmid'].astype(str)
    
    merged = pd.merge(df_vin_str, df_vin_str, on="pmid")
    # Filter where prof_a < prof_b to avoid duplicates and self-loops
    coauth = merged[merged['id_professor_x'] < merged['id_professor_y']]
    
    # Count weights
    links_df = coauth.groupby(['id_professor_x', 'id_professor_y']).size().reset_index(name='weight')
    
    links = []
    for _, row in links_df.iterrows():
        links.append({
            "source": int(row['id_professor_x']),
            "target": int(row['id_professor_y']),
            "value": int(row['weight'])
        })

    return {"nodes": nodes, "links": links}

@app.get("/collaborations/{id_professor}")
def get_collaborations(id_professor: int):
    """
    Returns collaboration data for a specific professor.
    Includes list of collaborators with shared publication counts and details.
    """
    if df_prof is None or df_vin is None or df_pub is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    # Get professor info
    prof = df_prof[df_prof['id_professor'] == id_professor]
    if prof.empty:
        raise HTTPException(status_code=404, detail="Professor not found")
    
    # Convert professor info to native Python types
    prof_row = prof.iloc[0]
    prof_info = {
        'id_professor': int(prof_row['id_professor']),
        'nome': str(prof_row['nome']) if pd.notna(prof_row['nome']) else '',
        'categoria': str(prof_row['categoria']) if pd.notna(prof_row['categoria']) else '',
        'atuacao': str(prof_row['atuacao']) if pd.notna(prof_row['atuacao']) else ''
    }
    
    # Get all publications for this professor
    prof_pubs = df_vin[df_vin['id_professor'] == id_professor]['pmid'].unique()
    
    # Find collaborators (other professors who share publications)
    collaborators = []
    all_shared_pmids = set()
    
    for _, other_prof in df_prof.iterrows():
        if other_prof['id_professor'] == id_professor:
            continue
            
        other_id = int(other_prof['id_professor'])
        other_pubs = df_vin[df_vin['id_professor'] == other_id]['pmid'].unique()
        
        # Find shared publications
        shared_pmids = set(prof_pubs) & set(other_pubs)
        
        if shared_pmids:
            all_shared_pmids.update(shared_pmids)
            # Get publication details
            shared_pubs = []
            for pmid in shared_pmids:
                pub_data = df_pub[df_pub['pmid'] == pmid]
                if not pub_data.empty:
                    pub = pub_data.iloc[0]
                    # Convert all values to native Python types
                    title = pub.get('titulo', '') 
                    title = str(title) if pd.notna(title) else ''
                    year = pub.get('ano', '')
                    year = str(year) if pd.notna(year) else ''
                    doi = pub.get('doi', '')
                    doi = str(doi) if pd.notna(doi) else ''
                    abstract = pub.get('abstract', '')
                    abstract = str(abstract) if pd.notna(abstract) else ''
                    
                    shared_pubs.append({
                        'pmid': str(pmid),
                        'title': title,
                        'year': year,
                        'doi': doi,
                        'abstract': abstract
                    })
            
            # Sort by year descending
            shared_pubs.sort(key=lambda x: x.get('year', ''), reverse=True)
            
            collaborators.append({
                'id_professor': other_id,
                'nome': str(other_prof['nome']) if pd.notna(other_prof['nome']) else '',
                'categoria': str(other_prof['categoria']) if pd.notna(other_prof['categoria']) else '',
                'atuacao': str(other_prof['atuacao']) if pd.notna(other_prof['atuacao']) else '',
                'shared_count': len(shared_pmids),
                'publications': shared_pubs
            })
    
    # Sort collaborators by shared publication count (descending)
    collaborators.sort(key=lambda x: x['shared_count'], reverse=True)
    
    return {
        'professor': prof_info,
        'collaborators': collaborators,
        'total_collaborators': len(collaborators),
        'total_shared_publications': len(all_shared_pmids)
    }

@app.get("/projetos")
def get_projetos():
    """
    Returns list of professors with their research projects.
    """
    if df_prof is None or df_proj is None:
        raise HTTPException(status_code=500, detail="Data not loaded")

    proj_groups = df_proj.groupby("professor_nome")
    results = []
    
    for _, prof in df_prof.iterrows():
        name = prof['nome']
        projects = []
        
        # Check if professor has projects (Name match)
        # Note: df_proj names are UPPERCASE from extraction. df_prof names are UPPERCASE.
        if name in proj_groups.groups:
            p_df = proj_groups.get_group(name)
            # Sort by year desc
            # Check if 'ano' is numeric or string, handle nicely
            try:
                p_df = p_df.sort_values(by="ano", ascending=False)
            except:
                pass
            # Normalize titles to UPPERCASE
            projects = p_df[['ano', 'titulo']].to_dict(orient="records")
            for p in projects:
                if p['titulo']:
                    p['titulo'] = str(p['titulo']).upper()
            
        if projects:
            results.append({
                "id_professor": prof['id_professor'],
                "nome": name,
                "atuacao": prof['atuacao'],
                "categoria": prof['categoria'],
                "projetos": projects
            })
            
    # Sort results by professor name
    results.sort(key=lambda x: x['nome'])
    
    return results

@app.get("/stats")
def get_stats(
    ano: Optional[str] = None,
    atuacao: Optional[str] = None
):
    """
    Returns general statistics for the dashboard.
    Supports filtering by year (ano) and area of activity (atuacao).
    """
    if df_prof is None or df_pub is None or df_vin is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    # Base dataframes
    pubs = df_pub.copy()
    profs = df_prof.copy()
    vinculos = df_vin.copy()

    # Apply filters
    if ano and ano != "null" and ano != "":
        try:
            # We treat 'ano' as string in filter to match df_pub['ano'] which was cast to str or handle either
            pubs = pubs[pubs['ano'].astype(str) == str(ano)]
        except Exception as e:
            print(f"Filter error (ano): {e}")

    if atuacao and atuacao != "null" and atuacao != "":
        # Filter profs first
        profs = profs[profs['atuacao'].str.contains(atuacao, case=False, na=False)]
        # Filter vinculos to only include these professors
        prof_ids = set(profs['id_professor'].unique())
        vinculos = vinculos[vinculos['id_professor'].isin(prof_ids)]
        # BUG FIX: Filter pubs to only include PMIDs from these professors
        valid_pmids = set(vinculos['pmid'].astype(str).unique())
        pubs = pubs[pubs['pmid'].astype(str).isin(valid_pmids)]
    
    # Recalculate vinculos based on filtered pubs if year filter is applied (ensures consistency)
    if ano:
        valid_pmids = set(pubs['pmid'].unique())
        vinculos = vinculos[vinculos['pmid'].astype(str).isin(valid_pmids)]

    # 1. Qualis Distribution
    q_counts = pubs['qualis'].value_counts().to_dict()
    q_dist = {
        "A1": int(q_counts.get("A1", 0)),
        "A2": int(q_counts.get("A2", 0)),
        "A3": int(q_counts.get("A3", 0)),
        "A4": int(q_counts.get("A4", 0)),
        "B1": int(q_counts.get("B1", 0)),
        "B2": int(q_counts.get("B2", 0)),
        "B3": int(q_counts.get("B3", 0)),
        "B4": int(q_counts.get("B4", 0)),
        "N/A": int(q_counts.get("N/A", 0))
    }

    # 2. Top Journals
    top_journals = pubs['revista'].value_counts().head(20).to_dict()

    # 3. Publications by Year (Evolution) - UNFILTERED as per user request
    try:
        years_evolution = df_pub['ano'].value_counts().sort_index().to_dict()
    except:
        years_evolution = {}

    # 4. Top 15 Researchers (by total publications in the current context)
    df_merged = pd.merge(vinculos, profs[['id_professor', 'nome']], on='id_professor')
    top_researchers = df_merged['nome'].value_counts().head(15).to_dict()

    # 5. Get available years and areas for filter population
    all_years = sorted(df_pub['ano'].unique().tolist(), reverse=True)
    all_areas = sorted([a for a in df_prof['atuacao'].unique().tolist() if a])

    return {
        "total_professores": len(profs),
        "total_publicacoes": len(pubs['pmid'].unique()),
        "total_projetos": len(df_proj) if df_proj is not None else 0, # Projects aren't strictly linked to individual year filtering in this view yet
        "qualis_distribution": q_dist,
        "top_journals": top_journals,
        "publications_by_year": years_evolution,
        "top_researchers": top_researchers,
        "available_years": all_years,
        "available_areas": all_areas
    }

@app.get("/publicacoes/busca")
def search_publications(q: str = Query(..., min_length=2)):
    """
    Search for publications globally across all professors.
    """
    if df_pub is None or df_vin is None or df_prof is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    q = q.lower()
    
    # Filter df_pub
    # We want to match title, authors, year, pmid, doi, journal
    mask = (
        df_pub['titulo'].str.lower().str.contains(q, na=False) |
        df_pub['autores'].str.lower().str.contains(q, na=False) |
        df_pub['ano'].astype(str).str.contains(q, na=False) |
        df_pub['pmid'].astype(str).str.contains(q, na=False) |
        df_pub['doi'].str.lower().str.contains(q, na=False) |
        df_pub['revista'].str.lower().str.contains(q, na=False)
    )
    
    results = df_pub[mask].head(50).copy() # Cap at 50 results
    
    # Join with vinculos to get professor names
    formatted_results = []
    for _, row in results.iterrows():
        # Get one professor associated with this pub for context
        vinculo = df_vin[df_vin['pmid'] == row['pmid']]
        prof_name = ""
        if not vinculo.empty:
            prof_id = vinculo.iloc[0]['id_professor']
            prof_info = df_prof[df_prof['id_professor'] == prof_id]
            if not prof_info.empty:
                prof_name = prof_info.iloc[0]['nome']
        
        formatted_results.append({
            'pmid': str(row['pmid']),
            'titulo': str(row['titulo']),
            'autores': str(row['autores']),
            'ano': str(row['ano']),
            'doi': str(row['doi']),
            'revista': str(row['revista']),
            'professor_name': prof_name
        })
        
@app.post("/contact")
async def contact_route(form: ContactForm):
    """
    Endpoint for contact form submission.
    """
    return await send_contact_email(form)

@app.post("/upload-template")
async def upload_template(file: UploadFile = File(...), professor_name: str = Form(...)):
    """
    Endpoint to receive filled CSV templates from professors.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Apenas arquivos .csv são permitidos")
    
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)
        
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = professor_name.replace(" ", "_").lower()
    # Sanitize safe_name for filename (extra precaution)
    safe_name = "".join([c for c in safe_name if c.isalnum() or c == '_'])
    
    filename = f"{timestamp}_{safe_name}.csv"
    file_path = os.path.join(upload_dir, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"[UPLOAD] Template recebido: {filename} de {professor_name}")
        return {"status": "success", "filename": filename}
    except Exception as e:
        print(f"[ERROR] Falha ao salvar upload: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao salvar arquivo")

# --- Static Files ---
# Serve professor photos, guideline images and templates from /assets
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
