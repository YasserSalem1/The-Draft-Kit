from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import os
import sys
import json
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from tokenizer import DraftTokenizer
from model import DraftTransformer

app = Flask(__name__)
CORS(app)

# -------------------------------------------------------------------
# Configuration & Globals
# -------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Load env vars from .env file in the same directory
load_dotenv(os.path.join(BASE_DIR, '.env'))

if os.getenv("GROQ_API_KEY"):
    print("✅ Groq API Key loaded successfully.")
else:
    print("⚠️ WARNING: GROQ_API_KEY not found in .env file.")

MODEL_PATH = os.path.join(BASE_DIR, "model_epoch_20.pt")
VOCAB_PATH = os.path.join(BASE_DIR, "vocab.json")
CLASS_DB_PATH = os.path.join(BASE_DIR, "champion_classes.json")

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu')

model = None
tokenizer = None
champ_class_map = {}

# Standard Draft Order (matches lib/draft/types.ts and inference.py logic)
DRAFT_ORDER = [
    # Bans 1
    ('blue', 'BAN'), ('red', 'BAN'), ('blue', 'BAN'), ('red', 'BAN'), ('blue', 'BAN'), ('red', 'BAN'),
    # Picks 1
    ('blue', 'PICK'), ('red', 'PICK'), ('red', 'PICK'), ('blue', 'PICK'), ('blue', 'PICK'), ('red', 'PICK'),
    # Bans 2
    ('red', 'BAN'), ('blue', 'BAN'), ('red', 'BAN'), ('blue', 'BAN'),
    # Picks 2
    ('red', 'PICK'), ('blue', 'PICK'), ('blue', 'PICK'), ('red', 'PICK')
]

def load_champion_classes(path):
    if not os.path.exists(path):
        return {}
    with open(path, 'r') as f:
        data = json.load(f)
    mapping = {}
    for cls, champs in data.items():
        for c in champs:
            c_upper = c.upper()
            if c_upper not in mapping:
                mapping[c_upper] = []
            mapping[c_upper].append(cls)
    return mapping

def init_resources():
    global model, tokenizer, champ_class_map
    
    print(f"Server initializing on {DEVICE}...")
    
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VOCAB_PATH):
        print("CRITICAL: Missing model or vocab files.")
        sys.exit(1)
        
    tokenizer = DraftTokenizer(VOCAB_PATH)
    champ_class_map = load_champion_classes(CLASS_DB_PATH)
    
    vocab_size = len(tokenizer.vocab)
    model = DraftTransformer(vocab_size, vocab_size, d_model=256, nhead=8, num_layers=6).to(DEVICE)
    
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        model.eval()
        print("✅ Model loaded successfully.")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        sys.exit(1)

from groq import Groq

# Initialize Groq
API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    print("⚠️ Groq API Key missing. Strategic Layer will be disabled.")

