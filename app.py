import streamlit as st
import pandas as pd
import unicodedata

# 1. Configuração da Página
st.set_page_config(page_title="OdontoPub - UFRN", layout="wide", page_icon="🦷")

# CSS para otimização mobile
st.markdown("""
    <style>
    /* Reduz o espaçamento entre colunas no mobile */
    [data-testid="column"] {
        padding: 5px !important;
    }
    
    /* Ajusta o tamanho das fontes nos cards para mobile */
    @media (max-width: 640px) {
        .stMarkdown p {
            font-size: 0.85rem !important;
        }
        .stButton button {
            font-size: 0.8rem !important;
            padding: 0.2rem 0.5rem !important;
        }
        /* Força as fotos a não ocuparem a tela toda */
        [data-testid="stImage"] img {
            max-width: 100px !important;
            margin: 0 auto;
        }
    }
    </style>
    """, unsafe_allow_html=True)

# --------- CARREGAMENTO ---------
@st.cache_data
def load_data():
    df_prof = pd.read_csv("professores.csv")
    df_pub = pd.read_csv("publicacoes.csv")
    df_vinculos = pd.read_csv("vinculos.csv")

    # Une as publicações com os vínculos e depois com os professores
    # Isso cria o DataFrame onde um artigo pode aparecer para vários professores
    df_completo = df_vinculos.merge(df_pub, on="pmid")
    df_completo = df_completo.merge(df_prof, on="id_professor")
    
    # Renomeia para manter compatibilidade com seu código anterior
    df_completo = df_completo.rename(columns={"nome": "professor_responsavel", "titulo": "Titulo", "revista": "Revista", "ano": "Ano", "autores": "Autores", "pmid": "PMID", "doi": "DOI"})
    
    return df_prof, df_completo

df_prof, df_pub = load_data()
lista_professores = sorted(df_prof["nome"].unique().tolist())

def normalizar_nome_arquivo(nome):
    n = unicodedata.normalize('NFD', nome)
    n = n.encode('ascii', 'ignore').decode("utf-8")
    return n.lower().replace(" ", "_")

# --------- MÉTRICAS TOTAIS ---------
total_artigos = len(df_pub.drop_duplicates(subset=["PMID"]))
try:
    anos_total = pd.to_numeric(df_pub['Ano'], errors='coerce').dropna()
    periodo_total = f"{int(anos_total.min())} - {int(anos_total.max())}"
except:
    periodo_total = "N/A"

# --------- ESTADO DA SESSÃO ---------
if 'docente_ativo' not in st.session_state:
    st.session_state['docente_ativo'] = "Todos"

def atualizar_docente():
    st.session_state['docente_ativo'] = st.session_state['filtro_nome']

def selecionar_via_card(nome):
    st.session_state['docente_ativo'] = nome
    # Sincroniza o selectbox para que ele não fique "atrasado"
    st.session_state['filtro_nome'] = nome

def voltar_galeria():
    st.session_state['docente_ativo'] = "Todos"
    st.session_state['filtro_nome'] = "Todos"

# --------- LÓGICA DE EXIBIÇÃO ---------

