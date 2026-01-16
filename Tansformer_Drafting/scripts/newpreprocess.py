import json
import argparse
import sys
import pandas as pd
from pathlib import Path
from collections import defaultdict
from typing import List, Dict

def preprocess_new_data(input_path: Path, output_dir: Path):
    """
    Preprocesses new manual test data into Expanded samples.
    NO Splitting. NO Leakage check (this IS the test set).
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
                    if u_cls not in champ_to_classes[c]:
                        champ_to_classes[c].append(u_cls)
            
            print(f"Patching classes for {len(data)} matches...")
            for m in data:
                draft = m.get('current_draft', [])
                for step in draft:
                    c = step.get('champion')
                    # Update classes if found in DB, otherwise keep existing
                    if c and c in champ_to_classes:
                        # You might want to OVERWRITE or MERGE. 
                        # preprocess.py overwrites: step['champion_class'] = ...
                        step['champion_class'] = champ_to_classes[c]
        else:
            print(f"Warning: {class_db_path} not found. Skipping class patch.")
            
    except Exception as e:
        print(f"Warning: Failed to patch classes: {e}")
    # ---------------------------------------------

    print(f"Loaded {len(data)} matches.")
    
    # 2. Expand Matches into Samples
    def expand_matches(matches: List[Dict]) -> pd.DataFrame:
        samples = []
        for match in matches:
            game_id = match.get('game_id')
            tournament_id = match.get('tournament_id', 'MANUAL')
            series_id = match.get('series_id', 'MANUAL')
            
            draft = match.get('current_draft', [])
            
            # Allow variable length drafts if needed, but let's assume 20 for standard logic
            # or loop up to len(draft).
            
            for k in range(1, len(draft)): # 1 to 19 typically
                history_steps = draft[:k]
                remaining_steps = draft[k:] 
                
                def strip_draft_info(d_list):
                    clean_list = []
                    for s in d_list:
                        clean_step = {
                            "step": s.get("step"),
                            "champion": s.get("champion"),
                            "champion_class": s.get("champion_class"),
                            # Exclude team/player info for model input as per preprocess.py
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
                    "current_step": k, 
                    "draft_history": json.dumps(clean_history),
                    "remaining_sequence": json.dumps(clean_remaining)
                }
                samples.append(sample)
        
        return pd.DataFrame(samples)

    print("\nExpanding samples...")
    test_df = expand_matches(data)
    
    print(f"\nExpanded Sample Counts: {len(test_df)}")
    
    # 3. Save to Parquet
    output_dir.mkdir(parents=True, exist_ok=True)
    
    test_path = output_dir / "newtest.parquet"
    
    print(f"\nSaving parquet file to {test_path}...")
    test_df.to_parquet(test_path, index=False)
        
    print("\nPreprocessing Complete.")

def main():
    parser = argparse.ArgumentParser(description="Preprocess NEW Manual Data into Parquet.")
    parser.add_argument("--input", default="Data/raw/new.json", help="Path to raw JSON")
    parser.add_argument("--output_dir", default="data/processed", help="Path to output directory")
    
    args = parser.parse_args()
    
    preprocess_new_data(Path(args.input), Path(args.output_dir))

if __name__ == "__main__":
    main()
