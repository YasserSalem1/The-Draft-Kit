
import json
import os
import sys

# Add src to path
sys.path.append(os.getcwd())

from src.tokenizer import DraftTokenizer
from src.dataset import DraftDataset

def count_splits():
    VOCAB_PATH = "Data/metadata/vocab.json"
    DATA_PATH = "Data/raw/all_games.json"
    
    if not os.path.exists(DATA_PATH):
        print("❌ Data file not found.")
        return

    tokenizer = DraftTokenizer(VOCAB_PATH)
    
    train_ds = DraftDataset(DATA_PATH, tokenizer, split='train')
    val_ds = DraftDataset(DATA_PATH, tokenizer, split='val')
    test_ds = DraftDataset(DATA_PATH, tokenizer, split='test')
    
    print(f"📊 Dataset Split Summary:")
    print(f"   Train: {len(train_ds)} matches")
    print(f"   Val:   {len(val_ds)} matches")
    print(f"   Test:  {len(test_ds)} matches")
    print(f"   Total: {len(train_ds) + len(val_ds) + len(test_ds)} matches")

if __name__ == "__main__":
    count_splits()
