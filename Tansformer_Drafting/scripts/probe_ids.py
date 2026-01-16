import requests
import json
import os
import time
from dotenv import load_dotenv

# Load env from parent directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

URL = "https://api-op.grid.gg/central-data/graphql"
HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": os.getenv("GRID_API_KEY")
}

def probe_ids():
    query = """
    query Tournament($id: ID!) {
        tournament(id: $id) {
            id
            name
            startDate
        }
    }
    """
    
    start_id = 761472
    end_id = 774845
    step = 500
    
    print(f"Probing IDs from {start_id} to {end_id} with step {step}...")
    
    current_id = start_id
    while current_id < end_id:
        try:
            response = requests.post(CENTRAL_URL, json={"query": query, "variables": {"id": str(current_id)}}, headers=HEADERS)
            data = response.json()
            
            if 'data' in data and data['data'] and data['data'].get('tournament'):
                t = data['data']['tournament']
                name = t.get('name', 'Unknown')
                date = t.get('startDate', 'Unknown')
                print(f"ID {current_id}: {name} ({date})")
                
                if "Mid-Season Invitational" in name:
                    print(f"!!! FOUND MSI: {name} ID: {current_id} !!!")
                    break
            else:
                # print(f"ID {current_id}: Empty")
                pass
                
        except Exception as e:
            pass # Ignore errors to keep scanning
            
        current_id += step
        time.sleep(0.05)

if __name__ == "__main__":
    probe_ids()
