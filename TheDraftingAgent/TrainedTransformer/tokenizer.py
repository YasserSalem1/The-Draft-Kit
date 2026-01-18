import json
from typing import List, Dict

class DraftTokenizer:
    def __init__(self, vocab_path: str):
        with open(vocab_path, 'r') as f:
            self.vocab = json.load(f)
            
        self.id_to_token = {v: k for k, v in self.vocab.items()}
        self.pad_token_id = self.vocab.get("[PAD]", 0)
        self.unknown_token_id = self.vocab.get("CLASS_UNKNOWN", 20) # Fallback

        # Mappings for categorical features
        # Action: BAN=0, PICK=1
        self.action_map = {"BAN": 0, "PICK": 1}
        
        # Team: BLUE=0, RED=1
        self.team_map = {"BLUE": 0, "RED": 1}

        # Champion Classes
        # "Fighter", "Assassin", "Mage", "Marksman", "Support", "Tank"
        self.class_map = {
            "Fighter": 0,
            "Assassin": 1,
            "Mage": 2,
            "Marksman": 3,
            "Support": 4,
            "Tank": 5
        }
        self.num_classes = len(self.class_map)

    def encode(self, context_dict, history_list, max_len=21):
        """
        Encodes a full draft sequence into feature tensors.
        
        Args:
            context_dict (dict): The Context Token 0 data (blue_team, red_team, game_in_series).
            history_list (list): List of draft step dictionaries.
            max_len (int): Total sequence length to pad/truncate to.
            
        Returns:
            dict: Dictionary of 1D tensors (lists of ints) for each feature.
        """
        # --- Feature Lists ---
        # We start with empty lists (will fill Token 0 first)
        champion_ids = []
        action_ids = []
        team_ids = []
        position_ids = []

        # --- 1. Token 0: Context ---
        # Context doesn't have a "Champion" or "Action". 
        # But we need placeholders to keep shapes aligned if we concat.
        # Strategy: Use PAD or Special Tokens for unused slots in Token 0.
        # Actually, the plan says Context Token has SEPARATE projection path.
        # But for the Dataset __getitem__, let's return all aligned sequences.
        # We will use [PAD] (0) for irrelevant features at Step 0.
        
        # NOTE: Model handles Context Token Special Logic.
        # Here we just encode the raw data if we can, or we pass specific context features.
        # Plan says: Token 0 = {BlueTeam, RedTeam, GameNum}
        # Step N = {Champ, Action, Team, Pos}
        
        # To make it simple for the Model's "forward":
        # We will return `context_features` separate from `seq_features` OR
        # We assume the Model's Embedding Layer handles index 0 specially.
        # Let's go with: Index 0 is just [PAD, PAD, PAD, PAD] in standard streams,
        # AND we return "context_ids" separately.
        
        # WAIT, Model Architecture in Plan:
        # "Input: [Context Token] + [Draft Tokens 1 to N]"
        # "Embedding Layer (champion + action + team + position)"
        # This implies UNIFORM embedding space? 
        # Actually, plan said: "Context token (Token 0): Blue Team(64), Red Team(64)..."
        # This means Token 0 has DIFFERENT features.
        
        # SOLUTION: The Tokenizer will return a Dict with:
        # 'context': { 'blue_team_id': ..., 'red_team_id': ..., 'game_num': ... }
        # 'sequence': { 'champion_ids': [...], 'action_ids': [...], 'team_ids': [...], 'step_ids': [...] }
        
        # Context Encoding (Minimal / Generic)
        c_blue_id = self.vocab.get("BLUE", self.unknown_token_id)
        c_red_id = self.vocab.get("RED", self.unknown_token_id)
        c_game_num = int(context_dict.get('game_in_series', 1))

        # --- 2. Sequence Encoding ---
        history_seq = history_list 
        
        # New Feature lists
        class_ids_list = [] # Will be list of lists

        for step in history_seq:
            # CHAMPION
            c_name = step.get('champion')
            cid = self.vocab.get(c_name, self.unknown_token_id)
            champion_ids.append(cid)
            
            # ACTION & TEAM
            act = step.get('action', 'BAN').upper()
            side = step.get('team', 'BLUE').upper()
            
            if 'acting_team' in step and not side: side = step['acting_team'].upper()
            
            action_ids.append(self.action_map.get(act, 0))
            team_ids.append(self.team_map.get(side, 0))
            
            # POSITION
            s_num = int(step.get('step', 1))
            position_ids.append(s_num)
            
            # CLASSES
            # Step should have 'champion_classes' list e.g. ["Mage", "Support"]
            # If not present (legacy data), we might need to look it up?
            # But we enriched the json files, so it should be there.
            classes = step.get('champion_classes', [])
            # Map strings to IDs
            current_c_ids = [self.class_map.get(c, -1) for c in classes]
            # Filter valid
            current_c_ids = [c for c in current_c_ids if c != -1]
            class_ids_list.append(current_c_ids)

        # Truncate / Pad
        curr_len = len(champion_ids)
        if curr_len < max_len:
            pad_len = max_len - curr_len
            champion_ids += [self.pad_token_id] * pad_len
            action_ids += [0] * pad_len
            team_ids += [0] * pad_len
            position_ids += [0] * pad_len
            class_ids_list += [[]] * pad_len # Pad with empty lists
        else:
            champion_ids = champion_ids[:max_len]
            action_ids = action_ids[:max_len]
            team_ids = team_ids[:max_len]
            position_ids = position_ids[:max_len]
            class_ids_list = class_ids_list[:max_len]

        return {
            "context": {
                "blue_team_id": c_blue_id,
                "red_team_id": c_red_id,
                "game_num": c_game_num
            },
            "sequence": {
                "champion_ids": champion_ids,
                "action_ids": action_ids,
                "team_ids": team_ids,
                "position_ids": position_ids,
                "class_ids_list": class_ids_list # List of Lists
            }
        }

    def decode(self, token_ids):
        return [self.id_to_token.get(t, "UNK") for t in token_ids]
