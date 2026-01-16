
import torch
import json
import sys
import os

# Create dummy dependencies if not present
if not os.path.exists("src"): os.makedirs("src", exist_ok=True)
if not os.path.exists("dummy_vocab.json"):
    with open("dummy_vocab.json", 'w') as f:
        # Create a tiny vocab
        vocab = {"[PAD]": 0, "[UNK]": 1, "Ahri": 2, "Garen": 3, "Zed": 4, "T1": 5, "Gen.G": 6}
        json.dump(vocab, f)

# Add . to path
sys.path.append(os.getcwd())

from src.tokenizer import DraftTokenizer
from src.model import DraftTransformer

def test_pipeline():
    print("--- 1. Testing Tokenizer ---")
    tokenizer = DraftTokenizer("dummy_vocab.json")
    
    # Dummy Input
    context = {"blue_team": "T1", "red_team": "Gen.G", "game_in_series": 2}
    history = [
        {"step": "1", "champion": "Ahri", "action": "BAN", "acting_team": "BLUE"},
        {"step": "2", "champion": "Garen", "action": "PICK", "acting_team": "RED"}
    ]
    
    encoded = tokenizer.encode(context, history, max_len=10)
    print("Encoded Keys:", encoded.keys())
    print("Context:", encoded['context'])
    print("Sequenc Champs:", encoded['sequence']['champion_ids'])
    
    # --- 2. Testing Model ---
    print("\n--- 2. Testing Model Shape ---")
    model = DraftTransformer(vocab_size=10, team_vocab_size=10, d_model=32, nhead=2, num_layers=2)
    
    # Prepare Batch (Size 2)
    ctx_data = {
        'context_blue': torch.tensor([encoded['context']['blue_team_id'], 0]),
        'context_red':  torch.tensor([encoded['context']['red_team_id'], 0]),
        'context_game': torch.tensor([encoded['context']['game_num'], 1])
    }
    
    seq_data = {
        'champ_ids': torch.tensor([encoded['sequence']['champion_ids'], [0]*10]),
        'action_ids': torch.tensor([encoded['sequence']['action_ids'], [0]*10]),
        'team_ids': torch.tensor([encoded['sequence']['team_ids'], [0]*10]),
        'pos_ids': torch.tensor([encoded['sequence']['position_ids'], [0]*10])
    }
    
    print("Input Batch Size:", ctx_data['context_blue'].shape[0])
    
    logits = model(ctx_data, seq_data)
    print("Output Logits Shape:", logits.shape)
    
    # Expect [Batch=2, SeqLen=11 (10+1 context), Vocab=10]
    expected_seq = 10 + 1 
    if logits.shape == (2, expected_seq, 10):
        print("✅ SUCCESS: Shape matches [Batch, Seq+Ctx, Vocab]")
    else:
        print(f"❌ FAILURE: Expected (2, {expected_seq}, 10), got {logits.shape}")

if __name__ == "__main__":
    test_pipeline()
