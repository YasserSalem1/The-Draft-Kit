from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import os
import sys
import json
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(__file__))
sys.path.append(os.path.join(os.path.dirname(__file__), 'TrainedTransformer'))

from tokenizer import DraftTokenizer
from model import DraftTransformer

app = Flask(__name__)
CORS(app)

# -------------------------------------------------------------------
# Configuration & Globals
# -------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Load env vars from .env file in the same directory
# Load env vars from .env file in the same directory
load_dotenv(os.path.join(BASE_DIR, '.env'))

if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
    print("✅ API Key loaded successfully.")
else:
    print("⚠️ WARNING: API Key (GEMINI_API_KEY or GOOGLE_API_KEY) not found in .env file.")

MODEL_PATH = os.path.join(BASE_DIR, "TrainedTransformer/model_epoch_20.pt")
VOCAB_PATH = os.path.join(BASE_DIR, "TrainedTransformer/vocab.json")
CLASS_DB_PATH = os.path.join(BASE_DIR, "TrainedTransformer/champion_classes.json")

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

import google.generativeai as genai
import requests
from bs4 import BeautifulSoup


# ... (Previous globals remain) ...

# Initialize Gemini
# User provided snippet uses GOOGLE_API_KEY. Let's support both.
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    print("⚠️ Gemini/Google API Key missing. Strategic Layer will be disabled.")

