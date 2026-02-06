
import glob

files = glob.glob("d:/OdontoPub/projetos_de_pesquisa.mhtml")
if not files:
    print("File not found")
    exit()

filename = files[0] # Should be only one
print(f"Reading {filename}")

with open(filename, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Decode quoted printable if possible. But simple search might work even with =3D
# Let's try simple search first knowing that '=' might be '=3D'
target = "LELIA BATISTA DE SOUZA"
idx = content.find(target)

if idx == -1:
    print(f"Target '{target}' not found. Trying partial...")
    target = "LELIA"
    idx = content.find(target)

if idx != -1:
    start = max(0, idx - 1000)
    end = min(len(content), idx + 2000)
    print(content[start:end])
else:
    print("Target not found.")
