from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import sys
import json
import base64
import tempfile
import re
import requests
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# DraftPredictor API URL (transformer model)
DRAFT_PREDICTOR_URL = "http://localhost:5001"

# -------------------------------------------------------------------
# Configuration & Globals
# -------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if GROQ_API_KEY:
    print("✅ Groq API Key loaded successfully.")
else:
    print("⚠️ WARNING: GROQ_API_KEY not found in .env file.")

from groq import Groq

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# -------------------------------------------------------------------
# Draft State (Full 5v5 draft with bans)
# -------------------------------------------------------------------

DRAFT_ORDER = [
    # Ban Phase 1
    ('blue', 'ban'), ('red', 'ban'), ('blue', 'ban'), ('red', 'ban'), ('blue', 'ban'), ('red', 'ban'),
    # Pick Phase 1
    ('blue', 'pick'), ('red', 'pick'), ('red', 'pick'), ('blue', 'pick'), ('blue', 'pick'), ('red', 'pick'),
    # Ban Phase 2
    ('red', 'ban'), ('blue', 'ban'), ('red', 'ban'), ('blue', 'ban'),
    # Pick Phase 2
    ('red', 'pick'), ('blue', 'pick'), ('blue', 'pick'), ('red', 'pick')
]

ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

# Common champion recommendations by role
ROLE_RECOMMENDATIONS = {
    'TOP': ['Garen', 'Darius', 'Aatrox', 'Camille', 'Jax', 'Fiora', 'Ornn', 'K\'Sante', 'Renekton', 'Gnar'],
    'JUNGLE': ['Lee Sin', 'Vi', 'Jarvan IV', 'Elise', 'Viego', 'Rek\'Sai', 'Xin Zhao', 'Hecarim', 'Graves', 'Nidalee'],
    'MID': ['Ahri', 'Syndra', 'Orianna', 'Azir', 'Viktor', 'LeBlanc', 'Akali', 'Zed', 'Sylas', 'Corki'],
    'ADC': ['Jinx', 'Kai\'Sa', 'Aphelios', 'Xayah', 'Ezreal', 'Jhin', 'Varus', 'Ashe', 'Sivir', 'Caitlyn'],
    'SUPPORT': ['Thresh', 'Nautilus', 'Leona', 'Lulu', 'Karma', 'Renata Glasc', 'Braum', 'Rakan', 'Alistar', 'Milio']
}

def get_initial_draft_state():
    return {
        "blue_team": {
            "name": "",
            "bans": [None, None, None, None, None],
            "picks": [None, None, None, None, None],
        },
        "red_team": {
            "name": "",
            "bans": [None, None, None, None, None],
            "picks": [None, None, None, None, None],
        },
        "current_step": 0,
        "phase": "setup",  # setup, comp_select, ban_1, pick_1, ban_2, pick_2, complete
        "team_comp": "",  # Dive, Poke, Teamfight, Split, Pick
        "thinking": [],
        "conversation": []
    }

draft_state = get_initial_draft_state()

def get_current_phase_name(step):
    if step < 6:
        return "Ban Phase 1"
    elif step < 12:
        return "Pick Phase 1"
    elif step < 16:
        return "Ban Phase 2"
    elif step < 20:
        return "Pick Phase 2"
    else:
        return "Draft Complete"

def get_current_action(step):
    if step >= len(DRAFT_ORDER):
        return None, None, None
    side, action = DRAFT_ORDER[step]
    return side, action, get_current_phase_name(step)

def get_role_for_pick_step(step):
    """Determine which role is typically picked at each step"""
    pick_order = [
        # Pick Phase 1
        (6, 'FLEX'), (7, 'FLEX'), (8, 'FLEX'), (9, 'FLEX'), (10, 'FLEX'), (11, 'FLEX'),
        # Pick Phase 2
        (16, 'FLEX'), (17, 'FLEX'), (18, 'FLEX'), (19, 'FLEX')
    ]
    for s, role in pick_order:
        if s == step:
            return role
    return 'FLEX'

# -------------------------------------------------------------------
# System Prompt for AI Agent (Draft Guide with Brainstorming)
# -------------------------------------------------------------------

