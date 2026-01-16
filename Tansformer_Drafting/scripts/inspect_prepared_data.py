
import os
import sys
import torch
import json

# Ensure we can import from src
sys.path.append(os.getcwd())

from src.tokenizer import DraftTokenizer
from src.dataset import DraftDataset

def inspect_data():
    vocab_path = 'Data/metadata/vocab.json'
    data_path = 'Data/raw/all_games.json'
    
    if not os.path.exists(vocab_path):
        print(f"❌ Vocab not found at {vocab_path}")
        return
        
    print(f"--- Loading Tokenizer from {vocab_path} ---")
    tokenizer = DraftTokenizer(vocab_path)
    
    print(f"--- Loading Dataset from {data_path} ---")
    # Load just a few items
    dataset = DraftDataset(data_path, tokenizer, max_len=21, split="train") # len 21 to see full context
    
    print(f"Dataset Size: {len(dataset)}")
    
    # Inspect first 3 samples
    for i in range(3):
        print(f"\n================ SAMPLE {i} ================")
        sample = dataset[i]
        
        # 1. Context Features
        b_id = sample['context_blue'].item()
        r_id = sample['context_red'].item()
        g_num = sample['context_game'].item()
        
        # Decode Teams (Inverse lookup not perfect if teams share vocab with champs, but let's try)
        # Tokenizer vocab has strings. We can lookup ID->String.
        blue_name = tokenizer.id_to_token.get(b_id, f"ID:{b_id}")
        red_name = tokenizer.id_to_token.get(r_id, f"ID:{r_id}")
        
        print(f"CONTEXT | Game {g_num} | Blue: {blue_name} vs Red: {red_name}")
        
        # 2. Sequence Features
        # sample['champ_ids'] is shape [T]
        champs = sample['champ_ids'].tolist()
        actions = sample['action_ids'].tolist()
        teams = sample['team_ids'].tolist()
        positions = sample['pos_ids'].tolist()
        
        print(f"\n{'Step':<5} | {'Team':<6} | {'Action':<6} | {'Champion':<15} | {'Raw IDs (C,A,T,P)'}")
        print("-" * 75)
        
        # Action Map Inverse
        act_map = {0: "BAN", 1: "PICK"}
        team_map = {0: "BLUE", 1: "RED"}
        
        for idx, (c, a, t, p) in enumerate(zip(champs, actions, teams, positions)):
            if c == tokenizer.pad_token_id:
                continue # Skip padding for clean view
                
            c_name = tokenizer.id_to_token.get(c, "UNK")
            a_name = act_map.get(a, "UNK")
            t_name = team_map.get(t, "UNK")
            
            print(f"{p:<5} | {t_name:<6} | {a_name:<6} | {c_name:<15} | ({c}, {a}, {t}, {p})")

if __name__ == "__main__":
    inspect_data()