# TELA DE DETALHE (PERFIL COMPLETO)
if st.session_state['docente_ativo'] != "Todos":
    nome_sel = st.session_state['docente_ativo']
    
    if st.button("⬅️ Voltar para a Galeria", on_click=voltar_galeria):
        st.rerun()

    info_prof = df_prof[df_prof["nome"] == nome_sel].iloc[0]
    lattes_id = str(info_prof.get('lattes_id', ''))
    
    df_view = df_pub[df_pub["professor_responsavel"] == nome_sel].copy()

    # Aplicação do filtro de busca global na tela de detalhes
    if "busca_global" in st.session_state and st.session_state["busca_global"]:
        termo = st.session_state["busca_global"]
        df_view = df_view[df_view["Titulo"].str.contains(termo, case=False, na=False)]
        st.warning(f"Exibindo artigos de {nome_sel} contendo: '{termo}'")

    st.title(f"Docente: {nome_sel}")
    
    col_foto, col_info = st.columns([1, 4])
    with col_foto:
        nome_foto = normalizar_nome_arquivo(nome_sel)
        foto_carregada = False
        for ext in ['jpg', 'jpeg', 'png', 'JPG', 'PNG']:
            caminho_teste = f"assets/{nome_foto}.{ext}"
            try:
                with open(caminho_teste, "rb"):
                    st.image(caminho_teste, width="stretch")
                foto_carregada = True
                break 
            except FileNotFoundError:
                continue
        if not foto_carregada:
            st.image("https://via.placeholder.com/300?text=Sem+Foto", width="stretch")

    with col_info:
        st.subheader("Dados do Docente")
        if lattes_id:
            st.link_button("📖 Ver Currículo Lattes", f"http://lattes.cnpq.br/{lattes_id}")
        
        m1, m2 = st.columns(2)
        m1.metric("Artigos Encontrados", len(df_view))
        try:
            anos = pd.to_numeric(df_view['Ano'], errors='coerce').dropna()
            m2.metric("Período Ativo", f"{int(anos.min())} - {int(anos.max())}")
        except:
            m2.metric("Período", "N/A")

    st.divider()
    st.write(f"### Publicações Indexadas ({len(df_view)})")
    df_view = df_view.sort_values(by="Ano", ascending=False)

    if df_view.empty:
        st.info("Nenhuma publicação encontrada para os critérios de busca neste perfil.")
    else:
        for i, row in df_view.iterrows():
            with st.expander(f"({row['Ano']}) {row['Titulo'][:100]}..."):
                st.markdown(f"#### {row['Titulo']}")
                st.markdown(f"📖 **Revista:** {row['Revista']}")
                st.write(f"🧑‍🏫 **Autores:** {row['Autores']}")
                
                c1, c2 = st.columns(2)
                with c1:
                    if pd.notna(row['DOI']) and row['DOI'] != "N/A":
                        st.link_button("🌐 Link da Editora (DOI)", f"https://dx.doi.org/{row['DOI']}", width="stretch")
                with c2:
                    if row['PMID'] and row['PMID'] != "N/A":
                        st.link_button("📄 Ver no PubMed", f"https://pubmed.ncbi.nlm.nih.gov/{row['PMID']}/", width="stretch")

# TELA INICIAL (GALERIA + FILTROS)
else:
    st.title("🦷 OdontoPub")
    st.subheader("Produção científica do Departamento de Odontologia da UFRN")
    st.info("💡 Esta base é alimentada via PubMed em conjunto com SIGAA/DOD. Publicações sem DOI (Digital Object Identifier) ou não indexadas podem ser consultadas diretamente no Currículo Lattes do docente.")
    
    with st.expander("⚠️ Saiba por que alguns artigos ou DOIs podem estar ausentes"):
        st.markdown("""
    <div style="text-align: justify; font-size: 0.85rem;">
    Alguns artigos produzidos pelos professores aqui listados não aparecem catalogados devido à ausência de DOI correspondente.
    Artigos científicos podem não ter DOI por diversas razões, principalmente relacionadas ao processo de publicação e ao envolvimento de instituições ou editores no registro.
    <br><br>
    O DOI é um identificador digital único que garante o acesso permanente e a autenticidade de um material online, mas não é obrigatório para que um artigo seja considerado científico.
    <br><br>
    <b>Principais razões:</b>
    <ul>
        <li><b>Eventos/Anais:</b> Muitos congressos não realizam o depósito individualizado por custo ou logística.</li>
        <li><b>Revistas Locais:</b> Periódicos de instituições menores podem não ter parceria com a Crossref.</li>
        <li><b>Custo:</b> O registro envolve taxas em dólares que nem sempre são cobertas por editores.</li>
    </ul>
    A ausência do DOI pode limitar a visibilidade em bases automáticas como esta, mas o trabalho permanece como registro do conhecimento produzido.
    </div>
    """, unsafe_allow_html=True)

    m1, m2 = st.columns(2)
    m1.metric("Publicações cadastradas", total_artigos)
    m2.metric("Período de Dados", periodo_total)

    st.divider()
    
    c_f1, c_f2 = st.columns([1, 1])
    with c_f1:
        st.selectbox("Filtrar por nome do docente:", ["Todos"] + lista_professores, key="filtro_nome", on_change=atualizar_docente)
    with c_f2:
        busca_termo = st.text_input("Buscar palavra-chave nos títulos:", key="busca_global").strip()