SYSTEM_PROMPT = """You are **Coach**, a League of Legends draft strategist. Keep answers SHORT (1-2 sentences).

**Current Teams:** Blue: {blue_team} | Red: {red_team}
**Team Comp:** {team_comp}
**Draft State:** {draft_state}
**Phase:** {phase}
**Action:** {current_action}

**CONVERSATION FLOW:**

1. **NO TEAMS YET:** Say "Hey Coach! What teams are we drafting for today?"

2. **GOT TEAMS, NO COMP:** Say "Got it! Tell me what comp you're thinking - Dive, Poke, Teamfight, Split, or Pick? I'll help you build it."

3. **DRAFTING:** Guide the draft. Ask for their choice. The AI model will provide champion recommendations separately.

4. **LOCK IN (when coach says "lock in X", "confirm X", "let's go X"):** Use [ACTION:BAN:CHAMPION:TEAM] or [ACTION:PICK:CHAMPION:ROLE:TEAM]

**KEEP IT SHORT. Be conversational. Don't list champions - the AI model shows them separately.**"""

# -------------------------------------------------------------------
# Action Parser
# -------------------------------------------------------------------

def parse_actions(response_text):
    """Parse action commands from AI response"""
    actions = []
    
    ban_pattern = r'\[ACTION:BAN:([A-Za-z\'\s]+):(\w+)\]'
    pick_pattern = r'\[ACTION:PICK:([A-Za-z\'\s]+):(\w+):(\w+)\]'
    recommend_pattern = r'\[RECOMMEND:([^\]]+)\]'
    
    for match in re.finditer(ban_pattern, response_text):
        champion = match.group(1).strip()
        team = match.group(2).lower()
        actions.append({"type": "ban", "champion": champion, "team": team})
    
    for match in re.finditer(pick_pattern, response_text):
        champion = match.group(1).strip()
        role = match.group(2).upper()
        team = match.group(3).lower()
        actions.append({"type": "pick", "champion": champion, "role": role, "team": team})
    
    # Parse recommendations
    recommendations = []
    for match in re.finditer(recommend_pattern, response_text):
        champs = [c.strip() for c in match.group(1).split(',')]
        recommendations.extend(champs)
    
    return actions, recommendations

def parse_team_names(text):
    """Try to extract team names from user response"""
    text_lower = text.lower()
    
    # Common patterns: "T1 vs Gen.G", "blue is T1, red is Gen.G", etc.
    vs_pattern = r'(\w+(?:\s+\w+)?)\s+(?:vs\.?|versus|against)\s+(\w+(?:\s+\w+)?)'
    match = re.search(vs_pattern, text, re.IGNORECASE)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    
    # "Blue is X, red is Y" pattern
    blue_pattern = r'blue\s+(?:is|team)?\s*(\w+(?:\s+\w+)?)'
    red_pattern = r'red\s+(?:is|team)?\s*(\w+(?:\s+\w+)?)'
    
    blue_match = re.search(blue_pattern, text, re.IGNORECASE)
    red_match = re.search(red_pattern, text, re.IGNORECASE)
    
    blue_name = blue_match.group(1).strip().title() if blue_match else None
    red_name = red_match.group(1).strip().title() if red_match else None
    
    return blue_name, red_name

def apply_actions(actions):
    """Apply parsed actions to draft state"""
    global draft_state
    
    for action in actions:
        team_key = f"{action['team']}_team"
        
        if action['type'] == 'ban':
            bans = draft_state[team_key]['bans']
            for i, ban in enumerate(bans):
                if ban is None:
                    bans[i] = action['champion']
                    break
            draft_state['current_step'] += 1
            
        elif action['type'] == 'pick':
            role_index = {
                'TOP': 0, 'JUNGLE': 1, 'JG': 1, 'JGL': 1,
                'MID': 2, 'MIDDLE': 2,
                'ADC': 3, 'BOT': 3, 'MARKSMAN': 3,
                'SUPPORT': 4, 'SUP': 4, 'SUPP': 4
            }.get(action['role'].upper(), -1)
            
            if role_index >= 0:
                draft_state[team_key]['picks'][role_index] = action['champion']
            draft_state['current_step'] += 1
    
    # Update phase
    step = draft_state['current_step']
    if draft_state['phase'] == 'setup':
        if draft_state['blue_team']['name'] and draft_state['red_team']['name']:
            draft_state['phase'] = 'ban_1'
    elif step >= 20:
        draft_state['phase'] = 'complete'
    elif step >= 16:
        draft_state['phase'] = 'pick_2'
    elif step >= 12:
        draft_state['phase'] = 'ban_2'
    elif step >= 6:
        draft_state['phase'] = 'pick_1'
    elif step >= 0:
        draft_state['phase'] = 'ban_1'
    
    return draft_state

