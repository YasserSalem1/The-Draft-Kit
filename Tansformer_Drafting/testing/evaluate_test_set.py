
import torch
import sys
import os
from torch.utils.data import DataLoader
from tqdm import tqdm

# Add src to path
sys.path.append(os.getcwd())

from src.tokenizer import DraftTokenizer
from src.dataset import DraftDataset
from src.model import DraftTransformer

def evaluate():
    # Config
    MODEL_PATH = "checkpoints/model_epoch_20.pt"
    VOCAB_PATH = "Data/metadata/vocab.json"
    # Direct File
    DATA_PATH = "Data/processed/test_games.json"
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu')
    BATCH_SIZE = 32
    
    print(f"📊 Running Full Test Set Evaluation...")
    
    if not os.path.exists(MODEL_PATH):
        print("❌ Model not found.")
        return

    tokenizer = DraftTokenizer(VOCAB_PATH)
    # Important: Load direct file
    test_ds = DraftDataset(DATA_PATH, tokenizer)
    test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE, shuffle=False)
    
    print(f"Test Set Size: {len(test_ds)} games")
    
    # Init Model
    model = DraftTransformer(len(tokenizer.vocab), len(tokenizer.vocab), d_model=256, nhead=8, num_layers=6).to(DEVICE)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    
    correct_top1 = 0
    correct_top5 = 0
    total_tokens = 0
    
    with torch.no_grad():
        for batch in tqdm(test_loader, desc="Evaluating"):
            batch = {k: v.to(DEVICE) for k, v in batch.items()}
            
            # Move to device
            ctx = {k: v.to(DEVICE) for k, v in batch.items() if k.startswith('context')}
            seq = {
                'champ_ids': batch['champ_ids'].to(DEVICE),
                'action_ids': batch['action_ids'].to(DEVICE),
                'team_ids': batch['team_ids'].to(DEVICE),
                'pos_ids': batch['pos_ids'].to(DEVICE),
                'class_vecs': batch['class_vecs'].to(DEVICE)
            }
            
            # Forward
            logits = model(ctx, seq) # [B, T+1, V]
            
            # Align: logits[:, :-1] predicts champ_ids
            preds = logits[:, :batch['champ_ids'].size(1), :]
            targets = batch['champ_ids']
            
            # Reshape
            flat_preds = preds.reshape(-1, len(tokenizer.vocab))
            flat_targets = targets.reshape(-1)
            
            # Mask Padding
            mask = flat_targets != tokenizer.pad_token_id
            flat_preds = flat_preds[mask]
            flat_targets = flat_targets[mask]
            
            if flat_targets.numel() == 0: continue
            
            total_tokens += flat_targets.numel()
            
            # Top 1
            _, top1 = flat_preds.max(1)
            correct_top1 += (top1 == flat_targets).sum().item()
            
            # Top 5
            _, top5 = flat_preds.topk(5, 1)
            expanded_targets = flat_targets.unsqueeze(1).expand_as(top5)
            correct_top5 += (top5 == expanded_targets).sum().item()
            
    acc1 = correct_top1 / total_tokens if total_tokens else 0
    acc5 = correct_top5 / total_tokens if total_tokens else 0
    
    print(f"\n🏆 Final Test Results:")
    print(f"   Top-1 Accuracy: {acc1:.2%}")
    print(f"   Top-5 Accuracy: {acc5:.2%}")
    print(f"   (Evaluated on {total_tokens} individual draft decisions)")

if __name__ == "__main__":
    evaluate()
