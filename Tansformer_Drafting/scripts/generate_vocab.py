import json
import argparse
from pathlib import Path

def generate_vocab(input_path: Path, output_path: Path):
    print(f"Loading data from {input_path}...")
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON: {e}")
        return

    # Base Vocab
    vocab = {
        "[PAD]": 0,
        "[START]": 1,
        "[END]": 2,
        "[SEP]": 3,
        "SIDE_BLUE": 4,
        "SIDE_RED": 5,
        "ACTION_BAN": 6,
        "ACTION_PICK": 7,
        "ROLE_TOP": 8, 
        "ROLE_JUNGLE": 9,
        "ROLE_MID": 10,
        "ROLE_BOT": 11,
        "ROLE_SUPPORT": 12,
        "ROLE_UNKNOWN": 13,
        "CLASS_ASSASSIN": 14, 
        "CLASS_FIGHTER": 15,
        "CLASS_MAGE": 16,
        "CLASS_MARKSMAN": 17,
        "CLASS_SUPPORT": 18,
        "CLASS_TANK": 19,
        "CLASS_UNKNOWN": 20,
    }
    
    # Add Steps 1-20
    next_id = 21
    for i in range(1, 21):
        vocab[f"STEP_{i}"] = next_id
        next_id += 1
        
    # Open Role Tokens
    vocab["OPEN_ROLE_TOP"] = next_id; next_id += 1
    vocab["OPEN_ROLE_JUNGLE"] = next_id; next_id += 1
    vocab["OPEN_ROLE_MID"] = next_id; next_id += 1
    vocab["OPEN_ROLE_BOT"] = next_id; next_id += 1
    vocab["OPEN_ROLE_SUPPORT"] = next_id; next_id += 1
        
    # Dynamic collection
    champions = set()
    
    print("Scanning matches for Champions...")
    for match in data:
        # Check draft steps for champions
        draft = match.get('draft') or match.get('current_draft', [])
        for step in draft:
            # Champion
            champ = step.get('champion')
            if champ:
                champions.add(champ)
            
            # Additional logic to find champions if not in steps?
            # Maybe in 'teams' -> 'players' -> 'character' -> 'name'
            # Just to be safe coverage
        
        if 'teams' in match:
            # Add Blue and Red team names
            teams = match['teams']
            if isinstance(teams, dict):
                # Format: {"BLUE": "T1", "RED": "Gen.G"}
                for side, t_name in teams.items():
                    if t_name: champions.add(t_name) # We add to 'champions' set for now, or rename set to 'entities'
            elif isinstance(teams, list):
                # Format: [{"name": "T1", ...}, ...]
                for t in teams:
                    t_name = t.get('name')
                    if t_name: champions.add(t_name)
                
    # Add Champions
    sorted_champs = sorted(list(champions))
    print(f"Found {len(sorted_champs)} unique champions.")
    
    for champ in sorted_champs:
        if champ not in vocab:
            vocab[champ] = next_id
            next_id += 1
            
    # Add Champions
    sorted_champs = sorted(list(champions))
    print(f"Found {len(sorted_champs)} unique champions.")
    
    for champ in sorted_champs:
        if champ not in vocab:
            vocab[champ] = next_id
            next_id += 1
            
    print(f"Total Vocab Size: {len(vocab)}")
    
    # Save
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(vocab, f, indent=2)
        
    print(f"Saved vocabulary to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="Data/raw/all_games.json", help="Path to raw matches JSON")
    parser.add_argument("--output", default="Data/metadata/vocab.json", help="Path to save vocab JSON")
    args = parser.parse_args()
    
    generate_vocab(Path(args.input), Path(args.output))