def clean_response(text):
    """Remove action/recommend tags from response for TTS"""
    text = re.sub(r'\[ACTION:[^\]]+\]', '', text)
    text = re.sub(r'\[RECOMMEND:[^\]]+\]', '', text)
    return text.strip()

def get_recommendations_for_step():
    """Get champion recommendations from the transformer model"""
    global draft_state
    
    # Build the request payload for DraftPredictor
    current_step = draft_state['current_step']
    
    # Convert draft state to DraftPredictor format
    blue_bans = [{"name": b} if b else None for b in draft_state['blue_team']['bans']]
    red_bans = [{"name": b} if b else None for b in draft_state['red_team']['bans']]
    blue_picks = [{"name": p} if p else None for p in draft_state['blue_team']['picks']]
    red_picks = [{"name": p} if p else None for p in draft_state['red_team']['picks']]
    
    # Filter out None entries
    blue_bans = [b for b in blue_bans if b]
    red_bans = [b for b in red_bans if b]
    blue_picks = [p for p in blue_picks if p]
    red_picks = [p for p in red_picks if p]
    
    payload = {
        "currentStepIndex": current_step,
        "blueTeam": {"name": draft_state['blue_team']['name'] or "BLUE"},
        "redTeam": {"name": draft_state['red_team']['name'] or "RED"},
        "blueBans": blue_bans,
        "redBans": red_bans,
        "bluePicks": blue_picks,
        "redPicks": red_picks
    }
    
    try:
        response = requests.post(
            f"{DRAFT_PREDICTOR_URL}/predict",
            json=payload,
            timeout=10
        )
        
        if response.ok:
            data = response.json()
            recommendations = data.get('recommendations', [])
            # Extract just the champion names
            champ_names = [rec.get('championName', '') for rec in recommendations[:5]]
            print(f"🤖 Transformer recommendations: {champ_names}")
            return champ_names
    except Exception as e:
        print(f"⚠️ Failed to get transformer predictions: {e}")
    
    # Fallback: return empty
    return []

# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "groq_connected": client is not None})


