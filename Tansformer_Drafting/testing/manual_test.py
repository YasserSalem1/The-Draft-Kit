
import torch
import sys
import os
import json

# Add src to path
sys.path.append(os.getcwd())

from src.tokenizer import DraftTokenizer
from src.model import DraftTransformer

# ==========================================
# 🔧 USER CONFIGURATION AREA
# ==========================================
# Paste your game data below in the EXACT format found in 'all_games.json'.
# The script will auto-detect teams and actions.

GAME_INPUT = {
    "teams": {
        "BLUE": "T1",
        "RED": "Gen.G"
    },
    "game_in_series": 1,
    "current_draft": [
        # --- PASTE YOUR DRAFT STEPS HERE ---
        # Example: T1 vs Gen.G
        {"step": 1, "champion": "Ashe", "banned_by_team": "T1"},
        {"step": 2, "champion": "Vi", "banned_by_team": "Gen.G"},
        {"step": 3, "champion": "Orianna", "banned_by_team": "T1"},
        {"step": 4, "champion": "Lee Sin", "banned_by_team": "Gen.G"},
        # ... Add more steps ...
    ]
}

MODEL_PATH = "checkpoints/model_epoch_20.pt"
VOCAB_PATH = "Data/metadata/vocab.json"
CLASS_PATH = "champion_classes.json"
# ==========================================

