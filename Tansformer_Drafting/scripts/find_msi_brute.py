import requests
import json
import os
from dotenv import load_dotenv
import time

# Load env from root directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(env_path)

URL = "https://api-op.grid.gg/central-data/graphql"
HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": os.getenv("GRID_API_KEY")
}

def find_msi_brute():
    print("Searching for tournaments starting in MAY 2024...")
    
    # Re-enable LoL filter to speed up
    query = """
    query Tournaments($after: Cursor) {
        tournaments(first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            edges { 
                node { 
                    id 
                    name 
                    startDate
                } 
            }
        }
    }
    """
    
    has_next_page = True
    cursor = None
    
    page = 0
    found_any = False
    
    while has_next_page:
        try:
            response = requests.post(CENTRAL_URL, json={"query": query, "variables": {"after": cursor}}, headers=HEADERS)
            data = response.json()
            if 'errors' in data: 
                print("Error:", data['errors'])
                break
            
            t_data = data['data']['tournaments']
            edges = t_data['edges']
            
            if not edges: break
            
            for edge in edges:
                name = edge['node']['name']
                t_id = edge['node']['id']
                start_date = edge['node'].get('startDate')
                
                # Check for keywords
                name_lower = name.lower()
                if "mid-season invitational" in name_lower or ("msi" in name_lower and "road" not in name_lower):
                    print(f"[MATCH] {name} | ID: {t_id} | Date: {edge['node'].get('startDate', 'N/A')}")
                    found_any = True
            
            page += 1
            if page % 5 == 0:
                print(f"Scanned {page*50} tournaments...")
                
            has_next_page = t_data['pageInfo']['hasNextPage']
            cursor = t_data['pageInfo']['endCursor']
            
            if page > 200: # Scan 10,000 tournaments max
                print("Reached safety limit.")
                break
                
        except Exception as e:
            print(f"Exception: {e}")
            break
            
    if not found_any:
        print("No matches found.")

if __name__ == "__main__":
    find_msi_brute()
