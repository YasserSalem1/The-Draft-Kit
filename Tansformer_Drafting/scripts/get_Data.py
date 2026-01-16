import requests
import json
import os
import time
import shutil
import copy
from collections import defaultdict


# --- Configuration ---
CENTRAL_URL = "https://api-op.grid.gg/central-data/graphql"
LIVE_URL = "https://api-op.grid.gg/live-data-feed/series-state/graphql"

HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": "PpqORbfBqzELQwN2ZGkXY6gXkrw1znxOnXomia21"
}

# --- 🧠 CHAMPION CLASS DATABASE (LOAD FROM JSON) ---
def load_champion_classes():
    # Look in project root (parent of scripts/)
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "champion_classes.json")
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Warning: Could not load champion_classes.json: {e}")
        return {}, set()

    # Transform: {Class: [Champs]} -> {Champ: [Classes]}
    champ_to_classes = defaultdict(list)
    all_classes = set()

    for class_name, champions in data.items():
        # Standardize class name (e.g. "Fighter" -> "FIGHTER")
        upper_class = class_name.upper()
        all_classes.add(upper_class)
        
        for champ in champions:
            if upper_class not in champ_to_classes[champ]:
                champ_to_classes[champ].append(upper_class)
    
    all_classes.add("UNKNOWN")
    return dict(champ_to_classes), all_classes

CHAMPION_CLASSES_DB, ALL_POSSIBLE_CLASSES = load_champion_classes()

def get_champion_classes(champ_name):
    """Retrieve class list for a champion."""
    return CHAMPION_CLASSES_DB.get(champ_name, ["UNKNOWN"])

# --- 1. Fetching IDs (No Limit) ---
def get_all_tournament_ids():
    query = """
    query Tournaments($after: Cursor) {
        tournaments(filter: { title: { id: { in: ["3"] } } }, first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            edges { node { id } }
        }
    }
    """
    all_ids = []
    has_next_page = True
    cursor = None
    print("--- Step 1: Fetching ALL Tournament IDs ---")
    while has_next_page:
        try:
            response = requests.post(CENTRAL_URL, json={"query": query, "variables": {"after": cursor}}, headers=HEADERS)
            data = response.json()
            if 'errors' in data: break
            t_data = data['data']['tournaments']
            batch = [edge['node']['id'] for edge in t_data['edges']]
            all_ids.extend(batch)
            has_next_page = t_data['pageInfo']['hasNextPage']
            cursor = t_data['pageInfo']['endCursor']
            print(f" > Found {len(all_ids)} tournaments so far...")
        except: break
    print(f"✅ Total Tournaments Found: {len(all_ids)}")
    return all_ids

def get_series_ids_for_tournament(tournament_id):
    query = """
    query AllSeries($tid: ID!, $after: Cursor) {
        allSeries(first: 50, after: $after, filter: { tournament: { id: { in: [$tid] }, title: { id: { in: ["3"] } }, includeChildren: { equals: true } } }) {
            pageInfo { hasNextPage endCursor }
            edges { node { id } }
        }
    }
    """
    series_ids = []
    has_next_page = True
    cursor = None
    while has_next_page:
        try:
            response = requests.post(CENTRAL_URL, json={"query": query, "variables": {"after": cursor, "tid": str(tournament_id)}}, headers=HEADERS)
            data = response.json()
            if 'errors' in data: break
            series_data = data['data']['allSeries']
            series_ids.extend([edge['node']['id'] for edge in series_data['edges']])
            has_next_page = series_data['pageInfo']['hasNextPage']
            cursor = series_data['pageInfo']['endCursor']
        except: break
    return series_ids

