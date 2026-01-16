
import json
import os
from pathlib import Path

def rebuild_vocab():
    VOCAB_PATH = Path("Data/metadata/vocab.json")
    CLASS_PATH = Path("champion_classes.json")
    
    if not CLASS_PATH.exists():
        print("❌ champion_classes.json not found.")
        return

    print("♻️ Rebuilding Vocab from scratch...")

    # 1. Define Special Tokens (Fixed IDs 0-45 approximately)
    # We explicitly list them to ensure order and presence
    vocab = {
        "[PAD]": 0,
        "[START]": 1,
        "[END]": 2,
        "[SEP]": 3,
        "SIDE_BLUE": 4,
        "SIDE_RED": 5,
        "ACTION_BAN": 6,
        "ACTION_PICK": 7,
        "CLASS_ASSASSIN": 8,
        "CLASS_FIGHTER": 9,
        "CLASS_MAGE": 10,
        "CLASS_MARKSMAN": 11,
        "CLASS_SUPPORT": 12,
        "CLASS_TANK": 13,
        "CLASS_UNKNOWN": 14,
        # Steps 1-20
        "STEP_1": 15, "STEP_2": 16, "STEP_3": 17, "STEP_4": 18, "STEP_5": 19,
        "STEP_6": 20, "STEP_7": 21, "STEP_8": 22, "STEP_9": 23, "STEP_10": 24,
        "STEP_11": 25, "STEP_12": 26, "STEP_13": 27, "STEP_14": 28, "STEP_15": 29,
        "STEP_16": 30, "STEP_17": 31, "STEP_18": 32, "STEP_19": 33, "STEP_20": 34,
        # Explicit BLUE/RED tokens (legacy/fallback if SIDE_X isn't used directly)
        "BLUE": 35,
        "RED": 36
    }
    
    next_id = 37
    
    # 2. Add Champions from Class File (Source of Truth)
    print("📚 Loading Champion Classes...")
    with open(CLASS_PATH, 'r') as f:
        class_data = json.load(f)
        
    # Flatten all champions into a sorted set to ensure deterministic ID assignment
    all_champs = set()
    for category, champs in class_data.items():
        for c in champs:
            all_champs.add(c)
            
    print(f"   Found {len(all_champs)} unique champions.")
    
    sorted_champs = sorted(list(all_champs))
    
    for champ in sorted_champs:
        if champ not in vocab:
            vocab[champ] = next_id
            next_id += 1
            
    # 3. Save
    print(f"💾 Saving clean vocab ({len(vocab)} tokens) to {VOCAB_PATH}...")
    with open(VOCAB_PATH, 'w') as f:
        json.dump(vocab, f, indent=2)
        
    print("✅ Vocab Rebuild Complete. Team names removed.")

if __name__ == "__main__":
    rebuild_vocab()
