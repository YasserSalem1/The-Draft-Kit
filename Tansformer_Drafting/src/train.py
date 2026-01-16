
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from tqdm import tqdm
import math

from src.tokenizer import DraftTokenizer
from src.dataset import DraftDataset
from src.model import DraftTransformer

# --- Config ---
def get_config():
    MAX_LEN = 21         
    EPOCHS = 100          
    BATCH_SIZE = 32
    LEARNING_RATE = 1e-4 
    VOCAB_PATH = "Data/metadata/vocab.json"
    # Using specific split files now
    TRAIN_PATH = "Data/processed/train_games.json"
    VAL_PATH = "Data/processed/val_games.json"
    CHECKPOINT_DIR = "checkpoints"
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu')
    
    config = {
        'max_len': MAX_LEN,
        'epochs': EPOCHS,
        'batch_size': BATCH_SIZE,
        'lr': LEARNING_RATE,
        'vocab_path': VOCAB_PATH,
        'train_path': TRAIN_PATH,
        'val_path': VAL_PATH,
        'checkpoint_dir': CHECKPOINT_DIR,
        'device': DEVICE,
        'd_model': 256, # Preserving original model config
        'n_layers': 6,
        'n_heads': 8
    }
    return config

def get_dataloaders(config, tokenizer):
    print("📦 Loading Datasets...")
    
    # Load specific files
    train_ds = DraftDataset(config['train_path'], tokenizer, max_len=config['max_len'])
    val_ds = DraftDataset(config['val_path'], tokenizer, max_len=config['max_len'])
    
    print(f"Train Size: {len(train_ds)}")
    print(f"Val Size: {len(val_ds)}")
    
    train_loader = DataLoader(train_ds, batch_size=config['batch_size'], shuffle=True, num_workers=0)
    # Val shuffle=False is standard
    val_loader = DataLoader(val_ds, batch_size=config['batch_size'], shuffle=False, num_workers=0)
    
    return train_loader, val_loader

