
import torch
import sys
import os
import readline # For better input handling

# Add src to path
sys.path.append(os.getcwd())

from src.tokenizer import DraftTokenizer
from src.model import DraftTransformer

def interactive_test():
    # Config
    MODEL_PATH = "checkpoints/model_epoch_48.pt"
    VOCAB_PATH = "Data/metadata/vocab.json"
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu')
    
    print(f"🔧 Interactive Draft Tool on {DEVICE}")
    print("-----------------------------------")
    
    # 1. Load Resources
    if not os.path.exists(VOCAB_PATH) or not os.path.exists(MODEL_PATH):
        print("❌ Missing vocab or model checkpoint.")
        return
        
    tokenizer = DraftTokenizer(VOCAB_PATH)
    vocab_size = len(tokenizer.vocab)
    
    model = DraftTransformer(vocab_size, vocab_size, d_model=256, nhead=8, num_layers=6).to(DEVICE)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    
    print("✅ System Ready.")
    
    # 2. Setup Match
    blue_team = input("\nEnter BLUE Team Name (e.g. T1): ").strip()
    red_team = input("Enter RED Team Name (e.g. Gen.G): ").strip()
    game_num = input("Enter Game Number (1-5) [Default 1]: ").strip()
    game_num = int(game_num) if game_num.isdigit() else 1
    
    context_dict = {
        "blue_team": blue_team,
        "red_team": red_team,
        "game_in_series": game_num
    }
    
    history_list = [] # Starts empty
    seen_champs = set()
    
    # 3. Interactive Loop
    # Standard Draft has ~20 steps.
    # We loop until user quits or hits 20.
    
    print("\nDraft Started! type 'exit' to quit.")
    
    step_count = 1
    while step_count <= 20:
        # --- A. Display Input Context ---
        print(f"\n\n{'='*20} Predicting Step {step_count} {'='*20}")
        print(f"INPUT CONTEXT (What the model sees):")
        print(f"  [0] Game Context: {context_dict['blue_team']} vs {context_dict['red_team']}")
        
        if not history_list:
             print("  (+) No prior picks/bans.")
        else:
             for h in history_list:
                 h_step = h.get('step', '?')
                 h_act = h.get('action', 'UNK')
                 h_team = h.get('acting_team', 'UNK')
                 h_champ = h.get('champion', 'UNK')
                 
                 # Get ID for explicit token verification if needed
                 c_id = tokenizer.vocab.get(h_champ, "UNK")
                 print(f"  (+) Step {h_step}: {h_team} {h_act} {h_champ} (ID: {c_id})")

        # --- B. Predict Next Step ---
        encoded = tokenizer.encode(context_dict, history_list, max_len=21)
        
        ctx_data = encoded['context']
        seq_data = encoded['sequence']
        
        # Prepare Tensors [B=1]
        ctx_inputs = {
            'context_blue': torch.tensor([ctx_data['blue_team_id']]).to(DEVICE),
            'context_red': torch.tensor([ctx_data['red_team_id']]).to(DEVICE),
            'context_game': torch.tensor([ctx_data['game_num']]).to(DEVICE)
        }
        seq_inputs = {
            'champ_ids': torch.tensor([seq_data['champion_ids']]).to(DEVICE),
            'action_ids': torch.tensor([seq_data['action_ids']]).to(DEVICE),
            'team_ids': torch.tensor([seq_data['team_ids']]).to(DEVICE),
            'pos_ids': torch.tensor([seq_data['position_ids']]).to(DEVICE)
        }
        
        with torch.no_grad():
            logits = model(ctx_inputs, seq_inputs)
            # Prediction for Next Step (index = len(history))
            # If history is empty (len=0), we want Logit[0] (Ctx->Step1)
            target_idx = len(history_list)
            target_logit = logits[0, target_idx, :]
            
            # Constraint Mask
            for c in seen_champs:
                target_logit[c] = float('-inf')
                
            probs, indices = torch.topk(torch.softmax(target_logit, dim=-1), 5)
            
        print(f"\n🔮 Model Suggestions for Step {step_count}:")
        for i, (p, idx) in enumerate(zip(probs, indices)):
            name = tokenizer.id_to_token.get(idx.item(), "UNK")
            print(f"   {i+1}. {name:<15} ({p:.1%})")
            
        # --- B. Get User Input ---
        user_input = input(f"\nStep {step_count} Input (Champion Name): ").strip()
        if user_input.lower() in ['exit', 'quit']:
            break
            
        # Validate Champion
        champ_id = tokenizer.vocab.get(user_input)
        if not champ_id:
            # Try fuzzy or case insensitive?
            # For now, strict check but suggest capitalizing
            print(f"⚠️ '{user_input}' not found in vocab. Please match case (e.g. 'Ahri').")
            # We allow retry without advancing step
            continue
            
        if champ_id in seen_champs:
            print(f"⚠️ {user_input} has already been drafted!")
            continue
            
        # Infer Action/Team based on Step Number (Standard Draft Order)
        # 1-6: Bans
        # 7-12: Picks
        # 13-16: Bans
        # 17-20: Picks
        # Determining Side is complex (B1, R1, B2, R2...), let's ask or infer?
        # Let's try to infer standard tournament draft order:
        # Step 1 (Blue Ban) -> 2 (Red Ban) -> 3 (Blue Ban) -> 4 (Red Ban) -> 5 (Blue Ban) -> 6 (Red Ban)
        # Step 7 (Blue Pick) -> 8 (Red Pick) -> 9 (Red Pick) -> 10 (Blue Pick) -> 11 (Blue Pick) -> 12 (Red Pick)
        # Step 13 (Red Ban) -> 14 (Blue Ban) -> 15 (Red Ban) -> 16 (Blue Ban)
        # Step 17 (Red Pick) -> 18 (Blue Pick) -> 19 (Blue Pick) -> 20 (Red Pick)
        
        # Simple heuristic map
        # (IsBan, IsBlue)
        draft_order = {
            1: (True, True), 2: (True, False), 3: (True, True), 4: (True, False), 5: (True, True), 6: (True, False),
            7: (False, True), 8: (False, False), 9: (False, False), 10: (False, True), 11: (False, True), 12: (False, False),
            13: (True, False), 14: (True, True), 15: (True, False), 16: (True, True),
            17: (False, False), 18: (False, True), 19: (False, True), 20: (False, False)
        }
        
        is_ban, is_blue = draft_order.get(step_count, (False, True))
        
        action = "BAN" if is_ban else "PICK"
        acting_team = blue_team if is_blue else red_team
        
        print(f"   ➥ Registered: {acting_team} {action} {user_input}")
        
        # Add to history
        step_dict = {
            "step": step_count,
            "champion": user_input,
            "action": action,
            "acting_team": "BLUE" if is_blue else "RED" # Tokenizer expects side key, usually maps from name if using 'banned_by'
            # But here we construct 'action' and 'acting_team' explicitly for tokenizer.
        }
        history_list.append(step_dict)
        seen_champs.add(champ_id)
        step_count += 1

    print("\nDraft Complete! 🏁")
    
    # --- FINAL SUMMARY ---
    blue_picks = []
    blue_bans = []
    red_picks = []
    red_bans = []
    
    for step in history_list:
        champ = step['champion']
        act = step['action'] # BAN or PICK
        team_side = step['acting_team'] # BLUE or RED
        
        if team_side == "BLUE":
            if act == "BAN": blue_bans.append(champ)
            else: blue_picks.append(champ)
        else:
            if act == "BAN": red_bans.append(champ)
            else: red_picks.append(champ)

    print("\n📊 Final Draft Summary")
    print(f"🔵 BLUE ({blue_team})")
    print(f"   Bans:  {', '.join(blue_bans)}")
    print(f"   Picks: {', '.join(blue_picks)}")
    print(f"🔴 RED ({red_team})")
    print(f"   Bans:  {', '.join(red_bans)}")
    print(f"   Picks: {', '.join(red_picks)}")

if __name__ == "__main__":
    interactive_test()
