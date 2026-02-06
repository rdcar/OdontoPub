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

    # Nodes
    nodes = df_prof[['id_professor', 'nome', 'atuacao', 'categoria']].to_dict(orient="records")
    # Rename for graph lib compatibility commonly used (id, label)
    for n in nodes:
        n['id'] = n['id_professor']
        n['label'] = n['nome']
        # Photo URL logic: defaults to local asset
        # Assuming photo filename matches name? User said: "correspond to name"
        # We need to sanitize name or match exactly. For now, sending raw name.
        n['photo'] = f"/assets/{n['nome']}.jpg" 

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