def train():
    config = get_config()
    device = config['device']
    print(f"🚀 Using device: {device}")
    
    # 1. Load Tokenizer
    if not os.path.exists(config['vocab_path']):
        raise FileNotFoundError(f"Vocab found found at {config['vocab_path']}")
        
    tokenizer = DraftTokenizer(config['vocab_path'])
    vocab_size = len(tokenizer.vocab)
    print(f"Vocab Size: {vocab_size}")
    
    # 2. Datasets
    train_loader, val_loader = get_dataloaders(config, tokenizer)
    
    # 3. Model
    # We need Team Vocab Size. Tokenizer doesn't explicitly expose it yet, 
    # but we can guess or pass a large enough number since it's just an embedding lookup.
    # If the tokenizer uses hash or index, we need to match. 
    # Current tokenizer implementation: `get_id` uses `self.vocab`.
    # So Teams share the SAME vocab as champions?
    # Wait, in my `tokenizer.py`:
    # `def get_id(s): return self.vocab.get(s, self.unknown_token_id)`
    # So YES, Teams must be in `vocab.json`.
    # So `team_vocab_size` passed to model should be `vocab_size` OR 
    # the model expects a separate Team Vocab? 
    # My Model `FeatureEmbedding` has `emb_ctx_team = nn.Embedding(team_vocab_size, ...)`
    # This implies we can index it with `blue_team_id`.
    # Since `blue_team_id` comes from `tokenizer.vocab`, the max index is `vocab_size`.
    # So `team_vocab_size` MUST be `vocab_size`.
    
    model = DraftTransformer(
        vocab_size=vocab_size,
        team_vocab_size=vocab_size, # Sharing same vocab indices
        d_model=config['d_model'],
        num_layers=config['n_layers'],
        nhead=config['n_heads'],
        dropout=0.1
    ).to(device)
    
    optimizer = optim.AdamW(model.parameters(), lr=config['lr'])
    criterion = nn.CrossEntropyLoss(ignore_index=tokenizer.pad_token_id)
    
    # 4. Training Loop
    os.makedirs(config['checkpoint_dir'], exist_ok=True)
    
    for epoch in range(config['epochs']):
        model.train()
        total_loss = 0
        
        loop = tqdm(train_loader, desc=f"Epoch {epoch+1}/{config['epochs']}")
        
        for batch in loop:
            # Move batch to device
            batch = {k: v.to(device) for k, v in batch.items()}
            
            # Forward
            # Context
            ctx_data = {
                'context_blue': batch['context_blue'],
                'context_red': batch['context_red'],
                'context_game': batch['context_game']
            }
            # Sequence
            seq_data = {
                'champ_ids': batch['champ_ids'],
                'action_ids': batch['action_ids'],
                'team_ids': batch['team_ids'],
                'pos_ids': batch['pos_ids'],
                'class_vecs': batch['class_vecs']
            }
            
            logits = model(ctx_data, seq_data) # [B, T+1, Vocab]
            
            # Apply Constraint Mask
            # Mask is [B, T, V]. Logits is [B, T+1, V].
            # We align preds (remove last logit) to match mask.
            # Or wait, logits[:, :-1] predicts sequence.
            # mask aligned with input `champ_ids`.
            
            # Logits: [Ctx, Step1, Step2 ... StepN]
            # Preds from Ctx -> Predicts Step1. Mask[0] should be empty (nothing taken).
            # Preds from Step1 -> Predicts Step2. Mask[1] should have Step1 taken.
            
            # Dataset returns mask aligned with `champ_ids` (Input Sequence).
            # mask[0] corresponds to state at Step 1 Input? No.
            # Loop in Dataset:
            # i=0 (Input Step 1): Mask has nothing. Updates set with Step 1 Champ.
            # i=1 (Input Step 2): Mask has Step 1 Champ.
            
            # Logics from Context (Index 0) -> Predicts Step 1.
            # Is Mask[0] the constraint for predicting Step 1?
            # Dataset Loop: i=0. Mask is empty.
            # So yes: Mask[0] = Constraints for prediction at Step 0 (which predicts Step 1).
            
            # However, logits has T+1. We ignore the last logit for training usually (predicts future).
            # But here `preds = logits[:, :batch['champ_ids'].size(1), :]`.
            # This aligns exactly with `batch['champ_ids']`.
            # So `preds` has shape [B, T, V].
            # `constraint_mask` has shape [B, T, V].
            
            mask = batch['constraint_mask'].to(device)
            masked_logits = logits[:, :mask.size(1), :] + mask
            
            # Use MASKED logits for prediction/loss
            preds = masked_logits
            
            # Targets
            # We want to predict Step T given History <T.
            # Logits correspond to positions [0..T].
            # Logit[0] (Ctx) -> Should predict Token 1 (Champ 1)?
            # Logit[1] (Step 1) -> Should predict Token 2?
            # ...
            # Logit[T-1] -> Should predict Token T?
            
            # Input `champ_ids` is [Champ1, Champ2, ... ChampN].
            # We want Logits[0:-1] to predict Labels[0:].
            # Wait, Input to model INCLUDES `champ_ids`. 
            # If we feed Champ1 at pos 1, we can't use it to predict Champ1. We use it to predict Champ2.
            # Context Token (Pos 0) predicts Champ1.
            # Step 1 (Champ1) predicts Champ2.
            # ...
            # Step N-1 predicts Champ N.
            
            # Shift Logits & Labels
            # Logits: [B, 22, Vocab] (Ctx + 21 steps if padded)
            # Labels: [B, 21]
            
            # We take Logits from 0 to N-1 (Predictions for next step)
            # We take Labels from 0 to N-1 (The actual next steps)
            
            # Note: logits has size T+1 because of Context token prepended.
            # logits[:, 0] comes from Context -> Predicts champ_ids[:, 0]
            # logits[:, 1] comes from Step 1 -> Predicts champ_ids[:, 1]
            
            # So we align:
            # Preds = logits[:, :-1, :]  (All except last prediction which has no truth)
            # Targets = champ_ids        (All steps)
            
            # Verify lengths:
            # ctx(1) + seq(20) = 21 input tokens -> 21 output logits.
            # We want to predict 20 champions.
            # logits[:, 0] -> predicts champ_ids[:, 0]
            # logits[:, 19] -> predicts champ_ids[:, 19]
            
            # So if `champ_ids` has length 20:
            preds = logits[:, :batch['champ_ids'].size(1), :]
            targets = batch['champ_ids']
            
            loss = criterion(preds.reshape(-1, vocab_size), targets.reshape(-1))
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            loop.set_postfix(loss=loss.item())
            
        avg_loss = total_loss / len(train_loader)
        
        # --- Validation Phase ---
        model.eval()
        val_loss = 0
        correct_top1 = 0
        correct_top5 = 0
        total_tokens = 0
        
        with torch.no_grad():
            for batch in val_loader:
                batch = {k: v.to(device) for k, v in batch.items()}
                
                # Forward (Same as train)
                ctx_data = {
                    'context_blue': batch['context_blue'],
                    'context_red': batch['context_red'],
                    'context_game': batch['context_game']
                }
                seq_data = {
                    'champ_ids': batch['champ_ids'],
                    'action_ids': batch['action_ids'],
                    'team_ids': batch['team_ids'],
                    'pos_ids': batch['pos_ids'],
                    'class_vecs': batch['class_vecs']
                }
                
                logits = model(ctx_data, seq_data) # [B, T+1, Vocab]
                
                # Apply Constraint Mask
                mask = batch['constraint_mask'].to(device)
                masked_logits = logits[:, :mask.size(1), :] + mask
                
                # Align Preds & Targets
                preds = masked_logits # [B, T, Vocab]
                targets = batch['champ_ids']                      # [B, T]
                
                # 1. Loss
                loss = criterion(preds.reshape(-1, vocab_size), targets.reshape(-1))
                val_loss += loss.item()
                
                # 2. Accuracy
                # Reshape for accuracy calc
                flat_preds = preds.reshape(-1, vocab_size) # [N, V]
                flat_targets = targets.reshape(-1)         # [N]
                
                # Filter PAD tokens
                mask = flat_targets != tokenizer.pad_token_id
                flat_preds = flat_preds[mask]
                flat_targets = flat_targets[mask]
                
                if flat_targets.numel() == 0:
                    continue
                    
                total_tokens += flat_targets.numel()
                
                # Top-1
                _, top1_pred = flat_preds.max(dim=1)
                correct_top1 += (top1_pred == flat_targets).sum().item()
                
                # Top-5
                _, top5_pred = flat_preds.topk(5, dim=1)
                # Expand targets to match (N, 5)
                expanded_targets = flat_targets.unsqueeze(1).expand_as(top5_pred)
                correct_top5 += (top5_pred == expanded_targets).sum().item()

        avg_val_loss = val_loss / len(val_loader)
        val_acc_1 = correct_top1 / total_tokens if total_tokens > 0 else 0
        val_acc_5 = correct_top5 / total_tokens if total_tokens > 0 else 0
        
        print(f"Epoch {epoch+1} | Train Loss: {avg_loss:.4f} | Val Loss: {avg_val_loss:.4f} | Val Acc@1: {val_acc_1:.2%} | Val Acc@5: {val_acc_5:.2%}")
        
        # Save Checkpoint
        torch.save(model.state_dict(), f"{config['checkpoint_dir']}/model_epoch_{epoch+1}.pt")

if __name__ == "__main__":
    train()