@app.route('/stt', methods=['POST'])
def speech_to_text():
    if not client:
        return jsonify({"error": "Groq client not initialized"}), 500
    
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name
        
        try:
            with open(tmp_path, 'rb') as f:
                transcription = client.audio.transcriptions.create(
                    model="whisper-large-v3",
                    file=f,
                    response_format="text"
                )
            
            print(f"📝 Transcription: {transcription}")
            return jsonify({"text": transcription})
        finally:
            os.unlink(tmp_path)
            
    except Exception as e:
        print(f"❌ STT Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/tts', methods=['POST'])
def text_to_speech():
    if not client:
        return jsonify({"audio": None}), 200
    
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({"audio": None}), 200
        
        try:
            response = client.audio.speech.create(
                model="canopylabs/orpheus-v1-english",
                voice="austin",
                input=text,
                response_format="wav"
            )
            
            audio_bytes = response.read()
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            return jsonify({"audio": audio_base64, "format": "wav"})
        except Exception as tts_error:
            print(f"⚠️ TTS not available: {tts_error}")
            return jsonify({"audio": None}), 200
            
    except Exception as e:
        print(f"❌ TTS Error: {e}")
        return jsonify({"audio": None}), 200


@app.route('/chat', methods=['POST'])
def chat():
    global draft_state
    
    if not client:
        return jsonify({"error": "Groq client not initialized"}), 500
    
    try:
        data = request.json
        user_message = data.get('message', '')
        is_initial = data.get('initial', False)
        
        # Check if we're in setup phase and user is providing team names
        if draft_state['phase'] == 'setup' and user_message:
            blue_name, red_name = parse_team_names(user_message)
            if blue_name:
                draft_state['blue_team']['name'] = blue_name
            if red_name:
                draft_state['red_team']['name'] = red_name
            
            # If we got both names, move to comp selection
            if draft_state['blue_team']['name'] and draft_state['red_team']['name']:
                draft_state['phase'] = 'comp_select'
        
        # Check for comp selection
        if draft_state['phase'] == 'comp_select' and user_message:
            comp_keywords = ['dive', 'poke', 'teamfight', 'split', 'pick', 'engage', 'protect']
            msg_lower = user_message.lower()
            for comp in comp_keywords:
                if comp in msg_lower:
                    draft_state['team_comp'] = comp.capitalize()
                    draft_state['phase'] = 'ban_1'
                    break
        
        # Get current action info
        side, action_type, phase_name = get_current_action(draft_state['current_step'])
        
        if draft_state['phase'] == 'setup':
            current_action = "Waiting for team names"
        elif side and action_type:
            current_action = f"{side.upper()} team needs to {action_type.upper()}. Phase: {phase_name}"
        else:
            current_action = "Draft is complete!"
        
        # Build context
        draft_context = json.dumps({
            "bans": {
                "blue": draft_state['blue_team']['bans'],
                "red": draft_state['red_team']['bans']
            },
            "picks": {
                "blue": draft_state['blue_team']['picks'],
                "red": draft_state['red_team']['picks']
            },
            "step": draft_state['current_step']
        }, indent=2)
        
        system_prompt = SYSTEM_PROMPT.format(
            blue_team=draft_state['blue_team']['name'] or "Not Set",
            red_team=draft_state['red_team']['name'] or "Not Set",
            team_comp=draft_state.get('team_comp', '') or "Not Set",
            draft_state=draft_context,
            phase=draft_state['phase'],
            current_action=current_action
        )
        
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in draft_state.get('conversation', [])[-8:]:
            messages.append(msg)
        
        if is_initial:
            messages.append({"role": "user", "content": "Let's start!"})
        elif user_message:
            messages.append({"role": "user", "content": user_message})
            draft_state['conversation'].append({"role": "user", "content": user_message})
        
        # Generate response
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=messages,
            temperature=0.7,
            max_completion_tokens=100
        )
        
        ai_response = completion.choices[0].message.content
        
        # Parse actions and recommendations
        actions, _ = parse_actions(ai_response)  # Ignore LLM recommendations
        
        if actions:
            apply_actions(actions)
            print(f"✅ Applied actions: {actions}")
        
        # Always get recommendations from transformer model (not LLM)
        if draft_state['phase'] not in ['setup', 'comp_select']:
            draft_state['thinking'] = get_recommendations_for_step()
        else:
            draft_state['thinking'] = []
        
        clean_text = clean_response(ai_response)
        draft_state['conversation'].append({"role": "assistant", "content": clean_text})
        
        print(f"🤖 AI Response: {clean_text}")
        print(f"💡 Transformer Recommendations: {draft_state['thinking']}")
        
        return jsonify({
            "response": clean_text,
            "actions": actions,
            "recommendations": draft_state['thinking'],
            "draft_state": {
                "blue_team": draft_state['blue_team'],
                "red_team": draft_state['red_team'],
                "current_step": draft_state['current_step'],
                "phase": draft_state['phase']
            }
        })
            
    except Exception as e:
        print(f"❌ Chat Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/draft/state', methods=['GET'])
def get_draft_state():
    return jsonify({
        "blue_team": draft_state['blue_team'],
        "red_team": draft_state['red_team'],
        "current_step": draft_state['current_step'],
        "phase": draft_state['phase'],
        "recommendations": draft_state.get('thinking', [])
    })


@app.route('/draft/reset', methods=['POST'])
def reset_draft():
    global draft_state
    draft_state = get_initial_draft_state()
    return jsonify({"success": True, "draft_state": draft_state})


@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    """Get champion recommendations for current step"""
    return jsonify({
        "recommendations": get_recommendations_for_step(),
        "by_role": ROLE_RECOMMENDATIONS
    })


# -------------------------------------------------------------------
# Main
# -------------------------------------------------------------------

if __name__ == '__main__':
    print("🎮 Draft Coach Server Starting...")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5002, debug=False)