class StrategyManager:
    def __init__(self):
        self.cache = {} # Key: (blue_team_name, red_team_name) -> Strategy Dict
        if API_KEY:
            self.client = Groq(api_key=API_KEY)
        else:
            self.client = None
        
    def get_phase_key(self, side, action, step_index):
        # Map step index to phases
        # Phase 1 Bans: 0-5
        # Phase 1 Picks: 6-11
        # Phase 2 Bans: 12-15
        # Phase 2 Picks: 16-19
        
        phase_num = 1
        if step_index >= 12: phase_num = 2
        
        # e.g. blue_ban_phase_1
        return f"{side.lower()}_{action.lower()}_phase_{phase_num}"

    def _generate_content(self, prompt):
        completion = self.client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
              {
                "role": "user",
                "content": prompt
              }
            ],
            temperature=1,
            max_completion_tokens=1024,
            top_p=1,
            stream=True,
            stop=None,
            response_format={"type": "json_object"}
        )

        full_response = ""
        for chunk in completion:
            content = chunk.choices[0].delta.content or ""
            full_response += content
            
        return full_response

    def generate_strategy(self, blue_team, red_team):
        key = (blue_team.get('name'), red_team.get('name'))
        if key in self.cache:
            return self.cache[key]
            
        if not self.client:
            return {}

        print(f"🧠 Generating Strategy for {blue_team.get('name')} vs {red_team.get('name')} using Groq...")
        
        prompt = f"""
        You are a League of Legends Draft Coach. 
        Matchup: {blue_team.get('name')} (Blue) vs {red_team.get('name')} (Red).
        
        Blue Players: {', '.join([p.get('name', '') for p in blue_team.get('players', [])])}
        Red Players: {', '.join([p.get('name', '') for p in red_team.get('players', [])])}
        
        Generate a strategic pool of champions for each draft phase.
        Return ONLY valid JSON. (CHAMPIONS ONLY)
        Format:
        {{
            "blue_ban_phase_1": ["List of 5 prioritized bans"],
            "red_ban_phase_1": ["List of 5 prioritized bans"],
            "blue_pick_phase_1": ["List of 10 core picks for blue"],
            "red_pick_phase_1": ["List of 10 core picks for red"],
            "blue_ban_phase_2": ["List of 5 secondary bans"],
            "red_ban_phase_2": ["List of 5 secondary bans"],
            "blue_pick_phase_2": ["List of 5 rounding out picks"],
            "red_pick_phase_2": ["List of 5 rounding out picks"]
        }}
        """
        
        try:
            text = self._generate_content(prompt)
            # Cleanup markdown if present
            text = text.replace("```json", "").replace("```", "").strip()
            strategy = json.loads(text)
            self.cache[key] = strategy
            print("\n✅ Strategy Generated from Groq:")
            print(json.dumps(strategy, indent=2))
            print("-----------------------------------\n")
            return strategy
        except Exception as e:
            print(f"❌ Strategy Generation Failed: {e}")
            return {}

    def generate_reasoning(self, draft_state_text, recommendations):
        if not self.client:
            return {}

        print("🧠 Generating Detailed Reasoning using Groq...")
        
        rec_list = ", ".join([r['championName'] for r in recommendations])
        
        prompt = f"""
        You are a League of Legends Draft Analyst.
        
        Current Draft State:
        {draft_state_text}
        
        The Tactical AI Model has recommended these top 5 champions: {rec_list}
        
        Provide a detailed analysis for these recommendations.
        Return ONLY valid JSON.
        Format:
        {{
            "analyses": {{
                "ChampionName1": "Brief bullet-point reasoning why this fits.",
                "ChampionName2": "..."
            }},
            "counter_factuals": "What happens if they don't pick one of these? Short risk analysis.",
            "opponent_prediction": ["Champ1", "Champ2"],  // Predicted next 2 moves for opponent
            "comp_trajectory": "Brief description of how the team comp is shaping up (e.g. 'Heavy Dive', 'Seige')"
        }}
        """
        
        try:
            text = self._generate_content(prompt)
            text = text.replace("```json", "").replace("```", "").strip()
            analysis = json.loads(text)
            print("✅ Reasoning Generated.")
            return analysis
        except Exception as e:
            print(f"❌ Reasoning Generation Failed: {e}")
            return {}

strategy_manager = StrategyManager()

# Initialize immediately
init_resources()

