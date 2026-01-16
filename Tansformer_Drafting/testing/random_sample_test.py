
import torch
import sys
import os
import random
from torch.utils.data import DataLoader

# Add src to path
sys.path.append(os.getcwd())

from src.tokenizer import DraftTokenizer
from src.dataset import DraftDataset
from src.model import DraftTransformer

def random_test():
    # Config
    # Config
    MODEL_PATH = "checkpoints/model_epoch_20.pt"
    VOCAB_PATH = "Data/metadata/vocab.json"
    DATA_PATH = "Data/processed/test_games.json"
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu')
    SAMPLES = 3
    
    print(f"🎲 Running Random Sample Test ({SAMPLES} samples)...")
    
    if not os.path.exists(MODEL_PATH):
        print("❌ Model not found.")
        return

    tokenizer = DraftTokenizer(VOCAB_PATH)
    test_ds = DraftDataset(DATA_PATH, tokenizer)
    
    # Init Model
    model = DraftTransformer(len(tokenizer.vocab), len(tokenizer.vocab), d_model=256, nhead=8, num_layers=6).to(DEVICE)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    
    # Pick Indices
    indices = random.sample(range(len(test_ds)), SAMPLES)
    
    for idx in indices:
        sample = test_ds[idx]
        
        # Prepare Batch (unsqueeze for B=1)
        # Move to device
        ctx = {k: v.to(DEVICE) for k, v in sample.items() if k.startswith('context')}
        # Unsqueeze batch dim [1, T]
        ctx = {k: v.unsqueeze(0) for k,v in ctx.items()}
        
        seq = {
            'champ_ids': sample['champ_ids'].unsqueeze(0).to(DEVICE),
            'action_ids': sample['action_ids'].unsqueeze(0).to(DEVICE),
            'team_ids': sample['team_ids'].unsqueeze(0).to(DEVICE),
            'pos_ids': sample['pos_ids'].unsqueeze(0).to(DEVICE),
            'class_vecs': sample['class_vecs'].unsqueeze(0).to(DEVICE)
        }
        
        # Forward
        logits = model(ctx, seq)
        # Recover Team Names via vocab lookup? 
        # Tokenizer stores teams in vocab. Context tensor has IDs.
        blue_id = sample['context_blue'].item()
        red_id = sample['context_red'].item()
        blue_name = tokenizer.id_to_token.get(blue_id, "Unknown Blue")
        red_name = tokenizer.id_to_token.get(red_id, "Unknown Red")
        
        # Run Model (One pass)
        with torch.no_grad():
            logits = model(ctx, seq)
            
        print(f"\n🏟️ Match {idx} Walkthrough: {blue_name} (Blue) vs {red_name} (Red)")
        
        # Recover True History
        champ_ids = sample['champ_ids']
        action_ids = sample['action_ids']
        team_ids = sample['team_ids']
        
        valid_len = (champ_ids != tokenizer.pad_token_id).sum().item()
        seen_champs = set()
        
        # Final Summary Containers
        blue_picks = []
        blue_bans = []
        red_picks = []
        red_bans = []
        
        # Log for summary table
        results_log = []
        
        # Detailed Walkthrough Loop
        for t in range(valid_len):
            true_token = champ_ids[t].item()
            true_name = tokenizer.id_to_token.get(true_token, "UNK")
            
            # --- DISPLAY ACCUMULATED HISTORY (INPUT TO MODEL) ---
            print(f"\n{'='*20} Predicting Step {t+1} {'='*20}")
            print(f"INPUT CONTEXT (What the model sees):")
            print(f"  [0] Game Context: {blue_name} vs {red_name}")
            
            if t == 0:
                print("  (+) No prior picks/bans.")
            else:
                # Iterate history 0 to t-1
                for h in range(t):
                    h_token = champ_ids[h].item()
                    h_name = tokenizer.id_to_token.get(h_token, "UNK")
                    h_act_id = action_ids[h].item()
                    h_team_id = team_ids[h].item()
                    
                    h_act = "PICK" if h_act_id == 1 else "BAN"
                    h_team_name = blue_name if h_team_id == 0 else red_name
                    # Or short version "BLUE"/"RED"
                    
                    print(f"  (+) Step {h+1}: {h_team_name[:4]} {h_act} {h_name}")

            # --- MODEL PREDICTION ---
            logit = logits[0, t, :]
            
            # Constraint Mask
            for c in seen_champs:
                logit[c] = float('-inf')
                
            probs, indices = torch.topk(torch.softmax(logit, dim=-1), 5)
            
            # --- UPDATE STATE FOR NEXT STEP ---
            seen_champs.add(true_token)
            
            # Collect for summary
            act_id = action_ids[t].item()
            team_id = team_ids[t].item()
            
            if team_id == 0: # Blue
                if act_id == 1: blue_picks.append(true_name)
                else: blue_bans.append(true_name)
            else: # Red
                if act_id == 1: red_picks.append(true_name)
                else: red_bans.append(true_name)
            
            # Display Prediction
            print(f"\nMODEL RECOMMENDATIONS for Step {t+1}:")
            for rank, (p, idx) in enumerate(zip(probs, indices)):
                name = tokenizer.id_to_token.get(idx.item(), "UNK")
                chk = "✅ MATCH" if idx.item() == true_token else ""
                print(f"  Rank #{rank+1}: {name:<15} ({p:.1%}) {chk}")
            print(f"ACTUAL PICK: {true_name}")
            
            # --- LOG RESULT ---
            top1_pred = tokenizer.id_to_token.get(indices[0].item(), "UNK")
            match_rank = -1
            top5_names = []
            for r, idx in enumerate(indices):
                t_name = tokenizer.id_to_token.get(idx.item(), "UNK")
                top5_names.append(t_name)
                if idx.item() == true_token:
                    match_rank = r + 1
            
            t_team = "BLUE" if team_id == 0 else "RED"
            t_act = "PICK" if act_id == 1 else "BAN"
            
            results_log.append({
                "step": t+1,
                "team": t_team,
                "action": t_act,
                "actual": true_name,
                "pred": top1_pred,
                "rank": match_rank,
                "top5": top5_names
            })


        # --- FINAL DRAFT SUMMARY ---
        print("\n📊 Final Draft Summary")
        print(f"🔵 BLUE ({blue_name})")
        print(f"   Bans:  {', '.join(blue_bans)}")
        print(f"   Picks: {', '.join(blue_picks)}")
        print(f"🔴 RED ({red_name})")
        print(f"   Bans:  {', '.join(red_bans)}")
        print(f"   Picks: {', '.join(red_picks)}")
        
        print("\n📋 Prediction Analysis")
        print(f"{'Step':<4} | {'Team':<4} | {'Act':<4} | {'Actual':<15} | {'Model Pred':<15} | {'Rank':<4} | {'Top 5 Detected?'}")
        print("-" * 85)
        
        matches_1 = 0
        matches_5 = 0
        
        for res in results_log:
            outcome = "✅ YES" if res['rank'] != -1 else "❌ NO"
            rank_str = str(res['rank']) if res['rank'] != -1 else "-"
            
            if res['rank'] == 1: matches_1 += 1
            if res['rank'] != -1: matches_5 += 1
            
            # Highlight correct Top 1
            pred_display = res['pred']
            if res['rank'] == 1: pred_display = f"✅ {pred_display}"
            
            print(f"{res['step']:<4} | {res['team']:<4} | {res['action']:<4} | {res['actual']:<15} | {pred_display:<15} | {rank_str:<4} | {outcome}")
            
        print("-" * 85)
        print(f"🎯 Accuracy for this match: Top-1: {matches_1}/{len(results_log)} ({matches_1/len(results_log):.1%}) | Top-5: {matches_5}/{len(results_log)} ({matches_5/len(results_log):.1%})")

if __name__ == "__main__":
    random_test()
