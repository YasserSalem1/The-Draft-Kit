import torch
from torch.utils.data import Dataset
import pandas as pd
import json

class DraftDataset(Dataset):
    def __init__(self, file_path, tokenizer, max_len=21):
        """
        Args:
            file_path (str): Path to the specific JSON file (e.g., 'Data/processed/train_games.json').
            tokenizer (DraftTokenizer): Instance of tokenizer.
            max_len (int): Max sequence length.
        """
        self.tokenizer = tokenizer
        self.max_len = max_len
        
        # Load Data directly
        with open(file_path, 'r') as f:
            self.data = json.load(f)
            
        print(f"✅ Loaded {len(self.data)} games from {file_path}")

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        game_data = self.data[idx]
        
        # New Minimal Schema: 'draft' key
        # Legacy: 'current_draft'
        history = game_data.get('draft', game_data.get('current_draft', []))
        
        # Context (Minimal)
        # We don't have team names anymore.
        # Pass generic context.
        ctx = {
            "blue_team": "BLUE",
            "red_team": "RED",
            "game_in_series": 1 # Default or from data if available
        }
        
        # Tokenize (returns dict of lists)
        encoded = self.tokenizer.encode(ctx, history, max_len=self.max_len)

        
        # Unpack Features
        ctx = encoded['context']
        seq = encoded['sequence']
        
        # Convert to Tensors
        # Context
        blue_id = torch.tensor(ctx['blue_team_id'], dtype=torch.long)
        red_id = torch.tensor(ctx['red_team_id'], dtype=torch.long)
        game_num = torch.tensor(ctx['game_num'], dtype=torch.long)
        
        # Sequence
        champ_ids = torch.tensor(seq['champion_ids'], dtype=torch.long)
        action_ids = torch.tensor(seq['action_ids'], dtype=torch.long)
        team_ids = torch.tensor(seq['team_ids'], dtype=torch.long)
        pos_ids = torch.tensor(seq['position_ids'], dtype=torch.long)
        
        # Class Multi-Hot Encoding
        # seq['class_ids_list'] is List[List[int]] len=MaxLen
        class_ids_list = seq['class_ids_list']
        num_classes = 6 # Known fixed size from Tokenizer
        
        # Create FloatTensor (MaxLen, NumClasses)
        class_tensor = torch.zeros((len(class_ids_list), num_classes), dtype=torch.float)
        
        for t_step, c_ids in enumerate(class_ids_list):
            for cid in c_ids:
                if 0 <= cid < num_classes:
                    class_tensor[t_step, cid] = 1.0
        
        # TARGET: The Champion ID at each step.
        # For auto-regressive training:
        # Input at step T is used to predict Target at step T (which is effectively step T+1's champion?).
        # Standard: Input [0..N-1], Target [1..N].
        # Or: Input [0..N], Target is same sequence shifted?
        # Let's align:
        # Labels should be `champ_ids` (The text we want to generate).
        # The Model will internally shift (Masking).
        labels = champ_ids.clone()
        
        # CONSTRAINT MASK
        # For each step T, we need a mask of valid champions.
        # This is expensive to compute for every step in a batch.
        # Optim: We only really need it for inference or detailed Eval.
        # For training Loss, we just want CrossEntropy on the Correct Target.
        # If the Target is valid, Loss is fine.
        # We can IGNORE the constraint mask during training for speed, 
        # OR we compute it to penalize invalid predictions explicitly?
        # Standard GPT training does NOT use a constraint mask in Loss. 
        # It just learns not to predict tokens that never appear in that context.
        # We will Return the Mask for potential use, but keep it simple.
        

        # CONSTRAINT MASK
        # Shape: (SeqLen, VocabSize)
        # We want to mask unavailable champions (already picked/banned).
        vocab_size = len(self.tokenizer.vocab)
        constraint_mask = torch.zeros((len(champ_ids), vocab_size), dtype=torch.float)
        
        # Track unavailable tokens (initially empty or special tokens?)
        # For simplicity, we only mask champions that appear in the sequence.
        unavailable = set()
        
        # Iterate through steps
        for i in range(len(champ_ids)):
            # 1. Apply current unavailability to this step's mask
            if unavailable:
                # Convert set to tensor indices
                unavail_indices = list(unavailable)
                # Set to -inf
                constraint_mask[i, unavail_indices] = float('-inf')
            
            # 2. Update unavailability for NEXT step
            # The champion at this input step is now taken.
            c_id = champ_ids[i].item()
            # Don't mask special tokens if they appear (like PAD or placeholders)
            # Assuming champ IDs > some threshold?
            # Or just checking if it is a champion.
            # Simple check: if it's not PAD/UNK etc.
            # But simpler: Just add it. If we mask PAD, it handles itself.
            if c_id != self.tokenizer.pad_token_id:
                unavailable.add(c_id)
        
        return {
            'context_blue': blue_id,
            'context_red': red_id,
            'context_game': game_num,
            'champ_ids': champ_ids,
            'action_ids': action_ids,
            'team_ids': team_ids,
            'pos_ids': pos_ids,
            'class_vecs': class_tensor, 
            'constraint_mask': constraint_mask, # New
            'labels': labels
        }