# Helper function to run model inference on a given history
def run_model_inference(context_dict, history_list, seen_ids, strategy_boost_map=None):
    """
    Runs model inference and returns logits for the target step.
    strategy_boost_map: Dict of {champ_id: boost_value} to apply.
    """
    encoded = tokenizer.encode(context_dict, history_list, max_len=21)
    
    ctx_data = encoded['context']
    seq_data = encoded['sequence']
    
    ctx_inputs = {
        'context_blue': torch.tensor([ctx_data['blue_team_id']]).to(DEVICE),
        'context_red': torch.tensor([ctx_data['red_team_id']]).to(DEVICE),
        'context_game': torch.tensor([ctx_data['game_num']]).to(DEVICE)
    }
    
    class_ids_list = seq_data['class_ids_list']
    num_classes = 6
    class_tensor = torch.zeros((1, len(class_ids_list), num_classes), dtype=torch.float).to(DEVICE)
    for t, c_ids in enumerate(class_ids_list):
        for cid in c_ids:
            if 0 <= cid < num_classes:
                class_tensor[0, t, cid] = 1.0
                
    seq_inputs = {
        'champ_ids': torch.tensor([seq_data['champion_ids']]).to(DEVICE),
        'action_ids': torch.tensor([seq_data['action_ids']]).to(DEVICE),
        'team_ids': torch.tensor([seq_data['team_ids']]).to(DEVICE),
        'pos_ids': torch.tensor([seq_data['position_ids']]).to(DEVICE),
        'class_vecs': class_tensor
    }
    
    with torch.no_grad():
        logits = model(ctx_inputs, seq_inputs)
        target_idx = len(history_list)
        target_logit = logits[0, target_idx, :]
        
        # Mask Taken Champs
        for c in seen_ids:
            target_logit[c] = float('-inf')
            
        # Apply Strategic Boost if provided
        if strategy_boost_map:
            for cid, val in strategy_boost_map.items():
                if cid not in seen_ids:
                    target_logit[cid] += val
                    
        return target_logit

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        current_idx = data.get('currentStepIndex', 0)
        
        blue_team_data = data.get('blueTeam', {})
        red_team_data = data.get('redTeam', {})
        
        # 0. Get/Generate Strategy
        strategy = strategy_manager.generate_strategy(blue_team_data, red_team_data)
        
        # 1. Reconstruct History
        history_list = []
        seen_champs = set()
        
        b_bans = data.get('blueBans', [])
        r_bans = data.get('redBans', [])
        b_picks = data.get('bluePicks', [])
        r_picks = data.get('redPicks', [])

        def get_champ_name(arr, idx):
            if idx < len(arr) and arr[idx]:
                return arr[idx].get('name')
            return None

        steps_processed = 0
        current_step_info = None
        
        # Helper to build text description of draft for reasoning
        draft_text = f"Blue Team: {blue_team_data.get('name')}\nRed Team: {red_team_data.get('name')}\n"
        
        for i in range(len(DRAFT_ORDER)):
            side, action = DRAFT_ORDER[i]
            
            if i == current_idx:
                current_step_info = (side, action)
            
            if i >= current_idx:
                continue

            occurrence = 0
            for j in range(i):
                s, a = DRAFT_ORDER[j]
                if s == side and a == action:
                    occurrence += 1
            
            c_name = None
            if side == 'blue':
                if action == 'BAN': c_name = get_champ_name(b_bans, occurrence)
                else: c_name = get_champ_name(b_picks, occurrence)
            else:
                if action == 'BAN': c_name = get_champ_name(r_bans, occurrence)
                else: c_name = get_champ_name(r_picks, occurrence)
            
            if c_name:
                draft_text += f"{i+1}. {side.upper()} {action}: {c_name}\n"
                
                c_classes = champ_class_map.get(c_name.upper(), [])
                history_list.append({
                    "step": steps_processed + 1,
                    "champion": c_name,
                    "action": action,
                    "acting_team": side.upper(),
                    "champion_classes": c_classes
                })
                
                cid = tokenizer.vocab.get(c_name)
                if not cid:
                    for k,v in tokenizer.vocab.items():
                        if k.upper() == c_name.upper():
                            cid = v
                            break
                if cid: 
                    seen_champs.add(cid)
                
                steps_processed += 1
        
        if current_step_info:
            draft_text += f"CURRENT STEP: {current_step_info[0].upper()} {current_step_info[1]}\n"

        # 2. Prepare Context for Inference
        context_dict = {
            "blue_team": blue_team_data.get('name', 'BLUE'),
            "red_team": red_team_data.get('name', 'RED'),
            "game_in_series": 1
        }

        # 3. Strategy Boost Map
        strategy_boost_map = {}
        if current_step_info:
            side, action = current_step_info
            phase_key = strategy_manager.get_phase_key(side, action, current_idx)
            
            print(f"📍 Step {current_idx+1}: {side.upper()} {action} -> Phase Key: '{phase_key}'")
            strategic_pool = strategy.get(phase_key, [])

            pool_ids = set()
            for c_name in strategic_pool:
                cid = tokenizer.vocab.get(c_name)
                if not cid:
                        for k,v in tokenizer.vocab.items():
                            if k.upper() == c_name.upper():
                                cid = v
                                break
                if cid:
                    pool_ids.add(cid)
            
            for cid in pool_ids:
                strategy_boost_map[cid] = 5.0

        # ========== PRIMARY INFERENCE ==========
        target_logit = run_model_inference(context_dict, history_list, seen_champs, strategy_boost_map)
        
        # Top 5 Recommendations
        probs, indices = torch.topk(torch.softmax(target_logit, dim=-1), 5)
            
        temp_recommendations = []
        for p, idx in zip(probs, indices):
            name = tokenizer.id_to_token.get(idx.item(), "UNK")
            temp_recommendations.append({
                "championName": name,
                "championId": idx.item(), # Store ID for simulation
                "role": "RECOMMENDED", 
                "winRate": round(p.item() * 100, 1),
            })
            
        # --- 4. APPLY REASONING LAYER (Layer 3) ---
        reasoning_data = strategy_manager.generate_reasoning(draft_text, temp_recommendations)
        
        recommendations = []
        champion_analyses = reasoning_data.get('analyses', {})
        
        # ========== LOOKAHEAD SIMULATION (Transformer) ==========
        # For each top recommendation, simulate picking it and see what opponent does.
        
        # We need the next step info to simulate the opponent
        next_step_idx = current_idx + 1
        next_step_info = None
        if next_step_idx < len(DRAFT_ORDER):
            next_step_info = DRAFT_ORDER[next_step_idx] # (side, action)
            
        for rec in temp_recommendations:
            name = rec['championName']
            rec_id = rec['championId']
            
            # Reasoning Text
            reasoning_text = champion_analyses.get(name, "Strong pick based on draft trends.")
            is_strategic = False
            rec_reasons = [reasoning_text]
            if current_step_info:
                side, action = current_step_info
                phase_key = strategy_manager.get_phase_key(side, action, current_idx)
                if name in strategy.get(phase_key, []):
                     is_strategic = True
                     # rec_reasons.insert(0, "Strategic Plan Priority")

            # LOOKAHEAD: Simulate this pick
            opponent_predictions = []
            
            if next_step_info: # Only simulate if there is a next step
                sim_history = history_list.copy()
                
                # Append the hypothetical pick
                c_classes = champ_class_map.get(name.upper(), [])
                sim_history.append({
                    "step": steps_processed + 1,
                    "champion": name,
                    "action": current_step_info[1],
                    "acting_team": current_step_info[0].upper(),
                    "champion_classes": c_classes
                })
                
                sim_seen = seen_champs.copy()
                sim_seen.add(rec_id)
                
                # Boost Map for Opponent? 
                # Ideally we check the strategy for next step too.
                sim_boost_map = {}
                op_side, op_action = next_step_info
                # We can reuse strategy manager for next phase key
                op_phase_key = strategy_manager.get_phase_key(op_side, op_action, next_step_idx)
                op_pool = strategy.get(op_phase_key, [])
                
                for op_c_name in op_pool:
                     op_cid = tokenizer.vocab.get(op_c_name)
                     if not op_cid:
                         for k,v in tokenizer.vocab.items():
                            if k.upper() == op_c_name.upper():
                                op_cid = v
                                break
                     if op_cid:
                        sim_boost_map[op_cid] = 5.0
                
                # Run Inference for Opponent Step
                op_logit = run_model_inference(context_dict, sim_history, sim_seen, sim_boost_map)
                
                # Get Top 5 Opponent Moves
                op_probs, op_indices = torch.topk(torch.softmax(op_logit, dim=-1), 5)
                
                for op_idx in op_indices:
                    op_name = tokenizer.id_to_token.get(op_idx.item(), "UNK")
                    opponent_predictions.append(op_name)

            recommendations.append({
                "championName": name,
                "role": "RECOMMENDED",
                "winRate": rec['winRate'],
                "reasoning": rec_reasons,
                "opponentResponses": opponent_predictions # NEW FIELD
            })
            
        return jsonify({ 
            "recommendations": recommendations,
            "analysis": {
                "counterFactuals": reasoning_data.get("counter_factuals", ""),
                "opponentPrediction": reasoning_data.get("opponent_prediction", []),
                "compTrajectory": reasoning_data.get("comp_trajectory", "")
            }
        })
        
    except Exception as e:
        print(f"Error in predict: {e}")
        return jsonify({ "error": str(e) }), 500

@app.route('/strategy', methods=['POST'])
def strategy():
    try:
        data = request.json
        blue_team = data.get('blueTeam', {})
        red_team = data.get('redTeam', {})
        
        if not blue_team or not red_team:
             return jsonify({ "error": "Missing team data" }), 400

        strategy_data = strategy_manager.generate_strategy(blue_team, red_team)
        return jsonify(strategy_data)
    except Exception as e:
        print(f"Error in strategy: {e}")
        return jsonify({ "error": str(e) }), 500

if __name__ == '__main__':
    # Run on 5001 to match frontend
    app.run(host='0.0.0.0', port=5001, debug=False)
