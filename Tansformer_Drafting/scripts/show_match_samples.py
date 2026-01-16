import pandas as pd
import json
import torch
import sys
import os
import argparse
from pathlib import Path

# Add parent to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.tokenizer import LoLTokenizer

def show_match_samples(parquet_path, vocab_path, game_index=0):
    print(f"Loading data from {parquet_path}...")
    df = pd.read_parquet(parquet_path)
    
    # Get unique game IDs
    unique_games = df['game_id'].unique()
    
    if game_index >= len(unique_games):
        print(f"Game Index {game_index} out of bounds. Only {len(unique_games)} games found.")
        return
        
    target_game_id = unique_games[game_index]
    print(f"\n=== SHOWING SAMPLES FOR GAME ID: {target_game_id} ===")
    
    # Filter and Sort
    game_df = df[df['game_id'] == target_game_id].sort_values('current_step')
    
    tokenizer = LoLTokenizer(vocab_path)
    
    # Outcome Logic is inside Dataset, so we must replicate or import it.
    # To be perfectly accurate to "how you would tokenize it (to train)", we should use the Dataset class logic.
    # But inspecting raw dataframe is faster. Let's just replicate the simple logic.
    
    winning_team = game_df.iloc[0]['winning_team']
    print(f"Match Winner: {winning_team}")
    
    for _, row in game_df.iterrows():
        step_num = row['current_step']
        history = json.loads(row['draft_history'])
        remaining = json.loads(row['remaining_sequence'])
        
        # --- Tokenize ---
        input_ids = tokenizer.encode(history)
        decoded_input = tokenizer.decode(input_ids)
        
        # --- Target ---
        target_name = "NONE"
        if remaining:
            target_name = remaining[0].get('champion', 'NONE')
            
        print(f"\n--- Sample for Step {step_num} (Predicting Step {step_num + 1}) ---")
        print(f"Condition: [{outcome_token}] (Next acting: {next_acting_team})")
        print(f"Target: {target_name}")
        
        # Show truncated input (Header ... Last Steps)
        # Find where [SEP] are to show structure
        # Just show first 10 tokens (Header) and last 20 tokens (Recent History)
        
        if len(decoded_input) > 40:
            header = decoded_input[:15]
            footer = decoded_input[-25:]
            print(f"Input Tokens: {header} ... {footer}")
        else:
            print(f"Input Tokens: {decoded_input}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--index", type=int, default=0, help="Index of unique game to show (0 = first match in file)")
    args = parser.parse_args()
    
    show_match_samples("data/processed/train.parquet", "Data/metadata/vocab.json", args.index)
