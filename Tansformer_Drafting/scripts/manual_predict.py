import torch
import torch.nn.functional as F
import json
import argparse
import sys
import os
from collections import defaultdict

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.model import DraftTransformer
from src.tokenizer import LoLTokenizer

def load_champion_classes(json_path):
    if not os.path.exists(json_path):
        print(f"Warning: {json_path} not found. Class lookup will fail.")
        return {}
    
    with open(json_path, 'r') as f:
        data = json.load(f)
        
    # Invert to Champ -> [Classes]
    # Key dictionary by UPPERCASE champion name for case-insensitive lookup
    champ_to_classes = defaultdict(list)
    for cls, champs in data.items():
        u_cls = cls.upper()
        for c in champs:
            c_key = c.upper()
            if u_cls not in champ_to_classes[c_key]:
                champ_to_classes[c_key].append(u_cls)
    
    # Store with Original Casing from JSON for display? 
    # Actually, we need to return the list of classes (which are usually UPPERCASE in tokenizer)
    return champ_to_classes

def get_manual_input(step_num, valid_champs=None, class_map=None):
    while True:
        raw_in = input(f"Enter Champion for Step {step_num} (or 'exit'): ").strip()
        if raw_in.lower() == 'exit':
            return None
        
        # Check validity if possible
        # Try exact match first
        
        # We need a way to map User Input -> Tokenizer Vocabulary Key
        # The vocab usually has exact casing (e.g. "Kai'Sa", "Cho'Gath")
        # Let's try to find a case-insensitive match in the vocab
        
        found_champ = None
        if valid_champs:
            for v_c in valid_champs:
                if v_c.upper() == raw_in.upper():
                    found_champ = v_c
                    break
        
        if found_champ:
            # Look up class
            classes = class_map.get(found_champ.upper(), ["UNKNOWN"])
            
            # Confirm
            # print(f"  -> Selected: {found_champ} ({classes})")
            return {"step": step_num, "champion": found_champ, "champion_class": classes}
        else:
            print(f"  ❌ Champion '{raw_in}' not found in vocabulary. Try again.")

def interactive_predict(args):
    device = torch.device("cpu")
    print(f"Using device: {device}")
    
    # 1. Load Vocab & Tokenizer
    print(f"Loading Tokenizer from {args.vocab_path}...")
    tokenizer = LoLTokenizer(args.vocab_path)
    
    # Filter valid champions (exclude special tokens, classes, steps, etc.)
    # Vocab keys that are NOT special
    valid_champs = [
        k for k in tokenizer.vocab.keys() 
        if not k.startswith("[") and not k.startswith("STEP_") 
        and not k.startswith("SIDE_") and not k.startswith("ACTION_")
        and not k.startswith("CLASS_")
    ]
    
    # 2. Load Class DB
    class_db_path = os.path.join(os.path.dirname(__file__), '..', 'champion_classes.json')
    class_map = load_champion_classes(class_db_path)
    
    # 3. Load Model
    print(f"Loading Model from {args.model_path}...")
    model = DraftTransformer(vocab_size=len(tokenizer.vocab), d_model=args.d_model, nhead=args.nhead, num_layers=args.layers)
    
    try:
        state_dict = torch.load(args.model_path, map_location=device)
        model.load_state_dict(state_dict)
    except Exception as e:
        print(f"Error loading model: {e}")
        return
        
    model.to(device)
    model.eval()
    
    print("\n" + "="*50)
    print(" INTERACTIVE DRAFT PREDICTOR")
    print(" Type 'exit' to quit.")
    print("="*50)
    
    current_history = []
    
    # Loop for 20 steps max
    for i in range(20):
        step_num = i + 1
        
        # 1. Get User Input
        choice = get_manual_input(step_num, valid_champs, class_map)
        if choice is None:
            break
            
        current_history.append(choice)
        
        # 2. Add to context and Predict Next
        input_ids = tokenizer.encode(current_history)
        
        input_tensor = torch.tensor(input_ids, dtype=torch.long).unsqueeze(0).to(device)
        src_mask = (input_tensor == tokenizer.pad_token_id)
        
        print("-" * 40)
        print(f"Draft Progress: {len(current_history)}/20 picks made.")
        print("Predicting next best moves...")
        
        with torch.no_grad():
            logits = model(input_tensor, src_key_padding_mask=src_mask)
            
            # Filter already picked/banned
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
        
        print(f"\nTOP 5 RECOMMENDATIONS for STEP {step_num + 1}:")
        for r in range(5):
            tid = top_indices[0][r].item()
            p = top_probs[0][r].item()
            tname = tokenizer.id_to_token.get(tid, "UNKNOWN")
            
            # Optional: Show class of prediction
            pred_classes = class_map.get(tname.upper(), ["?"])
            cls_str = pred_classes[0] if pred_classes else "?"
            
            print(f"  {r+1}. {tname:<15} ({cls_str:<8}) | {p:.1%}")
        print("-" * 40)

    print("\nDraft Completed or Exited.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_path", required=True, help="Path to trained .pth model")
    parser.add_argument("--vocab_path", default="Data/metadata/vocab.json", help="Path to vocab json")
    
    # Model Args
    parser.add_argument("--d_model", type=int, default=256)
    parser.add_argument("--nhead", type=int, default=8)
    parser.add_argument("--layers", type=int, default=4)
    
    args = parser.parse_args()
    interactive_predict(args)
