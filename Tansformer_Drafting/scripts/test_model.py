import torch
import torch.nn.functional as F
import pandas as pd
import json
import argparse
import sys
import os
import random

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.model import DraftTransformer
from src.tokenizer import LoLTokenizer

def test_model(args):
    # FORCE CPU to avoid MPS NotImplementedError for masked transformer
    device = torch.device("cpu")
    print(f"Using device: {device} (Forced for compatibility)")
    
    # 1. Load Vocab & Tokenizer
    print(f"Loading Tokenizer from {args.vocab_path}...")
    tokenizer = LoLTokenizer(args.vocab_path)
    
    # 2. Load Model
    print(f"Loading Model from {args.model_path}...")
    model = DraftTransformer(vocab_size=len(tokenizer.vocab), d_model=args.d_model, nhead=args.nhead, num_layers=args.layers)
    
    try:
        # Map location to CPU
        state_dict = torch.load(args.model_path, map_location=device)
        model.load_state_dict(state_dict)
    except Exception as e:
        print(f"Error loading model: {e}")
        return
        
    model.to(device)
    model.eval()
    
    # 3. Load Test Data
    print(f"Loading Test Data from {args.test_path}...")
    df = pd.read_parquet(args.test_path)
    
    # 5. Pick Random Games
    # Since strict filtering might remove early steps (common openings), we can't rely on row count >= 19.
    # Instead, we look for games that have the FINAL step (step 19, predicting step 20) 
    # so we can reconstruct the full history from that single row.
    
    # 0-indexed in code (k goes 1..19), so final sample is usually current_step=19
    final_step_rows = df[df['current_step'] == 19]
    valid_games = final_step_rows['game_id'].unique().tolist()
    
    if not valid_games:
        # Fallback: try finding max step if 19 isn't there
        print("No games with Step 19 found. Trying to find longest available games...")
        valid_games = df[df['current_step'] == df['current_step'].max()]['game_id'].unique().tolist()

    if not valid_games:
        print("No valid games found in test data to reconstruct history.")
        return
        
    num_games = min(args.num_games, len(valid_games))
    selected_games = random.sample(valid_games, num_games)
    
    print(f"\nRunning simulation for {num_games} matches...")
    
    for game_idx, target_game_id in enumerate(selected_games):
        print(f"\n" + "#"*80)
        print(f"MATCH {game_idx+1}/{num_games} | GAME ID: {target_game_id}")
        print("#"*80)
        
        # Get data for this game
        game_df = df[df['game_id'] == target_game_id].sort_values('current_step')
        
        # Reconstruct History
        last_row = game_df.iloc[-1]
        full_history = json.loads(last_row['draft_history'])
        remaining = json.loads(last_row['remaining_sequence'])
        if remaining:
            full_history.append(remaining[0])
            
        current_history = []
        match_correct = 0
        match_top5 = 0
        
        for i in range(len(full_history)):
            step_num = i + 1
            target_step = full_history[i]
            truth_champ = target_step.get('champion', "UNKNOWN")
            truth_class = target_step.get('champion_class', ["?"])
            if isinstance(truth_class, list) and truth_class:
                truth_class_str = truth_class[0]
            else:
                truth_class_str = "?"
                
            print(f"\n" + "="*40)
            print(f"STEP {step_num} / 20")
            print("="*40)
            
            # Show Input Context
            print("INPUT HISTORY:")
            if not current_history:
                print("  (Start of Draft)")
            else:
                for s in current_history:
                    print(f"  [{s.get('step')}] {s.get('champion')} ({s.get('champion_class', ['?'])[0]})")
            print("-" * 40)
            
            # Predict
            input_ids = tokenizer.encode(current_history)
            
            # Show Tokens (Decoded only for brevity/readability)
            decoded_input = tokenizer.decode(input_ids)
            print(f"INPUT TOKENS: {decoded_input}")
            print("-" * 40)
            
            input_tensor = torch.tensor(input_ids, dtype=torch.long).unsqueeze(0).to(device)
            src_mask = (input_tensor == tokenizer.pad_token_id)
            
            with torch.no_grad():
                logits = model(input_tensor, src_key_padding_mask=src_mask)
                
                unavailable_ids = set()
                for s in current_history:
                    c = s.get('champion')
                    if c and c in tokenizer.vocab:
                        unavailable_ids.add(tokenizer.vocab[c])
                for uid in unavailable_ids:
                     if uid < logits.size(1):
                         logits[0, uid] = float('-inf')
                         
                probs = F.softmax(logits, dim=1)
                top_probs, top_indices = torch.topk(probs, 5, dim=1)
            
            # Results
            print(f"GROUND TRUTH: {truth_champ} ({truth_class_str})")
            print("-" * 40)
            print("PREDICTIONS:")
            
            found_rank = -1
            top1_correct = False
            
            for r in range(5):
                tid = top_indices[0][r].item()
                p = top_probs[0][r].item()
                tname = tokenizer.id_to_token.get(tid, "UNKNOWN")
                
                marker = ""
                if tname == truth_champ:
                    marker = "  <-- CORRECT! ✅"
                    found_rank = r + 1
                    if r == 0: top1_correct = True
                
                print(f"  {r+1}. {tname:<15} | {p:.1%}{marker}")
                
            if found_rank == 1: match_correct += 1
            if found_rank != -1: match_top5 += 1
            
            if found_rank == -1:
                 # Missed
                 print(f"  ❌ Missed (GT: {truth_champ})")
            
            current_history.append(target_step)
            
        print(f"\nMATCH SUMMARY: Top-1: {match_correct}/20 ({match_correct/20:.0%}) | Top-5: {match_top5}/20 ({match_top5/20:.0%})")
        
        # FINAL DRAFT DISPLAY
        print("\n" + "="*80)
        print(f"FINAL DRAFT (Game {target_game_id})")
        print("="*80)
        
        # Mapping for standard tournament draft (Blue First)
        # Bans: 1,3,5, 14,16 (Blue) | 2,4,6, 13,15 (Red)
        # Picks: 7,10,11, 18,19 (Blue) | 8,9,12, 17,20 (Red)
        
        blue_bans = []
        red_bans = []
        blue_picks = []
        red_picks = []
        
        # Helper to safely get champ name
        def get_champ(idx): 
            if idx < len(current_history):
                return current_history[idx].get('champion', 'Unknown')
            return "Unknown"

        # Steps are 1-indexed in logic, so index = step-1
        # Bans Phase 1
        blue_bans.extend([get_champ(0), get_champ(2), get_champ(4)])
        red_bans.extend([get_champ(1), get_champ(3), get_champ(5)])
        
        # Picks Phase 1
        blue_picks.append(get_champ(6))
        red_picks.extend([get_champ(7), get_champ(8)])
        blue_picks.extend([get_champ(9), get_champ(10)])
        red_picks.append(get_champ(11))
        
        # Bans Phase 2
        red_bans.append(get_champ(12))
        blue_bans.append(get_champ(13))
        red_bans.append(get_champ(14))
        blue_bans.append(get_champ(15))
        
        # Picks Phase 2
        red_picks.append(get_champ(16))
        blue_picks.extend([get_champ(17), get_champ(18)])
        red_picks.append(get_champ(19))
        
        # Formatting
        width = 30
        print(f"{'BLUE TEAM':<{width}} | {'RED TEAM':<{width}}")
        print("-" * (width * 2 + 3))
        
        print(f"Bans: {', '.join(blue_bans):<{width-6}} | Bans: {', '.join(red_bans)}")
        print("-" * (width * 2 + 3))
        
        for i in range(5):
             b_p = blue_picks[i] if i < len(blue_picks) else "-"
             r_p = red_picks[i] if i < len(red_picks) else "-"
             print(f"Pick {i+1}: {b_p:<{width-8}} | Pick {i+1}: {r_p}")
        
        print("#"*80)

    print("\nAll Simulations Complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_path", required=True, help="Path to trained .pth model")
    parser.add_argument("--test_path", default="data/processed/val.parquet", help="Path to test data parquet")
    parser.add_argument("--vocab_path", default="Data/metadata/vocab.json", help="Path to vocab json")
    parser.add_argument("--num_games", type=int, default=1, help="Number of games to simulate")
    
    # Model Architecture Args
    parser.add_argument("--d_model", type=int, default=256)
    parser.add_argument("--nhead", type=int, default=8)
    parser.add_argument("--layers", type=int, default=4)
    
    args = parser.parse_args()
    test_model(args)