def manual_test():
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu')
    print(f"🔧 Loading Manual Test on {DEVICE}...")

    # 1. Load Tokenizer
    if not os.path.exists(VOCAB_PATH):
        print("❌ Vocab not found.")
        return
    tokenizer = DraftTokenizer(VOCAB_PATH)
    vocab_size = len(tokenizer.vocab)
    print(f"📚 Vocab Size: {vocab_size}")

    # Load Classes
    with open(CLASS_PATH, 'r') as f:
        class_db = json.load(f)
    # Inverse map: Champ -> [Classes]
    champ_to_classes = {}
    for cls, champs in class_db.items():
        for c in champs:
            if c not in champ_to_classes: champ_to_classes[c] = []
            champ_to_classes[c].append(cls)

    # 2. Load Model
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model checkpoint not found at {MODEL_PATH}")
        return

    model = DraftTransformer(
        vocab_size=vocab_size,
        team_vocab_size=vocab_size,
        d_model=256,
        nhead=8,
        num_layers=6
    ).to(DEVICE)
    
    try:
        state_dict = torch.load(MODEL_PATH, map_location=DEVICE)
        model.load_state_dict(state_dict)
        model.eval()
        print(f"✅ Loaded Model")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return

    # 3. Process Input Data using Tokenizer
    print("\n📝 Encoded Input:")
    
    # Prepare Context Dict
    teams = GAME_INPUT.get('teams', {})
    context_dict = {
        "blue_team": teams.get('BLUE', 'Unknown'),
        "red_team": teams.get('RED', 'Unknown'),
        "game_in_series": GAME_INPUT.get('game_in_series', 1)
    }
    
    # Prepare History List
    history_list = GAME_INPUT.get('current_draft', [])
    if not history_list:
        history_list = GAME_INPUT.get('draft_history', []) # Fallback key
        
    print(f"   Context: {context_dict}")
    print(f"   Steps provided: {len(history_list)}")
    
    # USE TOKENIZER ENCODE (Ensures consistency with Training!)
    # We pass max_len=21 to match model training, but actually for inference we just need current length?
    # No, model expects padded batch usually, or handled carefully.
    # Tokenizer returns dict of LISTS.
    encoded = tokenizer.encode(context_dict, history_list, max_len=21)
    
    seq_data = encoded['sequence']
    ctx_data = encoded['context']
    
    # Generate Class Vecs
    # seq_data['champion_ids'] has the IDs. We need the names to look up classes.
    # Actually manual input `history_list` has names.
    # Tokenizer's `encode` returns `class_ids_list` if `champion_classes` key is present in step.
    # But manual input doesn't have `champion_classes` key.
    # So we must populate `class_ids_list` manually or rely on `tokenizer` if it looked them up.
    # My tokenizer update relies on the Input Step having `champion_classes`.
    # So let's patch the history list FIRST.
    
    for step in history_list:
        c_name = step.get('champion')
        if c_name:
            step['champion_classes'] = champ_to_classes.get(c_name, [])
            
    # Re-encode with classes
    encoded = tokenizer.encode(context_dict, history_list, max_len=21)
    seq_data = encoded['sequence']
    
    # Build Class Tensor
    class_ids_list = seq_data['class_ids_list'] # List of Lists
    num_classes = 6
    class_tensor = torch.zeros((1, len(class_ids_list), num_classes), dtype=torch.float)
    
    for t, c_ids in enumerate(class_ids_list):
        for cid in c_ids:
            if 0 <= cid < num_classes:
                class_tensor[0, t, cid] = 1.0
    
    # Convert to Tensors [B=1, ...]
    ctx_inputs = {
        'context_blue': torch.tensor([ctx_data['blue_team_id']]).to(DEVICE),
        'context_red': torch.tensor([ctx_data['red_team_id']]).to(DEVICE),
        'context_game': torch.tensor([ctx_data['game_num']]).to(DEVICE)
    }
    
    # Note: encoded lists are already padded to 21.
    # But for PREDICTION of the NEXT token, we strictly only care about the valid prefix?
    # Actually, the model forward pass takes the WHOLE sequence and outputs logits for EVERY position.
    # We want the prediction corresponding to the LAST REAL STEP.
    
    real_len = len(history_list)
    # If len is 4, we have steps 0, 1, 2, 3. The prediction for "Next Step" is at index 3?
    # No. 
    # Logit[0] (Context) -> Predicts Step 1.
    # Logit[1] (Step 1) -> Predicts Step 2.
    # Logit[N-1] (Step N-1) -> Predicts Step N.
    # Logit[N] (Step N, last real step) -> Predicts Step N+1.
    
    # So we want Logit at index `real_len`.
    # (Since Context is prepended inside the model forward, output size is T+1.
    # If input seq len is 21 (padded), output is 22 logits.
    # Index 0 is Ctx->Step1.
    # Index `real_len` is Step_Last->Step_Next.
    
    seq_inputs = {
        'champ_ids': torch.tensor([seq_data['champion_ids']]).to(DEVICE),
        'action_ids': torch.tensor([seq_data['action_ids']]).to(DEVICE),
        'team_ids': torch.tensor([seq_data['team_ids']]).to(DEVICE),
        'pos_ids': torch.tensor([seq_data['position_ids']]).to(DEVICE),
        'class_vecs': class_tensor.to(DEVICE)
    }
    
    # 4. Predict (Full Sequence Teacher Forcing)
    # The Transformer predicts Step T+1 given History 0..T in parallel with Causal Masking.
    # We just run the forward pass ONCE on the full draft.
    
    print("\n🔮 Match Walkthrough (Detailed Input/Output):")
    
    with torch.no_grad():
        logits = model(ctx_inputs, seq_inputs) # [1, SeqLen+1, Vocab]
        
        seen_champs = set()
        
        # We model Step 1 -> Step N
        # Prediction for Step S comes from history up to S-1.
        # Logit Index 0 corresponds to Context -> Predicts S1.
        # Logit Index S-1 corresponds to History(S-1) -> Predicts S.
        
        for i, step in enumerate(history_list):
            step_num = step.get('step', i+1)
            
            # --- DISPLAY INPUT HISTORY ---
            print(f"\n{'='*20} Predicting Step {step_num} {'='*20}")
            print(f"INPUT CONTEXT (What the model sees):")
            print(f"  [0] Game Context: {context_dict['blue_team']} vs {context_dict['red_team']}")
            
            # History is everything BEFORE this step (0 to i-1)
            # We can iterate history_list up to i
            current_history = history_list[:i]
            if not current_history:
                 print("  (+) No prior picks/bans.")
            else:
                 for h in current_history:
                     h_step = h.get('step', '?')
                     h_act = "BAN" if "banned" in str(h) or h.get('action')=="BAN" else "PICK"
                     h_team = h.get('acting_team', h.get('banned_by_team', h.get('played_by_team', 'UNK')))
                     h_champ = h.get('champion', 'UNK')
                     print(f"  (+) Step {h_step}: {h_team} {h_act} {h_champ}")
            
            # --- MODEL PREDICTION ---
            logit = logits[0, i, :] # Prediction based on 0..i (Input)
            
            # Mask Seen
            for c in seen_champs:
                logit[c] = float('-inf')
                
            probs, indices = torch.topk(torch.softmax(logit, dim=-1), 5)
            
            # --- NEXT GROUND TRUTH ---
            true_champ_name = step.get('champion', 'Unknown')
            true_champ_id = tokenizer.vocab.get(true_champ_name)
            
            if true_champ_id:
                seen_champs.add(true_champ_id)
            
            # Render Predictions
            print(f"\nMODEL RECOMMENDATIONS for Step {step_num}:")
            for rank, (p, idx) in enumerate(zip(probs, indices)):
                name = tokenizer.id_to_token.get(idx.item(), "UNK")
                chk = "✅ MATCH" if idx.item() == true_champ_id else ""
                print(f"  Rank #{rank+1}: {name:<15} ({p:.1%}) {chk}")
                
            print(f"ACTUAL PICK: {true_champ_name}")

    # --- FINAL SUMMARY ---
    # Categorize from History
    blue_picks = []
    blue_bans = []
    red_picks = []
    red_bans = []
    
    for step in history_list:
        champ = step.get('champion')
        # Heuristic for Team/Action if using raw manual input
        # We rely on 'acting_team' or 'banned_by_team' keys
        team_token = step.get('acting_team', step.get('banned_by_team', step.get('played_by_team', 'UNK')))
        is_ban = "BAN" in str(step.get('action')) or "banned_by" in step
        
        # Normalize Team Name check (contains Blue Team Name?)
        b_name = context_dict['blue_team']
        r_name = context_dict['red_team']
        
        # Simple string matching
        is_blue = b_name in team_token if b_name else False
        # If ambiguous, use 'BLUE' / 'RED' keyword
        if 'BLUE' in str(step.get('acting_team', '')).upper(): is_blue = True
        elif 'RED' in str(step.get('acting_team', '')).upper(): is_blue = False
        # If manual input used 'T1' and T1 is blue
        elif team_token == b_name: is_blue = True
        elif team_token == r_name: is_blue = False
        
        if is_blue:
            if is_ban: blue_bans.append(champ)
            else: blue_picks.append(champ)
        else:
            if is_ban: red_bans.append(champ)
            else: red_picks.append(champ)
            
    print("\n📊 Final Draft Summary")
    print(f"🔵 BLUE ({context_dict['blue_team']})")
    print(f"   Bans:  {', '.join(blue_bans)}")
    print(f"   Picks: {', '.join(blue_picks)}")
    print(f"🔴 RED ({context_dict['red_team']})")
    print(f"   Bans:  {', '.join(red_bans)}")
    print(f"   Picks: {', '.join(red_picks)}")

if __name__ == "__main__":
    manual_test()