# --- 2. Get Match Details ---
def get_series_details(series_id):
    query = """
    query SeriesState($id: ID!) {
        seriesState(id: $id) {
            games {
                draftActions {
                    sequenceNumber
                    type
                    drafter { id }
                    draftable { name }
                }
                teams {
                    id
                    name
                    side
                    won
                    players {
                        name
                        character { name }
                    }
                }
            }
        }
    }
    """
    try:
        response = requests.post(LIVE_URL, json={"query": query, "variables": {"id": str(series_id)}}, headers=HEADERS)
        data = response.json()
        if 'errors' in data: return None
        return data['data']['seriesState']
    except: return None

# --- 3. Main Stateful Processing ---
# --- 3. Main Stateful Processing ---
def process_tournament(tournament_id, series_ids, global_match_counter):
    tournament_games = []
    
    print(f"Processing {len(series_ids)} series for Tournament {tournament_id}...")

    for i, s_id in enumerate(series_ids):
        # Console Log for progress (every 20 series)
        if i > 0 and i % 20 == 0: print(f" > Series {i}/{len(series_ids)}...")

        series_data = get_series_details(s_id)
        if not series_data: continue

        games = series_data.get('games', [])
        for game_idx, game in enumerate(games):

            teams_list = game.get('teams', [])
            if len(teams_list) < 2: continue

            team_map = {}
            # We map ID -> SIDE (BLUE/RED)
            for team in teams_list:
                t_id = team.get('id')
                t_side = team.get('side', 'UNKNOWN').upper()
                team_map[t_id] = t_side

            # Process Steps
            draft_timeline = []
            draft_actions = game.get('draftActions', [])

            for action in draft_actions:
                seq = action.get('sequenceNumber')
                act_type = action.get('type', '').upper()
                drafter_id = action.get('drafter', {}).get('id')
                champ_name = action.get('draftable', {}).get('name')

                if not drafter_id or drafter_id not in team_map: continue

                # Get Side
                side = team_map[drafter_id] # "BLUE" or "RED"
                
                # Create Minimal Step Entry
                # "just draft sequence"
                step_entry = {
                    "step": seq,
                    "action": act_type,    # BAN or PICK
                    "team": side,          # BLUE or RED
                    "champion": champ_name
                }
                
                draft_timeline.append(step_entry)

            if not draft_timeline: continue

            # Create Minimal Game Object
            game_obj = {
                "game_id": global_match_counter[0],
                "draft": draft_timeline
            }

            tournament_games.append(game_obj)
            global_match_counter[0] += 1

    return tournament_games

# --- 4. Main Execution (Full Scale) ---
if __name__ == "__main__":
    from pathlib import Path
    import time
    
    # Get ALL Tournament IDs
    all_tournament_ids = get_all_tournament_ids()

    print(f"\n🚀 PRODUCTION MODE: Processing {len(all_tournament_ids)} tournaments.")
    
    # Global Match ID Counter
    global_match_counter = [0] 
    
    all_games_master_list = []
    output_file = Path("Data/raw/all_games.json")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📄 Output will be saved to: {output_file}")
    if output_file.exists():
        print(f"⚠️  Warning: Overwriting existing {output_file}")

    try:
        for idx, tour_id in enumerate(all_tournament_ids):
            print(f"\n📂 Processing Tournament {idx+1}/{len(all_tournament_ids)} (ID: {tour_id})")
            
            series_ids = get_series_ids_for_tournament(tour_id)
            if not series_ids:
                print("   ⚠️ No series found.")
                continue

            # Pass the counter list
            games = process_tournament(tour_id, series_ids, global_match_counter)
            
            if games:
                all_games_master_list.extend(games)
                print(f"   ✅ Added {len(games)} games. Total Saved: {len(all_games_master_list)} (Last ID: {global_match_counter[0]-1})")
                
                # Save immediately
                with open(output_file, 'w') as f:
                    json.dump(all_games_master_list, f, indent=2)
            else:
                print(f"   ⚠️ Found 0 valid games.")

            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\n\n🛑 Process Interrupted by User.")
        
    print("\n🎉 All processing done!")
    print(f"Total Matches Collected: {len(all_games_master_list)}")