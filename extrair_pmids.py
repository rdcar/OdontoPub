import csv

def extrair_pmids(arquivo_csv, arquivo_txt):
    try:
        # Abrimos o CSV apenas para leitura ('r')
        with open(arquivo_csv, mode='r', encoding='utf-8') as csv_file:
            reader = csv.DictReader(csv_file)
            
            # Criamos/Sobrescrevemos o arquivo TXT para escrita ('w')
            with open(arquivo_txt, mode='w', encoding='utf-8') as txt_file:
                for linha in reader:
                    # Extraímos o valor da coluna 'pmid'
                    pmid = linha.get('pmid')
                    if pmid:
                        txt_file.write(f"{pmid}\n")
        
        print(f"Sucesso! Os PMIDs foram salvos em: {arquivo_txt}")
        
    except FileNotFoundError:
        print("Erro: O arquivo CSV não foi encontrado.")
    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")

# Execução do script
extrair_pmids('publicacoes.csv', 'pmids_manuais.txt')