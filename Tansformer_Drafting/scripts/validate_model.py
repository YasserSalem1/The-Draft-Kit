import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import argparse
import sys
import os
from tqdm import tqdm

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.model import DraftTransformer
from src.tokenizer import LoLTokenizer
from src.dataset import DraftDataset

def validate(args):
    # Force CPU to avoid MPS masked tensor issues, or use CUDA if available
    if torch.cuda.is_available():
        device = torch.device("cuda")
    else:
        # Fallback to CPU to avoid MPS NotImplementedError for now
        device = torch.device("cpu")
        
    print(f"Using device: {device}")
    
    # 1. Load Tokenizer & Data
    print(f"Loading Tokenizer from {args.vocab_path}...")
    tokenizer = LoLTokenizer(args.vocab_path)
    
    print(f"Loading Test Dataset from {args.test_path}...")
    test_dataset = DraftDataset(args.test_path, tokenizer)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size, shuffle=False)
    
    print(f"Test Set Size: {len(test_dataset)} samples")
    
    # 2. Load Model
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
    
    criterion = nn.CrossEntropyLoss(ignore_index=-100)
    
    # 3. Validation Loop
    total_loss = 0
    correct_1 = 0
    correct_5 = 0
    total_samples = 0
    
    print("\nStarting Validation...")
    with torch.no_grad():
        for batch in tqdm(test_loader, desc="Validating"):
            input_ids = batch['input_ids'].to(device)
            target_id = batch['target_id'].to(device)
            
            src_key_padding_mask = (input_ids == tokenizer.pad_token_id)
            
            logits = model(input_ids, src_key_padding_mask=src_key_padding_mask)
            
            # Filter valid targets
            valid_mask = (target_id != -100)
            if not valid_mask.any():
                continue
            
            # Loss
            loss = criterion(logits[valid_mask], target_id[valid_mask])
            total_loss += loss.item()
            
            # Metrics
            # Top-1
            preds = torch.argmax(logits, dim=1)
            correct_1 += (preds[valid_mask] == target_id[valid_mask]).sum().item()
            
            # Top-5
            _, top5 = torch.topk(logits, 5, dim=1)
            t_expanded = target_id.unsqueeze(1)
            correct_5 += (top5 == t_expanded)[valid_mask].any(dim=1).sum().item()
            
            total_samples += valid_mask.sum().item()
            
    # 4. Report
    if total_samples > 0:
        avg_loss = total_loss / len(test_loader)
        acc_1 = correct_1 / total_samples
        acc_5 = correct_5 / total_samples
        
        print("\n" + "="*50)
        print(f"FINAL TEST RESULTS")
        print("="*50)
        print(f"Model: {os.path.basename(args.model_path)}")
        print(f"Samples: {total_samples}")
        print("-" * 30)
        print(f"Loss:        {avg_loss:.4f}")
        print(f"Top-1 Acc:   {acc_1:.2%} ({correct_1}/{total_samples})")
        print(f"Top-5 Acc:   {acc_5:.2%} ({correct_5}/{total_samples})")
        print("="*50)
    else:
        print("No valid samples evaluated.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_path", required=True, help="Path to trained .pth model")
    parser.add_argument("--test_path", default="data/processed/test.parquet", help="Path to test data parquet")
    parser.add_argument("--vocab_path", default="Data/metadata/vocab.json", help="Path to vocab json")
    parser.add_argument("--batch_size", type=int, default=128)
    
    # Model Args
    parser.add_argument("--d_model", type=int, default=256)
    parser.add_argument("--nhead", type=int, default=8)
    parser.add_argument("--layers", type=int, default=4)
    
    args = parser.parse_args()
    validate(args)
