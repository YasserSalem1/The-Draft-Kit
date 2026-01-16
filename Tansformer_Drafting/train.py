import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import argparse
from tqdm import tqdm
from src.model import DraftTransformer
from src.tokenizer import LoLTokenizer
from src.dataset import DraftDataset

def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Using device: {device}")

    print("Loading Tokenizer...")
    tokenizer = LoLTokenizer(args.vocab_path)
    
    print("Loading Datasets...")
    train_dataset = DraftDataset(args.train_path, tokenizer, max_len=args.max_len)
    val_dataset = DraftDataset(args.val_path, tokenizer, max_len=args.max_len)
    
    print(f"Train size: {len(train_dataset)}, Val size: {len(val_dataset)}")
    
    model = DraftTransformer(vocab_size=len(tokenizer.vocab), d_model=args.d_model, nhead=args.nhead, num_layers=args.layers).to(device)
    
    # Debug Visualization
    if args.debug:
        print("\n[DEBUG] Visualizing first batch of data...")
        sample = train_dataset[0]
        input_ids = sample['input_ids'].tolist()
        target_ids = sample['target_ids'].tolist()
        
        decoded_input = tokenizer.decode(input_ids)
        decoded_target = tokenizer.decode(target_ids)
        
        # Filter out padding for cleaner view
        decoded_input = [t for t in decoded_input if t not in ["[PAD]", ""]]
        decoded_target = [t for t in decoded_target if t not in ["[PAD]", ""]]
        
        print(f"Sample Input: {decoded_input}")
        print(f"Sample Target: {decoded_target}")
        
        # DEMO: Run Inference with Untrained Model
        print("\n[DEBUG] Running Demo Inference (Untrained Model)...")
        model.eval()
        
        # Encoder-Only Inference (Single Forward Pass)
        src = torch.tensor(input_ids, dtype=torch.long).unsqueeze(0).to(device)
        src_mask = (src == tokenizer.pad_token_id)
        
        with torch.no_grad():
            logits = model(src, src_key_padding_mask=src_mask)
            # logits: [1, vocab_size]
            
            import torch.nn.functional as F
            probs = F.softmax(logits, dim=1)
            
            top_probs, top_indices = torch.topk(probs, 5, dim=1)
            
        print("-" * 30)
        print("Top 5 Champion Predictions (Untrained):")
        for i in range(5):
            tid = top_indices[0][i].item()
            p = top_probs[0][i].item()
            tname = tokenizer.id_to_token.get(tid, "UNKNOWN")
            print(f"champion {i+1}: prob {p:.4f} ({tname})")
        print("-" * 30)

        print("-" * 50)
        
        if args.only_debug:
             return

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size)
    
    criterion = nn.CrossEntropyLoss(ignore_index=-100, label_smoothing=0.1) 
    # Added Weight Decay for regularization
    optimizer = optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    
    # Added LR Scheduler
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)
    
    print("Starting Training (Classification)...")
    print(f"Model Configuration: d_model={args.d_model}, layers={args.layers}, heads={args.nhead}")
    
    for epoch in range(args.epochs):
        model.train()
        total_loss = 0
        
        # ... (Debug block omitted for brevity, assuming standard loop structure) ...
        if args.debug:
             # Keep existing debug block logic if needed, or simplify for brevity in this replace
             pass 

        progress_bar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{args.epochs}")
        
        for batch in progress_bar:
            input_ids = batch['input_ids'].to(device)
            target_id = batch['target_id'].to(device)
            
            src_key_padding_mask = (input_ids == tokenizer.pad_token_id)
            
            optimizer.zero_grad()
            logits = model(input_ids, src_key_padding_mask=src_key_padding_mask)
            loss = criterion(logits, target_id)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            progress_bar.set_postfix({'loss': loss.item()})
            
        avg_loss = total_loss / len(train_loader)
        
        # Validation
        model.eval()
        val_loss = 0
        correct_1 = 0
        correct_5 = 0
        total = 0
        
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch['input_ids'].to(device)
                target_id = batch['target_id'].to(device)
                src_key_padding_mask = (input_ids == tokenizer.pad_token_id)
                logits = model(input_ids, src_key_padding_mask=src_key_padding_mask)
                
                valid_mask = (target_id != -100)
                if not valid_mask.any(): continue
                    
                v_loss = criterion(logits[valid_mask], target_id[valid_mask])
                val_loss += v_loss.item()
                
                preds = torch.argmax(logits, dim=1)
                correct_1 += (preds[valid_mask] == target_id[valid_mask]).sum().item()
                
                _, top5 = torch.topk(logits, 5, dim=1)
                t_expanded = target_id.unsqueeze(1)
                correct_5 += (top5 == t_expanded)[valid_mask].any(dim=1).sum().item()
                total += valid_mask.sum().item()
        
        if total > 0:
            val_acc_1 = correct_1 / total
            val_acc_5 = correct_5 / total
            avg_val_loss = val_loss / len(val_loader)
            
            # Step Scheduler
            scheduler.step(avg_val_loss)
            
            print(f"Epoch {epoch+1} | Train Loss: {avg_loss:.4f} | Val Loss: {avg_val_loss:.4f}")
            print(f"   >> Top-1 Acc: {val_acc_1:.2%} (Exact Match)")
            print(f"   >> Top-5 Acc: {val_acc_5:.2%} (Recommendation Hit)")
        else:
            print(f"Epoch {epoch+1} | Train Loss: {avg_loss:.4f} | Validation skipped.")

        # Save Checkpoint (Every 10 epochs)
        if (epoch + 1) % 10 == 0:
            import os
            os.makedirs("checkpoints", exist_ok=True)
            checkpoint_path = f"checkpoints/draft_transformer_epoch_{epoch+1}.pth"
            torch.save(model.state_dict(), checkpoint_path)
            print(f"Model checkpoint saved to {checkpoint_path}")
        
        # Save Latest
        torch.save(model.state_dict(), "draft_transformer.pth")

    print(f"Training completed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--train_path", default="data/processed/train.parquet")
    parser.add_argument("--val_path", default="data/processed/val.parquet")
    parser.add_argument("--vocab_path", default="Data/metadata/vocab.json")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-4)     # Increased LR slightly for larger model
    parser.add_argument("--d_model", type=int, default=512)   # IAM: High Capacity
    parser.add_argument("--nhead", type=int, default=8)
    parser.add_argument("--layers", type=int, default=8)      # IAM: Deeper Network
    parser.add_argument("--max_len", type=int, default=256)   # IAM: Safe Context Window
    parser.add_argument("--debug", action="store_true", help="Visualize tokens before training")
    parser.add_argument("--only_debug", action="store_true", help="Exit after debug visualization")
    
    args = parser.parse_args()
    train(args)
