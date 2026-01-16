import json
import argparse
import sys
import random
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from pathlib import Path
from typing import List, Dict, Any
from collections import defaultdict

def preprocess_data(input_path: Path, output_dir: Path, seed: int = 42):
    """
    Preprocesses raw match data into Expanded training samples (teacher forcing).
    Splits by GAME ID (sequential) to prevent leakage.
    """
    if not input_path.exists():
        print(f"Error: Input file {input_path} not found.")
        sys.exit(1)

    print(f"Loading data from {input_path}...")
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON: {e}")
        sys.exit(1)

    # --- PATCH: Update Champion Classes from DB ---
    try:
        # data/raw/all_games.json -> preprocess.py -> project root -> champion_classes.json
        # Actually input_path is typically AI/data/raw/all_games.json.
        # So input_path.parent (AI/data/raw) .parent (AI/data) .parent (AI) .parent (Root)
        # Check relative to script location: scripts/preprocess.py -> ../champion_classes.json
        # input_path passed to function might not be relative to script.
        # Let's assume standard project structure.
        
        # We can find project root by "scripts/../champion_classes.json"
        script_dir = Path(__file__).parent
        class_db_path = script_dir.parent / "champion_classes.json"
        
        if class_db_path.exists():
            print(f"Loading updated classes from {class_db_path}...")
            with open(class_db_path, 'r') as f:
                class_data = json.load(f)
                
            champ_to_classes = defaultdict(list)
            for cls, champs in class_data.items():
                u_cls = cls.upper()
                for c in champs:
                     # Some names might have differences? exact match for now.
                    if u_cls not in champ_to_classes[c]:
                        champ_to_classes[c].append(u_cls)
            
            print(f"Patching classes for {len(data)} matches...")
            for m in data:
                draft = m.get('current_draft', [])
                for step in draft:
                    c = step.get('champion')
                    if c and c in champ_to_classes:
                        step['champion_class'] = champ_to_classes[c]
        else:
            print(f"Warning: {class_db_path} not found. Skipping class patch.")
            
    except Exception as e:
        print(f"Warning: Failed to patch classes: {e}")
    # ---------------------------------------------

    # 1. Shuffle & Split by Match ID
    # Rely on 'game_id' from get_Data.py which is guaranteed 0..N unique
    
    print(f"Loaded {len(data)} matches.")
    
    # Filter valid drafts
    # Filter valid drafts AND Deduplicate
    valid_data = []
    unique_hashes = set()
    duplicates_count = 0
    
    print("Deduplicating matches based on draft content...")
    
    for m in data:
        draft = m.get('current_draft', [])
        # Basic validation: 20 steps
        if len(draft) != 20:
            continue
            
        # Create a content key (Sequence of Champions)
        vals = []
        for s in draft:
            vals.append(s.get('champion', 'UNKNOWN'))
        
        content_hash = tuple(vals)
        
        if content_hash in unique_hashes:
            duplicates_count += 1
        else:
            unique_hashes.add(content_hash)
            valid_data.append(m)
             
    print(f"Removed {duplicates_count} duplicate matches.")
    print(f"Valid Unique Matches (20 steps): {len(valid_data)}")
    
    # Sorting by game_id to ensure deterministic order before shuffling (if we wanted to shuffle)
    # But user wants "splitting them into train test and val no leakage". 
    # Usually random shuffle is best for distribution, BUT distinct IDs.
    
    random.seed(seed)
    random.shuffle(valid_data)
    
    total_valid = len(valid_data)
    train_end = int(total_valid * 0.8)
    val_end = int(total_valid * 0.9)
    
    train_matches = valid_data[:train_end]
    val_matches = valid_data[train_end:val_end]
    test_matches = valid_data[val_end:]
    
    print(f"\nSplit Sizes (Matches):")
    print(f"  Train: {len(train_matches)}")
    print(f"  Val:   {len(val_matches)}")
    print(f"  Test:  {len(test_matches)}")
    
    # 2. Expand Matches into Samples
    def expand_matches(matches: List[Dict]) -> pd.DataFrame:
        samples = []
        for match in matches:
            # Extract ALL info
            game_id = match.get('game_id')
            tournament_id = match.get('tournament_id')
            series_id = match.get('series_id')
            teams = match.get('teams', {})
            winning_team = match.get('winning_team', 'UNKNOWN')
            
            draft = match.get('current_draft', [])
            
            # Additional metadata as JSON strings if complex
            teams_json = json.dumps(teams)
            
            for k in range(1, 20):
                # History and Remaining
                history_steps = draft[:k]
                remaining_steps = draft[k:] 

                # User Request: Remove teams/players from data here
                def strip_draft_info(d_list):
                    clean_list = []
                    for s in d_list:
                        clean_step = {
                            "step": s.get("step"),
                            "champion": s.get("champion"),
                            "champion_class": s.get("champion_class"),
                            # Explicitly EXCLUDE team info
                        }
                        clean_list.append(clean_step)
                    return clean_list

                clean_history = strip_draft_info(history_steps)
                clean_remaining = strip_draft_info(remaining_steps)

                sample = {
                    "game_id": game_id,
                    "sample_id": f"{game_id}_{k}",
                    "tournament_id": tournament_id,
                    "series_id": series_id,
                    # Teams removed
                    "current_step": k, 
                    "draft_history": json.dumps(clean_history),
                    "remaining_sequence": json.dumps(clean_remaining)
                }
                samples.append(sample)
        
        return pd.DataFrame(samples)

    print("\nExpanding samples...")
    train_df = expand_matches(train_matches)
    val_df = expand_matches(val_matches)
    test_df = expand_matches(test_matches)
    
    print(f"\nExpanded Sample Counts (Pre-Filter):")
    print(f"  Train: {len(train_df)}")
    print(f"  Val:   {len(val_df)}")
    print(f"  Test:  {len(test_df)}")
    
    # --- STRICT LEAKAGE REMOVAL ---
    # User Request: "make sure all the overlapping is remmoved"
    # Even if matches are unique, standard openings (Steps 1-5) might be identical.
    # We remove any sample from Val/Test that has a draft_history seen in Train.
    
    print("\nEnforcing 0% Overlap (Filtering Val/Test against Train)...")
    
    train_history_set = set(train_df['draft_history'])
    
    val_df = val_df[~val_df['draft_history'].isin(train_history_set)]
    test_df = test_df[~test_df['draft_history'].isin(train_history_set)]
    
    # Also ensure Val and Test don't overlap with each other
    val_history_set = set(val_df['draft_history'])
    test_df = test_df[~test_df['draft_history'].isin(val_history_set)]
    
    print(f"Filtered Sample Counts (Final):")
    print(f"  Train: {len(train_df)}")
    print(f"  Val:   {len(val_df)}")
    print(f"  Test:  {len(test_df)}")
    # ------------------------------
    
    # 3. Save to Parquet
    output_dir.mkdir(parents=True, exist_ok=True)
    
    train_path = output_dir / "train.parquet"
    val_path = output_dir / "val.parquet"
    test_path = output_dir / "test.parquet"
    
    print(f"\nSaving parquet files to {output_dir}...")
    train_df.to_parquet(train_path, index=False)
    val_df.to_parquet(val_path, index=False)
    test_df.to_parquet(test_path, index=False)
    
    # 4. Leakage Check (Strict ID)
    print("\nRunning Sanity Checks...")
    
    # Load back strictly game_ids
    # Note: Using 'game_id' now instead of 'match_id'
    # We might need to ensure 'game_id' column exists in parquet (it does from expand_matches)
    
    t_ids = set(pd.read_parquet(train_path, columns=['game_id'])['game_id'])
    v_ids = set(pd.read_parquet(val_path, columns=['game_id'])['game_id'])
    test_ids = set(pd.read_parquet(test_path, columns=['game_id'])['game_id'])
    
    leakage_tv = t_ids.intersection(v_ids)
    leakage_tt = t_ids.intersection(test_ids)
    leakage_vt = v_ids.intersection(test_ids)
    
    if leakage_tv or leakage_tt or leakage_vt:
        print("[CRITICAL ERROR] Data Leakage Detected (Game IDs)!")
        sys.exit(1)
    else:
        print("  [PASS] No Game ID leakage detected between splits.")
        
    print("\nPreprocessing Complete.")

def main():
    parser = argparse.ArgumentParser(description="Preprocess LoL Draft Data into Parquet.")
    parser.add_argument("--input", default="Data/raw/all_games.json", help="Path to raw JSON")
    parser.add_argument("--output_dir", default="data/processed", help="Path to output directory")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for splitting")
    
    args = parser.parse_args()
    
    preprocess_data(Path(args.input), Path(args.output_dir), args.seed)

if __name__ == "__main__":
    main()
