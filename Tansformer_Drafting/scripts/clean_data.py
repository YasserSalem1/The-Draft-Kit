
import json
import shutil
import collections
from pathlib import Path

def clean_data():
    input_path = Path('Data/raw/all_games.json')
    backup_path = Path('Data/raw/all_games_backup.json')
    
    if not input_path.exists():
        print(f"❌ File not found: {input_path}")
        return

    # Backup
    if not backup_path.exists():
        print(f"📦 Backing up to {backup_path}...")
        shutil.copy2(input_path, backup_path)
    
    print(f"🧹 CLeaning data from {input_path}...")
    with open(input_path, 'r') as f:
        data = json.load(f)
        
    initial_count = len(data)
    print(f"Initial Count: {initial_count}")
    
    # 1. Filter Short Games
    # We want at least 20 steps (standard full draft)
    # Note: Some drafts might legally be shorter if a team forfeits or strict rules, 
    # but for training a standard predictor we want full sequences.
    data_full_length = [g for g in data if len(g.get('current_draft', [])) >= 20]
    removed_short = initial_count - len(data_full_length)
    print(f"Removed {removed_short} short games (<20 steps).")
    
    # 2. Deduplicate
    # We use the sequence of (Step, Champion) tuples as the unique key.
    unique_data = []
    seen_hashes = set()
    
    for g in data_full_length:
        # Create a hashable signature
        # We only care about the draft sequence for uniqueness, not metadata like game_id or winning_team
        # (Though duplicate matches usually have same metadata too, but different game_id possibly if re-parsed)
        # Using (Step, Champion, Action) helps distinguish weird edge cases
        draft = g.get('current_draft', [])
        
        # Sig: tuple of (step, champion)
        sig = tuple( (s.get('step'), s.get('champion')) for s in draft )
        
        if sig not in seen_hashes:
            seen_hashes.add(sig)
            unique_data.append(g)
            
    removed_dupes = len(data_full_length) - len(unique_data)
    print(f"Removed {removed_dupes} duplicate drafts.")
    
    final_count = len(unique_data)
    print(f"✅ Final Count: {final_count} (Reduced by {initial_count - final_count})")
    
    # Save
    with open(input_path, 'w') as f:
        json.dump(unique_data, f, indent=2)
    print(f"💾 Overwrote {input_path}")

if __name__ == "__main__":
    clean_data()
