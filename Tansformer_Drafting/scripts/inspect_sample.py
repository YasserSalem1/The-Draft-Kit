import pandas as pd
import json
import sys
import os
import torch
from pathlib import Path

# Add parent to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.tokenizer import LoLTokenizer

def inspect_sample(parquet_path, vocab_path, index=0):
    print(f"Loading data from {parquet_path}...")
    df = pd.read_parquet(parquet_path)
    
    if index >= len(df):
        print(f"Index {index} out of bounds (size {len(df)})")
        return

    # Find a specific Game ID
    game_id = None
    if index < len(df):
        game_id = df.iloc[index]['game_id']
    else:
        game_id = df.iloc[0]['game_id']
        
    print(f"Inspecting Full Match Progression for Game ID: {game_id}")
    
    # Filter all samples for this game
    game_samples = df[df['game_id'] == game_id].sort_values('sample_id')
    
    print(f"Found {len(game_samples)} samples for this game.")
    
    tokenizer = LoLTokenizer(vocab_path)

    for idx, row in game_samples.iterrows():
        print("\n" + "="*80)
        print(f"STEP {row['sample_id'].split('_')[-1]} (Sample Idx: {idx})")
        print("="*80)
        
        history = json.loads(row['draft_history'])
        input_ids = tokenizer.encode(history)
        decoded = tokenizer.decode(input_ids)
        
        # Print only the LAST part of the context (Current State) to see Open Roles
        # The tokens are [START] ... [SEP] [STEP_N] ... [OPEN_ROLES...]
        print("Context Tail (Last ~30 tokens):")
        print(decoded[-30:])
        
        # Logic Check
        last_step = history[-1] if history else {}
        print(f"\nLast Action: {last_step.get('side', '?')} {last_step.get('action', '?')} {last_step.get('champion', '?')} ({last_step.get('champion_class', [])})")
        
        rem = json.loads(row['remaining_sequence'])
        target = rem[0]['champion'] if rem else "END"
        print(f"Target: {target}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--index", type=int, default=100, help="Index of sample to inspect")
    args = parser.parse_args()
    
    inspect_sample("data/processed/train.parquet", "Data/metadata/vocab.json", args.index)
