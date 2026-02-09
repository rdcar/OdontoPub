
import requests

def verify_backend():
    base_url = "http://127.0.0.1:8000"
    
    print("--- Verifying /professores Endpoint ---")
    try:
        res = requests.get(f"{base_url}/professores")
        if res.status_code == 200:
            professores = res.json()
            print(f"[OK] Fetched {len(professores)} professors.")
            
            # Check for qualis_stats in the first professor
            if professores:
                prof = professores[0]
                if 'qualis_stats' in prof:
                    print(f"[OK] 'qualis_stats' field present.")
                    print(f"   Example stats for {prof['nome']}: {prof['qualis_stats']}")
                else:
                    print(f"[X] 'qualis_stats' field MISSING in professor data.")
            print(f"[X] Failed to fetch professors. Status: {res.status_code}")
            print(f"Response: {res.text}")
    except Exception as e:
        print(f"[X] Error connecting to backend: {e}")

    print("\n--- Verifying /stats Endpoint ---")
    try:
        res = requests.get(f"{base_url}/stats")
        if res.status_code == 200:
            stats = res.json()
            
            # Check for Qualis distribution
            if 'qualis_distribution' in stats:
                print(f"[OK] 'qualis_distribution' field present.")
                print(f"   Distribution: {stats['qualis_distribution']}")
            else:
                print(f"[X] 'qualis_distribution' field MISSING in stats.")
                
            # Check for Top Journals
            if 'top_journals' in stats:
                 print(f"[OK] 'top_journals' field present.")
            else:
                 print(f"[X] 'top_journals' field MISSING in stats.")

        else:
            print(f"[X] Failed to fetch stats. Status: {res.status_code}")
            print(f"Response: {res.text}")
    except Exception as e:
        print(f"[X] Error connecting to backend: {e}")

if __name__ == "__main__":
    verify_backend()
