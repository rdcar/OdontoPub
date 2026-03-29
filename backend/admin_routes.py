import os
import shutil
import pandas as pd
import unicodedata
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional
from pydantic import BaseModel
from datetime import timedelta

# Import the auth functions
from .auth import (
    verify_password, 
    create_access_token, 
    ACCESS_TOKEN_EXPIRE_MINUTES, 
    get_current_admin,
    ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH,
    get_password_hash
)

router = APIRouter(tags=["Admin"])

# Helper function to reload global arrays in main.py
def trigger_reload():
    # Local import to prevent circular dependency
    from .main import load_data
    load_data()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROF_CSV = os.path.join(BASE_DIR, "professores.csv")
PUB_CSV = os.path.join(BASE_DIR, "publicacoes.csv")
VIN_CSV = os.path.join(BASE_DIR, "vinculos.csv")

# ================= AUTHENTICATION ================= #

@router.post("/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # We compare against the standard credentials in env
    if form_data.username != ADMIN_USERNAME:
        raise HTTPException(status_code=400, detail="Usuário ou senha incorretos")
    
    # Normally we do verify_password(form_data.password, ADMIN_PASSWORD_HASH),
    # but since ADMIN_PASSWORD is raw text in ENV, we can also check equality before hash,
    # or just use the verify function:
    if not verify_password(form_data.password, ADMIN_PASSWORD_HASH):
        if form_data.password != os.getenv("ADMIN_PASSWORD"): # Fallback for sanity
            raise HTTPException(status_code=400, detail="Usuário ou senha incorretos")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": ADMIN_USERNAME}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ================= PROFESSORES ================= #

class ProfessorCreate(BaseModel):
    nome: str
    lattes_id: Optional[str] = ""
    categoria: Optional[str] = ""
    variantes: Optional[str] = ""
    atuacao: Optional[str] = ""

class ProfessorUpdate(ProfessorCreate):
    pass

@router.get("/professores")
def list_professores(admin: str = Depends(get_current_admin)):
    if not os.path.exists(PROF_CSV):
        return []
    df = pd.read_csv(PROF_CSV, dtype={'lattes_id': str})
    return df.fillna("").to_dict(orient="records")

@router.post("/professores")
def add_professor(prof: ProfessorCreate, admin: str = Depends(get_current_admin)):
    df = pd.DataFrame()
    if os.path.exists(PROF_CSV):
        df = pd.read_csv(PROF_CSV, dtype={'lattes_id': str})
    
    # Auto-increment ID
    new_id = 1
    if not df.empty and 'id_professor' in df.columns:
        new_id = df['id_professor'].max() + 1
        
    new_row = {
        "id_professor": new_id,
        "nome": prof.nome,
        "lattes_id": prof.lattes_id,
        "categoria": prof.categoria,
        "variantes": prof.variantes,
        "atuacao": prof.atuacao
    }
    
    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    df.to_csv(PROF_CSV, index=False)
    trigger_reload()
    return {"message": "Professor adicionado com sucesso", "professor": new_row}

@router.put("/professores/{id_professor}")
def edit_professor(id_professor: int, prof: ProfessorUpdate, admin: str = Depends(get_current_admin)):
    if not os.path.exists(PROF_CSV):
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado")
        
    df = pd.read_csv(PROF_CSV, dtype={'lattes_id': str})
    idx = df.index[df['id_professor'] == id_professor].tolist()
    if not idx:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    df.at[idx[0], 'nome'] = prof.nome
    df.at[idx[0], 'lattes_id'] = prof.lattes_id
    df.at[idx[0], 'categoria'] = prof.categoria
    df.at[idx[0], 'variantes'] = prof.variantes
    df.at[idx[0], 'atuacao'] = prof.atuacao
    
    df.to_csv(PROF_CSV, index=False)
    trigger_reload()
    return {"message": "Professor atualizado com sucesso"}

@router.delete("/professores/{id_professor}")
def delete_professor(id_professor: int, admin: str = Depends(get_current_admin)):
    if not os.path.exists(PROF_CSV):
         raise HTTPException(status_code=404, detail="Arquivo nao encontrado")
         
    df_prof = pd.read_csv(PROF_CSV, dtype={'lattes_id': str})
    if id_professor not in df_prof['id_professor'].values:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
        
    # Remove from professors
    df_prof = df_prof[df_prof['id_professor'] != id_professor]
    df_prof.to_csv(PROF_CSV, index=False)
    
    # Remove from vinculos
    if os.path.exists(VIN_CSV):
        df_vin = pd.read_csv(VIN_CSV)
        df_vin = df_vin[df_vin['id_professor'] != id_professor]
        df_vin.to_csv(VIN_CSV, index=False)
        
    trigger_reload()
    return {"message": "Professor removido com sucesso"}

@router.post("/professores/{id_professor}/foto")
async def upload_professor_photo(
    id_professor: int, 
    file: UploadFile = File(...), 
    admin: str = Depends(get_current_admin)
):
    if not os.path.exists(PROF_CSV):
        raise HTTPException(status_code=404, detail="Banco de dados não encontrado")
        
    df = pd.read_csv(PROF_CSV)
    prof = df[df['id_professor'] == id_professor]
    
    if prof.empty:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
        
    nome = prof.iloc[0]['nome']
    
    # Normalize name to match getProfessorPhotoUrl in frontend
    # Lowercase, remove accents, remove strange chars, replace space with underscore
    n = unicodedata.normalize('NFD', nome)
    n = n.encode('ascii', 'ignore').decode('utf-8')
    n = n.lower()
    import re
    n = re.sub(r'[^a-z0-9\s_]', '', n)
    normalized_name = "_".join(n.split())
    
    assets_dir = os.path.join(BASE_DIR, "assets")
    os.makedirs(assets_dir, exist_ok=True)
    
    file_path = os.path.join(assets_dir, f"{normalized_name}.jpg")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"message": "Foto salva com sucesso", "filename": f"{normalized_name}.jpg"}