class StrategyManager:
    def __init__(self):
        self.candidate_cache = {}  # Key: (blue_team_name, red_team_name, phase_name) -> candidates list
        # Initialize Google GenAI Client
        # Initialize Google GenAI
        if API_KEY:
            genai.configure(api_key=API_KEY)
            self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
        else:
            self.model = None


    def get_patch_report(self):
        """
        Scrapes gol.gg for the latest pro play stats.
        Top 10 by Presence (Picks + Bans).
        """
        print("🌍 Fetching Patch Report from Gol.gg...")
        
        try:
            # Stats for Season 15 (S15) - Spring Split
            # Using a generic URL that usually redirects or shows the latest split stats
            # Or hardcoding for S15 Spring which is likely the context of the hackathon/current time
            url = "https://gol.gg/champion/list/season-S15/split-Spring/tournament-ALL/"
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code != 200:
                raise Exception(f"Gol.gg returned status {resp.status_code}")
                
            soup = BeautifulSoup(resp.content, 'html.parser')
            
            # Find the main stats table
            table = soup.find('table', class_='table_list')
            if not table:
                raise Exception("Could not find stats table on gol.gg")
                
            rows = table.find_all('tr')[1:] # Skip header
            
            champs_data = []
            
            # Parse rows
            for row in rows:
                cols = row.find_all('td')
                if len(cols) < 15: continue # Ensure we have enough columns for CSD@15
                
                name_link = cols[0].find('a')
                if not name_link: continue
                
                name = name_link.text.strip()
                
                # Column Indices based on user screenshot:
                # 0: Champion, 1: Picks, 2: Bans, 3: Prio, 4: Wins, 5: Losses, 6: Winrate
                # ... 14: CSD@15 (2nd to last)
                
                prio_val = cols[3].text.strip()
                winrate_val = cols[6].text.strip()
                csd15_val = cols[14].text.strip()
                
                # Convert Prio to float for sorting
                try:
                    prio_num = float(prio_val.replace('%', ''))
                except:
                    prio_num = 0
                    
                champs_data.append({
                    "name": name,
                    "role": "FLEX",
                    "win_rate": winrate_val,
                    "prio_score": prio_val,
                    "csd_15": csd15_val,
                    "tier": "S+" if prio_num > 80 else ("S" if prio_num > 50 else "A"),
                    "sort_val": prio_num
                })
                
            # Sort by Prio Score descending
            champs_data.sort(key=lambda x: x['sort_val'], reverse=True)
            
            top_10 = champs_data[:10]
            
            return {
                "patch_version": "S15 Major Leagues",
                "tournaments": "Global (LCK, LPL, LEC, LCS)",
                "games_analyzed": "Latest Split Data",
                "champs": top_10
            }
            
        except Exception as e:
            print(f"❌ Patch Report Scraping Failed: {e}")
            return {
                "error_log": str(e),
                "patch_version": "N/A",
                "tournaments": "N/A",
                "games_analyzed": "N/A", 
                "champs": []
            }

    def get_phase_info(self, step_index):
        """Returns (phase_name, action_type) for a given step."""
        if step_index < 6:
            return "Ban Phase 1", "BAN"
        elif step_index < 12:
            return "Pick Phase 1", "PICK"
        elif step_index < 16:
            return "Ban Phase 2", "BAN"
        else:
            return "Pick Phase 2", "PICK"

    def format_team_report(self, team_data):
        """
        Parses team data and returns a formatted string with reports, stats, and playstyles.
        Handles both simple fields and complex ScoutingReportData structures.
        """
        name = team_data.get('name', 'Unknown Team')
        report_str = f"Team: {name}\n"
        
        # 1. High-Level Identity
        if 'games_count' in team_data: report_str += f"- Games Analyzed: {team_data['games_count']}\n"
        
        # Note: Qualitative fields (strategies, overview, etc.) removed per user request.

        # 2. Tendencies (Keeping as "Player Insights")
        if 'tendencies' in team_data and isinstance(team_data['tendencies'], list):
            t_list = []
            for t in team_data['tendencies']:
                if isinstance(t, dict):
                    t_list.append(f"{t.get('role', '?')}:{t.get('tendency', '')}")
                elif isinstance(t, str):
                    t_list.append(t)
            report_str += f"- Tendencies: {'; '.join(t_list)}\n"
            
        # 3. Draft Habits (Detailed Stats from IntelligenceReport)
        
        # Most Banned
        if 'most_banned_champions' in team_data:
            mb = team_data['most_banned_champions']
            if isinstance(mb, dict):
                # By Them
                if 'by_blue_side' in mb and mb['by_blue_side']:
                    top = [f"{x['champion']}({x['count']})" for x in mb['by_blue_side'][:8]]
                    report_str += f"- Most Banned By Them (Blue): {', '.join(top)}\n"
                if 'by_red_side' in mb and mb['by_red_side']:
                    top = [f"{x['champion']}({x['count']})" for x in mb['by_red_side'][:8]]
                    report_str += f"- Most Banned By Them (Red): {', '.join(top)}\n"
                
                # Against Them
                if 'against_blue_side' in mb and mb['against_blue_side']:
                    top = [f"{x['champion']}({x['count']})" for x in mb['against_blue_side'][:8]]
                    report_str += f"- Target Bans Against Them (Blue): {', '.join(top)}\n"
                if 'against_red_side' in mb and mb['against_red_side']:
                    top = [f"{x['champion']}({x['count']})" for x in mb['against_red_side'][:8]]
                    report_str += f"- Target Bans Against Them (Red): {', '.join(top)}\n"

        # Popular Bans / Famous Picks (Legacy/Simple)
        if 'popularBans' in team_data:
            bans = [b.get('name') for b in team_data['popularBans'] if isinstance(b, dict)]
            report_str += f"- Frequent Bans: {', '.join(bans[:5])}\n"
        if 'famousPicks' in team_data:
            picks = [p.get('name') for p in team_data['famousPicks'] if isinstance(p, dict)]
            report_str += f"- Comfort Picks: {', '.join(picks[:5])}\n"
            
        # Priority Picks by Slot
        if 'most_picked_champions_by_slot' in team_data:
            slots = team_data['most_picked_champions_by_slot']
            if 'blue1' in slots and slots['blue1']:
                 top_b1 = [f"{p[0]}({p[1]})" for p in slots['blue1'][:8]]
                 report_str += f"- Priority B1 Picks: {', '.join(top_b1)}\n"
            if 'red1_red2' in slots and slots['red1_red2']:
                 top_r1r2 = [f"{p[0]}({p[1]})" for p in slots['red1_red2'][:8]]
                 report_str += f"- Priority R1/R2 Picks: {', '.join(top_r1r2)}\n"
            if 'blue2_blue3' in slots and slots['blue2_blue3']:
                 top_b2b3 = [f"{p[0]}({p[1]})" for p in slots['blue2_blue3'][:8]]
                 report_str += f"- Priority B2/B3 Picks: {', '.join(top_b2b3)}\n"
            if 'red3' in slots and slots['red3']:
                 top_r3 = [f"{p[0]}({p[1]})" for p in slots['red3'][:8]]
                 report_str += f"- Priority R3 Picks: {', '.join(top_r3)}\n"

        # Blind vs Counter
        if 'blind_pick_champions_frequency' in team_data:
            blind = [f"{p[0]}({p[1]})" for p in team_data['blind_pick_champions_frequency'][:8]]
            report_str += f"- Preferred Blind Picks: {', '.join(blind)}\n"
        if 'counter_pick_champions_frequency' in team_data:
            counter = [f"{p[0]}({p[1]})" for p in team_data['counter_pick_champions_frequency'][:8]]
            report_str += f"- Preferred Counter Picks: {', '.join(counter)}\n"

        # 4. Player Statistics (Detailed)
        if 'champion_pools_by_player' in team_data:
            report_str += "\n--- Player Pools & Stats ---\n"
            pools = team_data['champion_pools_by_player']
            for name, stats_list in pools.items():
                try:
                    top_champs = []
                    for s in stats_list[:8]:
                        c_name = s.get('Champion', 'Unknown')
                        gms = s.get('Games', 0)
                        wr_str = s.get('WinRate', '0')
                        top_champs.append(f"{c_name}({gms}g {wr_str}%wr)")
                    report_str += f"Player {name}: {', '.join(top_champs)}\n"
                except Exception:
                   pass

        elif 'player_stats_grouped' in team_data:
            report_str += "\n--- Player Pools & Stats ---\n"
            pst = team_data['player_stats_grouped']
            for name, stats_list in pst.items():
                try:
                    sorted_stats = sorted(stats_list, key=lambda x: x.get('played', 0), reverse=True)
                    top_champs = []
                    for s in sorted_stats[:8]:
                        c_name = s.get('name', 'Unknown')
                        gms = s.get('played', 0)
                        wins = s.get('wins', 0)
                        wr = int((wins / gms * 100)) if gms > 0 else 0
                        top_champs.append(f"{c_name}({gms}g {wr}%wr)")
                    
                    report_str += f"Player {name}: {', '.join(top_champs)}\n"
                except Exception:
                    pass
                    
        elif 'players' in team_data:
             p_names = [p.get('nickname', 'Unknown') for p in team_data['players']]
             report_str += f"- Active Roster: {', '.join(p_names)}\n"

        return report_str

    def get_phase_info(self, step_index):
        """Returns (phase_name, action_type) for a given step."""
        if step_index < 6:
            return "Ban Phase 1", "BAN"
        elif step_index < 12:
            return "Pick Phase 1", "PICK"
        elif step_index < 16:
            return "Ban Phase 2", "BAN"
        else:
            return "Pick Phase 2", "PICK"

    def generate_phase_candidates(self, blue_team, red_team, draft_state, step_index):
        """
        Generates lists of viable champions for both teams for the current phase.
        Called once per phase (cached).
        """
        phase_name, action_type = self.get_phase_info(step_index)
        
        # Cache Key: Teams + Phase (so we call once per phase, not per step)
        key = (blue_team.get('name'), red_team.get('name'), phase_name)
        
        if key in self.candidate_cache:
            print(f"✅ Using cached candidates for {phase_name}")
            return self.candidate_cache[key]
        
        # Determine current actor
        current_side = 'BLUE'  # Default
        if step_index < len(DRAFT_ORDER):
            side_str = DRAFT_ORDER[step_index][0]
            current_side = side_str.upper()
        
        if not API_KEY:
            print("⚠️ No Gemini API Key, returning empty candidate list.")
            return []

        print(f"🧠 Generating Candidate Pool for {phase_name} (Active: {current_side})...")
        
        # Extract context
        b_picks = draft_state.get('blue_picks', [])
        r_picks = draft_state.get('red_picks', [])
        b_bans = draft_state.get('blue_bans', [])
        r_bans = draft_state.get('red_bans', [])
        
        # Format Reports
        blue_report = self.format_team_report(blue_team)
        red_report = self.format_team_report(red_team)
        
        prompt = f"""
        Matchup: {blue_team.get('name', 'Blue')} vs {red_team.get('name', 'Red')}
        Current Phase: {phase_name}
        Active Turn: {current_side} Team is {action_type}ing.

        Draft So Far:
        Blue Bans: {b_bans}
        Red Bans: {r_bans}
        Blue Picks: {b_picks}
        Red Picks: {r_picks}
        
        Team Reports & Analysis:
        === BLUE TEAM ===
        {blue_report}
        
        === RED TEAM ===
        {red_report}
        
        TASK:
        Generate a JSON object with strictly TWO keys:
        1. "blue_candidates": A list of champion names (strings) with confidence scores.
        2. "red_candidates": A list of champion names (strings) with confidence scores.
        
        Format each candidate as: {{"name": "ChampionName", "confidence": 8}}
        
        Example Output:
        {{
            "blue_candidates": [{{"name": "Ahri", "confidence": 9}}, {{"name": "Vi", "confidence": 7}}, ...],
            "red_candidates": [{{"name": "Azir", "confidence": 10}}, {{"name": "Lee Sin", "confidence": 8}}, ...]
        }}
        
        The lists must include champions that are:
        1. LEGALLY AVAILABLE (Not picked, Not banned).
        2. Strategically viable for that specific team based on their detailed report, playstyle, and PLAYER POOLS.
        
        Be EXHAUSTIVE. Look at the specific player stats and comfort picks in the report.
        Provide EXACTLY 30 champions per team.
        Confidence should be 0-10 where 10 is highest priority.
        """
        
        # LOGGING PROMPT
        prompt_log_path = os.path.join(BASE_DIR, "logs/prompt_log.txt")
        print(f"DEBUG: Attempting to write prompt log to: {prompt_log_path}")
        try:
            with open(prompt_log_path, "w") as f:
                f.write(prompt)
            print("DEBUG: Prompt log written successfully.")
        except Exception as e:
            print(f"DEBUG: Failed to write prompt log: {e}")
            
        try:
            if not self.model:
                 raise ValueError("GenAI Model not initialized")
                 
            response = self.model.generate_content(prompt)
            text = response.text.replace("```json", "").replace("```", "").strip()
            
            # LOGGING RESPONSE
            response_log_path = os.path.join(BASE_DIR, "logs/response_log.json")
            print(f"DEBUG: Attempting to write response log to: {response_log_path}")
            with open(response_log_path, "w") as f:
                f.write(text)

            # Parse JSON
            data = json.loads(text)
            
            # Extract candidates
            blue_cands = data.get('blue_candidates', [])
            red_cands = data.get('red_candidates', [])
            
            # Return as dict with separate team lists
            result = {
                'blue': blue_cands,
                'red': red_cands
            }
            
            # Cache the result for this phase
            self.candidate_cache[key] = result
            
            print(f"✅ Generated {len(blue_cands)} blue candidates, {len(red_cands)} red candidates")
            return result
            
        except Exception as e:
            print(f"❌ Candidate Generation Failed: {e}")
            return []



