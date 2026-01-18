import torch
import json
import os
import sys
import readline

# Imports from local folder
try:
    from tokenizer import DraftTokenizer
    from model import DraftTransformer
except ImportError:
    # If running from root, these might fail without sys.path hack, 
    # but the idea is this folder is self-contained.
    sys.path.append(os.path.dirname(__file__))
    from tokenizer import DraftTokenizer
    from model import DraftTransformer

def load_champion_classes(path):
    """
    Load champion classes from JSON and return a mapping: UNKNOWN_CHAMP_NAME -> [Class1, Class2]
    """
    if not os.path.exists(path):
        return {}
    
    with open(path, 'r') as f:
        data = json.load(f)
        
    mapping = {}
    for cls, champs in data.items():
        for c in champs:
            c_upper = c.upper()
            if c_upper not in mapping:
                mapping[c_upper] = []
            mapping[c_upper].append(cls)
    return mapping

def main():
    # 1. Configuration
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.path.join(BASE_DIR, "model_epoch_20.pt")
    VOCAB_PATH = os.path.join(BASE_DIR, "vocab.json")
    CLASS_DB_PATH = os.path.join(BASE_DIR, "champion_classes.json")
    
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu')
    
    print(f"🔧 DraftPredictor Inference Tool")
    print(f"   Device: {DEVICE}")
    print("-----------------------------------")

    # 2. Check Resources
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Critical Error: Model file not found at {MODEL_PATH}")
        return
    if not os.path.exists(VOCAB_PATH):
        print(f"❌ Critical Error: Vocab file not found at {VOCAB_PATH}")
        return

    # 3. Load Data & Model
    print("Loading resources...")
    tokenizer = DraftTokenizer(VOCAB_PATH)
    vocab_size = len(tokenizer.vocab)
    
    champ_class_map = load_champion_classes(CLASS_DB_PATH)
    if not champ_class_map:
        print("⚠️  Warning: champion_classes.json not found or empty. Class features will be zeroed.")

    # Initialize Model (Matching Training Params)
    # Note: vocab_size passed twice because model expects team_vocab_size as 2nd arg.
    # In interactive_test.py: DraftTransformer(vocab_size, vocab_size, ...)
    model = DraftTransformer(vocab_size, vocab_size, d_model=256, nhead=8, num_layers=6).to(DEVICE)
    
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    except Exception as e:
        print(f"❌ Error loading model weights: {e}")
        return
        
    model.eval()
    print("✅ System Ready.\n")

    # 4. Draft Setup
    blue_team = input("Enter BLUE Team Name (e.g. T1): ").strip() or "BLUE"
    red_team = input("Enter RED Team Name (e.g. Gen.G): ").strip() or "RED"
    
    context_dict = {
        "blue_team": blue_team,
        "red_team": red_team,
        "game_in_series": 1
    }
    
    history_list = []
    seen_champs = set()
    
    print("\nDraft Started! type 'exit' to quit.")
    
    # 5. Inference Loop
    step_count = 1
    max_steps = 20
    
    while step_count <= max_steps:
        print(f"\n{'='*20} Predicting Step {step_count} {'='*20}")
        
        # --- A. Encode Input ---
        encoded = tokenizer.encode(context_dict, history_list, max_len=21)
        
        ctx_data = encoded['context']
        seq_data = encoded['sequence']
        
        # Prepare Feature Tensors
        ctx_inputs = {
            'context_blue': torch.tensor([ctx_data['blue_team_id']]).to(DEVICE),
            'context_red': torch.tensor([ctx_data['red_team_id']]).to(DEVICE),
            'context_game': torch.tensor([ctx_data['game_num']]).to(DEVICE)
        }
        
        # Generate Class Multi-Hot Vector [B=1, T, 6]
        # logic adapted from src/dataset.py
        class_ids_list = seq_data['class_ids_list'] # List[List[int]]
        num_classes = 6
        class_tensor = torch.zeros((1, len(class_ids_list), num_classes), dtype=torch.float).to(DEVICE)
        
        for t, c_ids in enumerate(class_ids_list):
            for cid in c_ids:
                if 0 <= cid < num_classes:
                    class_tensor[0, t, cid] = 1.0
                    
        seq_inputs = {
            'champ_ids': torch.tensor([seq_data['champion_ids']]).to(DEVICE),
            'action_ids': torch.tensor([seq_data['action_ids']]).to(DEVICE),
            'team_ids': torch.tensor([seq_data['team_ids']]).to(DEVICE),
            'pos_ids': torch.tensor([seq_data['position_ids']]).to(DEVICE),
            'class_vecs': class_tensor
        }
        
        # --- B. Model Prediction ---
        with torch.no_grad():
            logits = model(ctx_inputs, seq_inputs)
            
            # Target is the next tokens (at index = len(history))
            target_idx = len(history_list)
            target_logit = logits[0, target_idx, :]
            
            # Mask Taken Champs
            for c in seen_champs:
                target_logit[c] = float('-inf')
            
            # Top 5
            probs, indices = torch.topk(torch.softmax(target_logit, dim=-1), 5)
            
        print(f"🔮 Suggestions for Step {step_count}:")
        for i, (p, idx) in enumerate(zip(probs, indices)):
            name = tokenizer.id_to_token.get(idx.item(), "UNK")
            print(f"   {i+1}. {name:<15} ({p:.1%})")

        # --- C. User Input ---
        user_input = input(f"\nStep {step_count} Select Champion: ").strip()
        if user_input.lower() in ['exit', 'quit']:
            break
            
        # Validate
        champ_id = tokenizer.vocab.get(user_input)
        
        # Case insensitive retry
        if not champ_id:
            # Try to find case-insensitive match
            for k, v in tokenizer.vocab.items():
                if k.upper() == user_input.upper():
                    user_input = k
                    champ_id = v
                    break
                    
        if not champ_id:
            print(f"⚠️  '{user_input}' not found in vocabulary.")
            continue
            
        if champ_id in seen_champs:
            print(f"⚠️  '{user_input}' already drafted.")
            continue
            
        # Infer Action/Side (Standard Draft Order)
        # 1-6 Bans, 7-20 picks roughly...
        # Simple heuristic mapping for side/action
        draft_order = {
            1: (True, True), 2: (True, False), 3: (True, True), 4: (True, False), 5: (True, True), 6: (True, False),
            7: (False, True), 8: (False, False), 9: (False, False), 10: (False, True), 11: (False, True), 12: (False, False),
            13: (True, False), 14: (True, True), 15: (True, False), 16: (True, True),
            17: (False, False), 18: (False, True), 19: (False, True), 20: (False, False)
        }
        is_ban, is_blue = draft_order.get(step_count, (False, True))
        action = "BAN" if is_ban else "PICK"
        acting_team = "BLUE" if is_blue else "RED" # Tokenizer expects these keys
        
        print(f"   ➥ Registered: {acting_team} {action} {user_input}")
        
        # Get Classes for this champ
        c_classes = champ_class_map.get(user_input.upper(), [])
        
        # Update History
        step_dict = {
            "step": step_count,
            "champion": user_input,
            "action": action,
            "acting_team": acting_team,
            "champion_classes": c_classes
        }
        history_list.append(step_dict)
        seen_champs.add(champ_id)
        step_count += 1

    print("\nDraft Session Ended.")

if __name__ == "__main__":
    main()
