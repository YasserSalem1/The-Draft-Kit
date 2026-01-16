
import json
import os
import random
from pathlib import Path
from collections import defaultdict

def load_champion_classes(json_path):
    if not json_path.exists():
        print(f"⚠️ Warning: Class file not found at {json_path}")
        return {}
    
    with open(json_path, 'r') as f:
        data = json.load(f)
        
    # Invert: Class -> [Champs]  =>  Champ -> [Classes]
    champ_to_classes = defaultdict(list)
    for cls, champs in data.items():
        for c in champs:
            if cls not in champ_to_classes[c]:
                champ_to_classes[c].append(cls)
    return dict(champ_to_classes)

def transform_data():
    INPUT_PATH = Path("Data/raw/all_games.json")
    CLASS_PATH = Path("champion_classes.json")
    OUTPUT_DIR = Path("Data/processed")
    
    if not INPUT_PATH.exists():
        print(f"❌ Input file not found: {INPUT_PATH}")
        return

    # Create output dir
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Load Classes
    print(f"📚 Loading Champion Classes...")
    champ_classes_map = load_champion_classes(CLASS_PATH)

    # 2. Load Raw Data
    print(f"📂 Loading raw data from {INPUT_PATH}...")
    with open(INPUT_PATH, 'r') as f:
        raw_data = json.load(f)

    print(f"🔄 Transforming {len(raw_data)} games to Minimal Schema + Classes...")
    
    processed_games = []
    
    for game in raw_data:
        # Get Team Name mappings to resolve Side
        teams = game.get('teams', {})
        blue_name = teams.get('BLUE', 'UNKNOWN_BLUE')
        red_name = teams.get('RED', 'UNKNOWN_RED')
        
        new_game = {
            "game_id": game.get('game_id'),
            "draft": []
        }
        
        # Transform Draft Steps
        raw_draft = game.get('current_draft', game.get('draft', []))
        
        for step in raw_draft:
            # Action
            action = step.get('action') 
            if not action:
                if 'banned_by_team' in step: action = "BAN"
                elif 'played_by_team' in step: action = "PICK"
                else: action = "PICK"
            action = action.upper()
            
            # Side
            side = "BLUE"
            acting_team = step.get('acting_team')
            if not acting_team:
                acting_team = step.get('banned_by_team', step.get('played_by_team'))
            
            if acting_team:
                if acting_team == blue_name: side = "BLUE"
                elif acting_team == red_name: side = "RED"
                else:
                    if "BLUE" in str(acting_team).upper(): side = "BLUE"
                    elif "RED" in str(acting_team).upper(): side = "RED"
            
            # Champion & Classes
            champ_name = step.get('champion', 'Unknown')
            classes = champ_classes_map.get(champ_name, ["UNKNOWN"])
            
            new_step = {
                "step": step.get('step'),
                "action": action,
                "team": side,
                "champion": champ_name,
                "champion_classes": classes 
            }
            
            new_game['draft'].append(new_step)
            
        processed_games.append(new_game)
        
    # 3. Split Data (No Leaks)
    print("✂️ Splitting Data (80% Train, 10% Val, 10% Test)...")
    random.seed(42) # Deterministic Split
    random.shuffle(processed_games)
    
    total = len(processed_games)
    n_train = int(total * 0.8)
    n_val = int(total * 0.1)
    # Remaining to test
    
    train_data = processed_games[:n_train]
    val_data = processed_games[n_train:n_train+n_val]
    test_data = processed_games[n_train+n_val:]
    
    print(f"   Train: {len(train_data)}")
    print(f"   Val:   {len(val_data)}")
    print(f"   Test:  {len(test_data)}")

    # 4. Save
    def save_split(data, name):
        p = OUTPUT_DIR / f"{name}.json"
        print(f"💾 Saving {name} to {p}...")
        with open(p, 'w') as f:
            json.dump(data, f, indent=2)

    save_split(train_data, "train_games")
    save_split(val_data, "val_games")
    save_split(test_data, "test_games")
        
    print("✅ Transformation & Split Complete!")

if __name__ == "__main__":
    transform_data()
