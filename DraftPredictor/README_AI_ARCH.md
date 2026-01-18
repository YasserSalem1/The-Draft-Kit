# 🧠 DraftPredictor AI Architecture

The **DraftPredictor** is a hybrid **Neuro-Symbolic AI system** designed to solve the complex game theory problem of League of Legends drafting. It combines the strategic reasoning of Large Language Models (LLMs) with the tactical pattern recognition of a custom trained Transformer.

## 🏗️ Core Architecture: The 3-Layer System

The inference engine operates in three distinct layers, executed sequentially for every prediction.

### Layer 1: Strategic Candidate Generation (The "Coach")
**Engine:** `Google Gemini 2.5 Flash Lite` (via `generativeai` SDK)

*   **Input:** 
    *   Current Draft State (Bans/Picks)
    *   **Detailed Intelligence Reports**: JSON reports containing team tendencies, player pools, comfort picks, and historical ban patterns for both Blue and Red teams.
*   **Role:** 
    *   Acts as a "Strategic Filter".
    *   Analyzes the *context* of the match (e.g., "Blue team needs engage", "Red team player X is a one-trick").
    *   Generates a pool of **30 Viable Candidates** per team.
    *   Assigns a **Confidence Score (0-10)** to each candidate.
*   **Output:** Two lists (`blue_candidates`, `red_candidates`) of strategically valid champions.

### Layer 2: Tactical Evaluation (The "Analyst")
**Engine:** `Custom DraftTransformer` (PyTorch)

*   **Architecture:** 
    *   Encoder-only Transformer (6 Layers, 8 Attention Heads, 256 Embedding Dim).
    *   Trained on 10,000+ Pro Matches.
*   **Mechanism (Logic Cross-Fade):**
    *   **Transformer Cross-Fade:** The raw Transformer output starts at **40% weight** in the early draft (high uncertainty) and scales to **100% weight** by the late game (tactical certainty).
    *   **LLM Delay:** Conversely, the LLM's strategic influence starts high (100% boost) and decays to 20% as the composition takes shape.
    *   **Result:** Early game is driven by Strategy (Layer 1), Late game is driven by Tactics (Layer 2).
    *   Runs the Transformer inference to calculate the raw probability of *every* champion being picked next.
*   **Output:** A Top-K list of recommended champions with a combined "Win Rate" / Probability score.

### Layer 3: Lookahead Simulation (The "Grandmaster")
**Engine:** `Recursive Transformer Inference`

*   **Mechanism:**
    1.  Takes the Top 5 recommendations from Layer 2.
    2.  **Simulates** picking champion A.
    3.  Updates the internal draft history state.
    4.  **Re-runs Layer 2** (Transformer) from the perspective of the *opponent*.
*   **Output:** 
    *   "Opponent Responses": A prediction of the top 5 champions the enemy is likely to pick *if* you select this recommendation.
    *   Enables "Nash Equilibrium" style drafting (picking not just what is good, but what denies the opponent).

---

## 📂 File Structure

The module is self-contained to ensure portability.

```text
DraftPredictor/
├── server.py                # Main Flask API & Inference Logic
├── TrainedTransformer/      # Model Artifacts
│   ├── model.py             # PyTorch Model Definition
│   ├── tokenizer.py         # Custom Tokenizer
│   ├── inference.py         # CLI Inference Tool
│   ├── model_epoch_20.pt    # Trained Weights
│   ├── vocab.json           # Champion Vocabulary
│   └── champion_classes.json # Archetype Data
└── logs/                    # Audit logs for prompts/responses
```

## 🔌 API Endpoints

The server runs on port **5001** and exposes endpoints for both stateless prediction and stateful AI control.

### 1. Stateless Prediction
*   `POST /predict`
*   **Payload:** Full draft object (`blueTeam`, `redTeam`, `bluePicks`, etc.)
*   **Returns:** Detailed recommendations with lookahead analysis.
*   **Use Case:** Getting a single recommendation based on a snapshot (e.g., "Ask AI" button).

### 2. AI Takeover (Stateful)
*   `POST /draft/load`: Loads a draft state into the server's memory.
*   `GET /recommendations`: Runs the full 3-layer inference on the currently loaded state.
*   **Use Case:** "AI Auto-Pilot" mode where the AI drives the draft step-by-step.

---

## 🔧 Key Logic Flow (`server.py`)

1.  **Request Received**: `get_predictions_logic` is called with draft data.
2.  **History Reconstruction**: The JSON draft data is converted into a sequence of tokens (`[Team, Action, Champ, Class]`) for the Transformer.
3.  **Strategy Call (Layer 1)**: `StrategyManager` calls Gemini to get the cache-able candidate pool.
4.  **Boost Map Creation**: Candidates are mapped to IDs and assigned boost values.
5.  **Transformer Pass (Layer 2)**: `run_model_inference` executes the PyTorch model with the boost map.
6.  **Simulation Loop (Layer 3)**: For each top result, the system temporarily appends it to history and runs `run_model_inference` again for the opponent.
7.  **Reasoning**: (Optional) Groq/Llama generates text explanations for the final picks.
8.  **Response**: JSON object returned to frontend.