strategy_manager = StrategyManager()

# ... (init_resources remains) ...
# Initialize immediately
init_resources()

# Helper function to run model inference on a given history
def run_model_inference(context_dict, history_list, seen_ids, strategy_boost_map=None, transformer_weight=1.0):
    """
    Runs model inference and returns logits for the target step.
    strategy_boost_map: Dict of {champ_id: boost_value} to apply.
    transformer_weight: Scale factor for raw logits (Cross-Fade logic).
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
        target_logit = logits[0, target_idx, :].clone()
        
        # Apply Transformer Weight (Cross-Fade)
        # Scale raw logits before adding boost
        target_logit = target_logit * transformer_weight
        
        # Mask Taken Champs
        for c in seen_ids:
            target_logit[c] = float('-inf')
            
        raw_logit = target_logit.clone()
        boosted_logit = target_logit.clone()
        
        # Apply Strategic Boost if provided
        if strategy_boost_map:
            for cid, val in strategy_boost_map.items():
                if cid not in seen_ids:
                    boosted_logit[cid] += val
                    
        return raw_logit, boosted_logit

# -------------------------------------------------------------------
# Stateful Logic for AI Takeover
# -------------------------------------------------------------------

draft_state = {}

ROLE_RECOMMENDATIONS = {
    'TOP': ['Garen', 'Darius', 'Aatrox', 'Camille', 'Jax', 'Fiora', 'Ornn', "K'Sante", 'Renekton', 'Gnar'],
    'JUNGLE': ['Lee Sin', 'Vi', 'Jarvan IV', 'Elise', 'Viego', "Rek'Sai", 'Xin Zhao', 'Hecarim', 'Graves', 'Nidalee'],
    'MID': ['Ahri', 'Syndra', 'Orianna', 'Azir', 'Viktor', 'LeBlanc', 'Akali', 'Zed', 'Sylas', 'Corki'],
    'ADC': ['Jinx', "Kai'Sa", 'Aphelios', 'Xayah', 'Ezreal', 'Jhin', 'Varus', 'Ashe', 'Sivir', 'Caitlyn'],
    'SUPPORT': ['Thresh', 'Nautilus', 'Leona', 'Lulu', 'Karma', 'Renata Glasc', 'Braum', 'Rakan', 'Alistar', 'Milio', 'Yunara']
}

def get_predictions_logic(data):
    try:
        # data arg passed directly
        current_idx = data.get('currentStepIndex', 0)
        
        blue_team_data = data.get('blueTeam', {})
        red_team_data = data.get('redTeam', {})
        
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

        # 3. Generate Phase Candidates (per-step, not cached)
        draft_state_dict = {
            "blue_bans": [get_champ_name(b_bans, i) for i in range(len(b_bans)) if get_champ_name(b_bans, i)],
            "red_bans": [get_champ_name(r_bans, i) for i in range(len(r_bans)) if get_champ_name(r_bans, i)],
            "blue_picks": [get_champ_name(b_picks, i) for i in range(len(b_picks)) if get_champ_name(b_picks, i)],
            "red_picks": [get_champ_name(r_picks, i) for i in range(len(r_picks)) if get_champ_name(r_picks, i)]
        }
        
        candidate_result = strategy_manager.generate_phase_candidates(blue_team_data, red_team_data, draft_state_dict, current_idx)
        
        # Determine which team's candidates to use based on whose turn it is
        acting_side = 'blue'  # default
        if current_step_info:
            acting_side = current_step_info[0]  # 'blue' or 'red'
        
        # Determine candidates for both sides
        if isinstance(candidate_result, dict):
            candidates = candidate_result.get(acting_side, [])
            opp_candidates = candidate_result.get('red' if acting_side == 'blue' else 'blue', [])
        else:
            candidates = candidate_result if isinstance(candidate_result, list) else []
            opp_candidates = []
        
        print(f"🎯 Using {len(candidates)} candidates for {acting_side.upper()} and {len(opp_candidates)} for opponent")
        
        # Build Boost Map with Decay
        strategy_boost_map = {}
        
        # Dynamic Decay: Trust LLM less as draft progresses
        decay_factor = max(0.1, 1.0 - (current_idx / 10.0))
        
        # Transformer Weight: Trust Transformer MORE as draft progresses (Inverse of Decay)
        # Start at 0.40, grow to 1.0
        transformer_weight = min(1.0, 0.40 + (current_idx / 20.0))
        
        print(f"📉 Logic Cross-Fade -> LLM Boost: {decay_factor:.2f} | Transformer Weight: {transformer_weight:.2f}")

        for item in candidates:
            c_name = None
            conf = 5.0
            
            if isinstance(item, str):
                c_name = item
            elif isinstance(item, dict):
                c_name = item.get('name')
                conf = float(item.get('confidence', 5.0))
            
            if not c_name: continue

            cid = tokenizer.vocab.get(c_name)
            if not cid:
                for k,v in tokenizer.vocab.items():
                    if k.upper() == c_name.upper():
                        cid = v
                        break
            if cid:
                # Final Boost = Confidence * Decay
                final_boost = conf * decay_factor
                strategy_boost_map[cid] = final_boost

        # ========== PRIMARY INFERENCE ==========
        raw_logit, target_logit = run_model_inference(context_dict, history_list, seen_champs, strategy_boost_map, transformer_weight)
        
        # Log Top 20 for Debugging
        print(f"\n--- Top 20 Champion Probabilities (Step {current_idx + 1}) ---")
        print(f"{'Rank':<5} {'Champion':<15} {'Prob %':<10} {'Raw':<10} {'Nudge':<10} {'Total':<10}")
        
        all_probs = torch.softmax(target_logit, dim=-1)
        top20_probs, top20_indices = torch.topk(all_probs, 20)
        
        for i, (p, idx) in enumerate(zip(top20_probs, top20_indices)):
            c_id = idx.item()
            c_name = tokenizer.id_to_token.get(c_id, "UNK")
            raw_score = raw_logit[c_id].item() if raw_logit[c_id] != float('-inf') else -999
            nudge = strategy_boost_map.get(c_id, 0.0)
            total_score = target_logit[c_id].item()
            
            print(f"{i+1:<5} {c_name:<15} {p.item()*100:>7.2f}% {raw_score:>10.2f} {nudge:>10.2f} {total_score:>10.2f}")
        print("------------------------------------------------------------\n")
        
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
        # We need the next step info to pass to reasoning generation
        next_step_idx = current_idx + 1
        next_step_info = None
        if next_step_idx < len(DRAFT_ORDER):
            next_step_info = DRAFT_ORDER[next_step_idx]  # (side, action)
        
        # reasoning_data = strategy_manager.generate_reasoning(draft_text, temp_recommendations, next_step_info)
        reasoning_data = {}
        
        recommendations = []
        champion_analyses = reasoning_data.get('analyses', {})
            
        # Create a lookup map for Gemini confidence scores
        gemini_confidence_map = {}
        for item in candidates:
            if isinstance(item, dict):
                c_name = item.get('name')
                conf = item.get('confidence', 0)
                if c_name:
                    gemini_confidence_map[c_name] = conf
            
        for rec in temp_recommendations:
            name = rec['championName']
            rec_id = rec['championId']
            
            # Reasoning Text - now supports bullet point lists
            reasoning_data_raw = champion_analyses.get(name, ["• Strong pick based on draft trends."])
            # Handle both list (new bullet format) and string (legacy format)
            if isinstance(reasoning_data_raw, list):
                rec_reasons = reasoning_data_raw
            else:
                rec_reasons = [reasoning_data_raw]
            
            # === TRANSFORMER LOOKAHEAD SIMULATION ===
            # Simulate picking this champion and see what opponent would do
            formatted_opponent_responses = []
            
            if next_step_info:  # Only simulate if there's a next step
                opponent_side, opponent_action = next_step_info
                
                # Create a simulated history with this pick added
                simulated_history = history_list.copy()
                c_classes = champ_class_map.get(name.upper(), [])
                simulated_history.append({
                    "step": len(history_list) + 1,
                    "champion": name,
                    "action": current_step_info[1],  # BAN or PICK
                    "acting_team": current_step_info[0].upper(),
                    "champion_classes": c_classes
                })
                
                # Update seen champions to include this pick
                simulated_seen = seen_champs.copy()
                simulated_seen.add(rec_id)
                
                # Prepare Boost Map for Opponent (Lookahead)
                opp_boost_map = {}
                for item in opp_candidates:
                    c_name = item.get('name') if isinstance(item, dict) else item
                    conf = float(item.get('confidence', 5.0)) if isinstance(item, dict) else 5.0
                    if not c_name: continue
                    
                    cid = tokenizer.vocab.get(c_name)
                    if not cid:
                        for k,v in tokenizer.vocab.items():
                            if k.upper() == c_name.upper():
                                cid = v
                                break
                    if cid:
                        opp_boost_map[cid] = conf * decay_factor

                # Run model inference for opponent's next move
                try:
                    # Lookahead Simulation: Use slightly higher weight as it's a future step?
                    # Or same weight. Let's use same transformer_weight concept.
                    # Actually, lookahead is 1 step ahead.
                    next_idx = current_idx + 1
                    lookahead_weight = min(1.0, 0.40 + (next_idx / 20.0))
                    
                    _, opponent_logit = run_model_inference(
                        context_dict,
                        simulated_history,
                        simulated_seen,
                        opp_boost_map,  # Use Intelligence Boost for lookahead
                        lookahead_weight
                    )
                    
                    # Get top 5 predictions for opponent
                    opp_probs, opp_indices = torch.topk(torch.softmax(opponent_logit, dim=-1), 5)
                    
                    for opp_idx in opp_indices:
                        opp_name = tokenizer.id_to_token.get(opp_idx.item(), "UNK")
                        if opp_name != "UNK":
                            formatted_opponent_responses.append({
                                "championName": opp_name
                            })
                except Exception as e:
                    print(f"⚠️ Lookahead failed for {name}: {e}")
            
            # Get Gemini confidence if available  
            gemini_conf = gemini_confidence_map.get(name, 0)

            recommendations.append({
                "championName": name,
                "role": "RECOMMENDED",
                "winRate": rec['winRate'],  # Transformer probability (0-100%)
                "geminiConfidence": gemini_conf,  # Gemini strategic confidence (0-10)
                "reasoning": rec_reasons,
                "opponentResponses": formatted_opponent_responses
            })
            
        return { 
            "recommendations": recommendations,
            "analysis": {
                "counterFactuals": reasoning_data.get("counter_factuals", ""),
                "opponentPrediction": reasoning_data.get("opponent_prediction", []),
                "compTrajectory": reasoning_data.get("comp_trajectory", "")
            }
        }
        
    except Exception as e:
        print(f"Error in predictions logic: {e}")
        return { "error": str(e) }

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        result = get_predictions_logic(data)
        if "error" in result:
             return jsonify(result), 500
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/draft/load', methods=['POST'])
def load_draft():
    global draft_state
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Helper to convert frontend list of {name: "..."} to list of objects or nulls
        def parse_list(l):
            return [{"name": x} if x else None for x in l]

        draft_state = {
            "currentStepIndex": data.get('current_step', 0),
            "blueTeam": data.get('blue_team', {"name": "Blue"}),
            "redTeam": data.get('red_team', {"name": "Red"}),
            "blueBans": parse_list(data.get('blue_team', {}).get('bans', [])),
            "redBans": parse_list(data.get('red_team', {}).get('bans', [])),
            "bluePicks": parse_list(data.get('blue_team', {}).get('picks', [])),
            "redPicks": parse_list(data.get('red_team', {}).get('picks', []))
        }
        
        # Clear cache to force fresh analysis for the new draft state
        strategy_manager.candidate_cache = {}
        
        print(f"✅ Draft State Loaded: Step {draft_state['currentStepIndex']}")
        return jsonify({"success": True, "message": "Draft loaded successfully"})
            
    except Exception as e:
        print(f"❌ Load Draft Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    try:
        if not draft_state:
             return jsonify({"recommendations": [], "by_role": ROLE_RECOMMENDATIONS})

        # Run prediction on stored state
        result = get_predictions_logic(draft_state)
        
        if "error" in result:
            return jsonify(result), 500

        return jsonify({
            "recommendations": result['recommendations'],
            "by_role": ROLE_RECOMMENDATIONS
        })
    except Exception as e:
        print(f"❌ Recommendation Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/patch-report', methods=['GET'])
def patch_report():
    try:
        report = strategy_manager.get_patch_report()
        return jsonify(report)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/strategy', methods=['POST'])
def strategy():
    return jsonify({})

if __name__ == '__main__':
    # Run on 5001 to match frontend
    app.run(host='0.0.0.0', port=5001, debug=False)
