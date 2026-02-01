import pandas as pd
import os
import datetime

def cadastrar_artigo_manual():
    # 1. Carregar bases atuais
    if not os.path.exists("professores.csv"):
        print("❌ Erro: professores.csv não encontrado.")
        return

    df_prof = pd.read_csv("professores.csv")
    
    print("--- CADASTRO MANUAL DE ARTIGO ---")
    
    # 2. Selecionar Professor
    for i, nome in enumerate(df_prof['nome']):
        print(f"{i}) {nome}")
    
    try:
        idx = int(input("\nDigite o número do professor dono deste artigo: "))
        id_professor = df_prof.iloc[idx]['id_professor']
        nome_professor = df_prof.iloc[idx]['nome']
    except:
        print("❌ Seleção inválida.")
        return

    # 3. Coletar Dados do Artigo
    print(f"\nCadastrando para: {nome_professor}")
    titulo = input("Título do Artigo: ").strip()
    revista = input("Nome da Revista/Evento: ").strip()
    ano = input("Ano (ex: 2023): ").strip()
    doi = input("DOI (se não tiver, aperte Enter): ").strip() or "N/A"
    autores = input("Autores (separados por ponto e vírgula): ").strip()

    # 4. Gerar ID Único Manual
    # Usamos o timestamp para garantir que nunca se repita
    pmid_manual = f"MAN_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"

    # 5. Criar DataFrames de uma linha
    novo_artigo = {
        "pmid": pmid_manual,
        "doi": doi,
        "titulo": titulo,
        "revista": revista,
        "ano": ano,
        "autores": autores
    }
    
    novo_vinculo = {
        "pmid": pmid_manual,
        "id_professor": id_professor
    }

    # 6. Salvar/Append
    df_pub = pd.read_csv("publicacoes.csv") if os.path.exists("publicacoes.csv") else pd.DataFrame()
    df_vin = pd.read_csv("vinculos.csv") if os.path.exists("vinculos.csv") else pd.DataFrame()

    df_pub = pd.concat([df_pub, pd.DataFrame([novo_artigo])], ignore_index=True)
    df_vin = pd.concat([df_vin, pd.DataFrame([novo_vinculo])], ignore_index=True)

    # Remover duplicatas por segurança
    df_pub.drop_duplicates(subset=['pmid'], inplace=True)
    
    df_pub.to_csv("publicacoes.csv", index=False)
    df_vin.to_csv("vinculos.csv", index=False)

    print(f"\n✅ Sucesso! Artigo vinculado a {nome_professor}.")
    print(f"ID Gerado: {pmid_manual}")

if __name__ == "__main__":
    cadastrar_artigo_manual()