# --- VISUALIZAÇÃO CONSOLIDADA DE TODOS OS ARTIGOS ---
    with st.expander("🔎 Clique para listar todas as publicações"):
        st.markdown("### Todas as Publicações")
        
        # Prepara os dados e remove duplicados
        df_todos_artigos = df_pub.drop_duplicates(subset=["PMID", "Titulo"]).copy()
        
        # Aplica filtro de busca global se existir
        if "busca_global" in st.session_state and st.session_state["busca_global"]:
            termo = st.session_state["busca_global"]
            df_todos_artigos = df_todos_artigos[df_todos_artigos["Titulo"].str.contains(termo, case=False, na=False)]
            st.info(f"Filtrando todos os artigos por: '{termo}'")

        # Ordenação decrescente por Ano
        df_todos_artigos = df_todos_artigos.sort_values(by="Ano", ascending=False)

        # --- BOTÃO DE DOWNLOAD ---
        # Converte o dataframe filtrado para CSV
        csv = df_todos_artigos.to_csv(index=False).encode('utf-8-sig')
        
        st.download_button(
            label="📥 Baixar lista (CSV)",
            data=csv,
            file_name=f"publicacoes_odonto_ufrn.csv",
            mime="text/csv",
            use_container_width=True
        )

        st.write(f"Exibindo **{len(df_todos_artigos)}** publicações:")

        for i, row in df_todos_artigos.iterrows():
            with st.expander(f"({row['Ano']}) {row['Titulo'][:100]}..."):
                st.markdown(f"#### {row['Titulo']}")
                st.markdown(f"👤 **Docente no Sistema:** {row['professor_responsavel']}")
                st.markdown(f"📖 **Revista:** {row['Revista']}")
                st.write(f"🧑‍🏫 **Autores:** {row['Autores']}")
                
                c1, c2 = st.columns(2)
                with c1:
                    if pd.notna(row['DOI']) and row['DOI'] != "N/A":
                        st.link_button("🌐 Link da Editora (DOI)", f"https://dx.doi.org/{row['DOI']}", use_container_width=True)
                with c2:
                    if row['PMID'] and row['PMID'] != "N/A":
                        st.link_button("📄 Ver no PubMed", f"https://pubmed.ncbi.nlm.nih.gov/{row['PMID']}/", use_container_width=True)
    st.divider()
    
# --- GRID DE CRACHÁS (Vem logo abaixo) ---
    professores_visiveis = []
    for nome_p in lista_professores:
        df_p_pub = df_pub[df_pub["professor_responsavel"] == nome_p]
        if busca_termo:
            if not df_p_pub[df_p_pub["Titulo"].str.contains(busca_termo, case=False, na=False)].empty:
                professores_visiveis.append(nome_p)
        else:
            professores_visiveis.append(nome_p)

    if not professores_visiveis:
        st.warning("Nenhum docente encontrado para os critérios selecionados.")
    else:
        cols = st.columns(3)
        for idx, nome_p in enumerate(professores_visiveis):
            df_p_pub = df_pub[df_pub["professor_responsavel"] == nome_p]
            num_pubs = len(df_p_pub)
            try:
                anos = pd.to_numeric(df_p_pub['Ano'], errors='coerce').dropna()
                periodo = f"{int(anos.min())} - {int(anos.max())}" if not anos.empty else "N/A"
            except:
                periodo = "N/A"
                
            with cols[idx % 3]:
                with st.container(border=True):
                    nome_foto = normalizar_nome_arquivo(nome_p)
                    foto_path = "https://via.placeholder.com/150?text=Docente"
                    for ext in ['jpg', 'jpeg', 'png', 'JPG', 'PNG']:
                        caminho_img = f"assets/{nome_foto}.{ext}"
                        if pd.io.common.file_exists(caminho_img):
                            foto_path = caminho_img
                            break
                    
                    # Ajuste de proporção: Foto menor (1) e Texto maior (3)
                    c_img, c_txt = st.columns([1, 3]) 
                    with c_img:
                        st.image(foto_path, width="stretch")
                    with c_txt:
                        st.markdown(f"**{nome_p}**")
                        st.markdown(f"📚 **Publicações:** {num_pubs} | 📅 **Período:** {periodo}")
                    
                    # Busca o lattes_id para o professor atual do card
                    lattes_id = str(df_prof[df_prof["nome"] == nome_p].iloc[0].get('lattes_id', ''))
                    if lattes_id:
                        st.link_button("📖 Ver Currículo Lattes", f"http://lattes.cnpq.br/{lattes_id}", use_container_width=True)
                    
                    st.button(f"📚 Ver Publicações", key=f"btn_{nome_p}", on_click=selecionar_via_card, args=(nome_p,), width="stretch")