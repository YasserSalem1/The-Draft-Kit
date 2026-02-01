import requests
import json
import os
from dotenv import load_dotenv

# Load env from root directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(env_path)

URL = "https://api-op.grid.gg/central-data/graphql"
HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": os.getenv("GRID_API_KEY")
}

def find_msi_tournaments():
    query = """
    query Tournaments($after: Cursor) {
        tournaments(filter: { title: { id: { in: ["3"] } } }, first: 50, after: $after) {
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
    
    print("Dumping tournament list to tournaments_list.txt...")
    
    msi_tournaments = [] # This list will remain empty as the function's purpose has changed
    page_count = 0
    
    with open("tournaments_list.txt", "w") as f:
        while has_next_page:
            try:
                response = requests.post(CENTRAL_URL, json={"query": query, "variables": {"after": cursor}}, headers=HEADERS)
                data = response.json()
                if 'errors' in data: 
                    print(data['errors'])
                    break
                
                t_data = data['data']['tournaments']
                if not t_data['edges']: break
                
                for edge in t_data['edges']:
                    name = edge['node']['name']
                    t_id = edge['node']['id']
                    f.write(f"{name} | ID: {t_id}\n")
                
                page_count += 1
                if page_count % 5 == 0:
                    print(f"Scanned {page_count} pages...")
                
                has_next_page = t_data['pageInfo']['hasNextPage']
                cursor = t_data['pageInfo']['endCursor']
                
                if page_count > 100: break # Dump up to 5000 items
            except Exception as e:
                print(f"Error: {e}")
                break
                
    print("Dump complete.")
            
    return msi_tournaments

if __name__ == "__main__":
    find_msi_tournaments()