# ================= PUBLICACOES ================= #

class PublicacaoCreate(BaseModel):
    pmid: str
    doi: Optional[str] = "N/A"
    issn: Optional[str] = "N/A"
    titulo: str
    revista: str
    ano: str
    autores: str
    abstract: Optional[str] = "N/A"
    id_professor: int

class PublicacaoUpdate(BaseModel):
    doi: Optional[str] = "N/A"
    issn: Optional[str] = "N/A"
    titulo: str
    revista: str
    ano: str
    autores: str
    abstract: Optional[str] = "N/A"

@router.get("/publicacoes")
def list_publicacoes(limit: int = 100, pmid: Optional[str] = None, admin: str = Depends(get_current_admin)):
    if not os.path.exists(PUB_CSV):
        return []
    df = pd.read_csv(PUB_CSV)
    df = df.fillna("")
    
    if pmid:
        df = df[df['pmid'].astype(str).str.contains(pmid, na=False)]
        
    # Sort by year decrescent (optional)
    if 'ano' in df.columns:
        df = df.sort_values(by="ano", ascending=False)
        
    return df.head(limit).to_dict(orient="records")

@router.post("/publicacoes")
def add_publicacao(pub: PublicacaoCreate, admin: str = Depends(get_current_admin)):
    df_pub = pd.DataFrame()
    if os.path.exists(PUB_CSV):
        df_pub = pd.read_csv(PUB_CSV)
        
    df_vin = pd.DataFrame()
    if os.path.exists(VIN_CSV):
        df_vin = pd.read_csv(VIN_CSV)

    # Check if exists
    if not df_pub.empty and str(pub.pmid) in df_pub['pmid'].astype(str).values:
        # Just add vinculo
        pass
    else:
        # Add pub
        new_pub = {
            "pmid": pub.pmid, "doi": pub.doi, "issn": pub.issn,
            "titulo": pub.titulo, "revista": pub.revista,
            "ano": pub.ano, "autores": pub.autores, "abstract": pub.abstract
        }
        df_pub = pd.concat([df_pub, pd.DataFrame([new_pub])], ignore_index=True)
        df_pub.to_csv(PUB_CSV, index=False)
        
    # Add vinculo
    new_vin = {"pmid": pub.pmid, "id_professor": pub.id_professor}
    if not df_vin.empty:
        # Check if relation already exists
        exists = df_vin[(df_vin['pmid'].astype(str) == str(pub.pmid)) & (df_vin['id_professor'] == pub.id_professor)].index
        if len(exists) == 0:
            df_vin = pd.concat([df_vin, pd.DataFrame([new_vin])], ignore_index=True)
    else:
        df_vin = pd.DataFrame([new_vin])
        
    df_vin.to_csv(VIN_CSV, index=False)
    trigger_reload()
    return {"message": "Publicação adicionada/vinculada com sucesso"}

@router.put("/publicacoes/{pmid}")
def edit_publicacao(pmid: str, pub: PublicacaoUpdate, admin: str = Depends(get_current_admin)):
    if not os.path.exists(PUB_CSV):
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado")
        
    df = pd.read_csv(PUB_CSV)
    df['pmid'] = df['pmid'].astype(str).str.strip()
    idx = df.index[df['pmid'] == pmid].tolist()
    
    if not idx:
        raise HTTPException(status_code=404, detail="Publicação não encontrada")
        
    row = idx[0]
    df.at[row, 'titulo'] = pub.titulo
    df.at[row, 'doi'] = pub.doi
    df.at[row, 'issn'] = pub.issn
    df.at[row, 'revista'] = pub.revista
    df.at[row, 'ano'] = pub.ano
    df.at[row, 'autores'] = pub.autores
    df.at[row, 'abstract'] = pub.abstract
    
    df.to_csv(PUB_CSV, index=False)
    trigger_reload()
    return {"message": "Publicação atualizada"}

@router.delete("/publicacoes/{pmid}")
def delete_publicacao(pmid: str, admin: str = Depends(get_current_admin)):
    if not os.path.exists(PUB_CSV):
        raise HTTPException(status_code=404, detail="Banco não encontrado")
        
    # Remove from pub
    df_pub = pd.read_csv(PUB_CSV)
    df_pub['pmid'] = df_pub['pmid'].astype(str).str.strip()
    df_pub = df_pub[df_pub['pmid'] != pmid]
    df_pub.to_csv(PUB_CSV, index=False)
    
    # Remove from vinculos
    if os.path.exists(VIN_CSV):
        df_vin = pd.read_csv(VIN_CSV)
        df_vin['pmid'] = df_vin['pmid'].astype(str).str.strip()
        df_vin = df_vin[df_vin['pmid'] != pmid]
        df_vin.to_csv(VIN_CSV, index=False)
        
    trigger_reload()
    return {"message": "Publicação removida com sucesso"}

# ================= SYNC (PUBMED) ================= #

from .sync_service import run_sync_for_professor

class SyncRequest(BaseModel):
    id_professor: int
    mode: str = "variantes" # ou "nome_exato"

@router.post("/sync")
def trigger_sync(req: SyncRequest, admin: str = Depends(get_current_admin)):
    # Em produção pesada, isso deveria ser um processo em background tasks
    # Aqui vamos usar sincrono, pois a API do Pubmed é rápida para 1 pesquisador
    try:
        resultado = run_sync_for_professor(req.id_professor, req.mode)
        if "error" in resultado:
            raise HTTPException(status_code=400, detail=resultado["error"])
        
        trigger_reload()
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


