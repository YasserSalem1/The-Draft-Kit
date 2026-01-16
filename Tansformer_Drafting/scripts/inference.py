import torch
import torch.nn.functional as F
import argparse
import json
import sys
import os

# Add parent directory to path to allow importing from src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.model import DraftTransformer
from src.tokenizer import LoLTokenizer

def predict_next_champion(model, tokenizer, history, k=5, device='cpu', fearless_bans=None):
    """
    Predicts the top k most likely next champions given the draft history.
    Args:
        fearless_bans (list): List of champion names that are unavailable due to Fearless Draft.
    """
    model.eval()
    
    # 1. Encode History
    # 1. Encode History
    input_ids = tokenizer.encode(history)
    input_tensor = torch.tensor(input_ids, dtype=torch.long).unsqueeze(0).to(device) # [1, seq_len]
    
    # 2. Identify Unavailable Champions (Bans + Picks + Fearless)
    unavailable_ids = set()
    
    # Add Fearless Bans
    if fearless_bans:
        for ch in fearless_bans:
            if ch in tokenizer.vocab:
                unavailable_ids.add(tokenizer.vocab[ch])
                
    # Add Current Draft Bans and Picks
    for step in history:
        champ = step.get('champion')
        if champ and champ in tokenizer.vocab:
             unavailable_ids.add(tokenizer.vocab[champ])

    with torch.no_grad():
        # Forward pass (Encoder Only)
        logits = model(input_tensor)
        # logits: [1, vocab_size]
        
        # MASKING: Set logits of unavailable champions to -infinity
        for uid in unavailable_ids:
            if uid < logits.size(1):
                 logits[0, uid] = float('-inf')

        # Softmax
        probs = F.softmax(logits, dim=1)
        
        # Get Top K
        top_probs, top_indices = torch.topk(probs, k, dim=1)
        
    predictions = []
    for i in range(k):
        token_id = top_indices[0][i].item()
        probability = top_probs[0][i].item()
        
        token_name = tokenizer.id_to_token.get(token_id, "UNKNOWN")
        predictions.append((token_name, probability))
            
    return predictions

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_path", default="draft_transformer.pth")
    parser.add_argument("--vocab_path", default="Data/metadata/vocab.json")
    parser.add_argument("--d_model", type=int, default=256)
    parser.add_argument("--nhead", type=int, default=8)
    parser.add_argument("--layers", type=int, default=4)
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--input_history", type=str, help="JSON string of history list")
    parser.add_argument("--fearless", type=str, help="Comma-separated list of fearless banned champions")
    
    args = parser.parse_args()
    
    device = torch.device(args.device)
    if torch.backends.mps.is_available():
        device = torch.device("mps")
    
    print(f"Loading Tokenizer from {args.vocab_path}...")
    tokenizer = LoLTokenizer(args.vocab_path)
    
    print(f"Loading Model from {args.model_path}...")
    model = DraftTransformer(vocab_size=len(tokenizer.vocab), d_model=args.d_model, nhead=args.nhead, num_layers=args.layers)
    try:
        model.load_state_dict(torch.load(args.model_path, map_location=device))
    except FileNotFoundError:
        print("Model file not found. Please train the model first.")
        return
        
    model.to(device)
    
    # Input handling
    if args.input_history:
        try:
            history = json.loads(args.input_history)
        except:
            print("Error parsing input history JSON.")
            return
    else:
        # Default/Demo Input
        print("No input history provided. Using a sample history...")
        history = [{'step': 1, 'side': 'blue', 'action': 'ban', 'champion': 'Aatrox'}] 
    
    # Process Fearless
    fearless_list = []
    if args.fearless:
        fearless_list = [x.strip() for x in args.fearless.split(",")]
        print(f"Fearless Bans: {fearless_list}")

    print("\nDraft History:")
    for step in history:
        print(f"  Step {step.get('step')}: {step.get('side')} {step.get('action')} {step.get('champion')}")
        
    print("\nPredicting Top 5 Next Champions...")
    predictions = predict_next_champion(model, tokenizer, history, k=5, device=device, fearless_bans=fearless_list)
    
    if not predictions:
        print("Could not find a champion prediction in the next meaningful step.")
    else:
        # Requested Format
        # champion 1: prob x
        # champion2 : prob y
        print("-" * 30)
        for i, (champ, prob) in enumerate(predictions):
            print(f"champion {i+1}: prob {prob:.4f}")
            print(f"   ({champ})") # Added name for clarity
        print("-" * 30)

if __name__ == "__main__":
    main()
