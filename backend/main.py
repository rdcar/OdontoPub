from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
from typing import List, Optional
import os

app = FastAPI(title="OdontoPub API", version="2.0")

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

def load_data():
    global df_prof, df_pub, df_vin, df_proj
    try:
        # Load CSVs from root directory
        df_prof = pd.read_csv(os.path.join(BASE_DIR, "professores.csv"))
        df_pub = pd.read_csv(os.path.join(BASE_DIR, "publicacoes.csv"))
        df_vin = pd.read_csv(os.path.join(BASE_DIR, "vinculos.csv"))
        
        # Load Projects if exists
        proj_path = os.path.join(BASE_DIR, "projetos.csv")
        if os.path.exists(proj_path):
             df_proj = pd.read_csv(proj_path)
             df_proj = df_proj.fillna("")
        else:
             df_proj = pd.DataFrame(columns=["professor_nome", "ano", "titulo"])
        
        # Ensure new columns exist even if CSV is old format (safety)
        if 'linhas_pesquisas' not in df_prof.columns:
            df_prof['linhas_pesquisas'] = ""
        if 'atuacao' not in df_prof.columns:
            df_prof['atuacao'] = ""
            
        # Helper: Fill NaNs
        df_prof = df_prof.fillna("")
        df_pub = df_pub.fillna("")
        
        # SORT PROFESSORS ALPHABETICALLY
        df_prof = df_prof.sort_values(by="nome").reset_index(drop=True)
        
    except Exception as e:
        print(f"Error loading data: {e}")

@app.on_event("startup")
async def startup_event():
    load_data()

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
                "linhas_pesquisas": prof['linhas_pesquisas'],
                "categoria": prof['categoria'],
                "projetos": projects
            })
            
    # Sort results by professor name
    results.sort(key=lambda x: x['nome'])
    
    return results

@app.get("/stats")
def get_stats():
    """
    Returns general statistics for the dashboard.
    """
    if df_prof is None or df_pub is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    return {
        "total_professores": len(df_prof),
        "total_publicacoes": len(df_pub['pmid'].unique()),
        "total_projetos": len(df_proj) if df_proj is not None else 0
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
        
    return formatted_results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
