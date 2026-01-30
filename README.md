# The Draft Kit — The Ultimate Pro-Play Drafting Weapon

**The Draft Kit** is an advanced AI-powered drafting tool that streamlines the competitive League of Legends drafting process. It was born from the realization that professional drafting still relies on inefficient, manual processes. We built The Draft Kit to bring AI into the game, automating GRID data analysis to reveal deep strategic insights and provide a real-time edge that human observation alone cannot match.

![AI Architecture](AI%20Architecture.png)

### What it does
- **Real-time AI Drafting Predictor:** Analyzes the current draft state and provides optimal champion recommendations by combining a deep-learning Transformer model with real-time scouting data.
- **Dynamic Scouting Reports:** Automatically generates team and player reports from GRID data, detailing historical ban tendencies, side-specific priority picks (B1, R1/R2), and current tournament champion pools.
- **Hybrid Recommendation Engine:** A unique architecture where an LLM nudges a custom-trained Transformer to account for roster changes and "comfort picks" that pure statistical models often miss.
- **Draft Library:** A centralized hub that organizes all draft simulations in one place, allowing coaches to review past series along with their respective team and player scouting reports.
- **Voice-Activated Strategic Coach:** A conversational interface using Groq's Llama models and Whisper STT, allowing coaches to ask for advice or "Lock In" picks hands-free.
- **Fearless Bans & Series Tracking:** Built-in support for modern competitive formats, tracking restricted champions across BO3/BO5 series.

---

### Key Features
- **Intelligent Series Setup:** Flexible `BO1/BO3/BO5` configurations with curated team and roster selection.
- **Pro-Grade Drafting Engine:** Authentic snake-order workflow with real-time turn highlighting and champion availability tracking.
- **AI-Driven Recommendations:** Predictive insights powered by a custom Transformer model, enhanced by real-time LLM nudging.
- **Automated Scouting Reports:** Deep-dive analysis of GRID data, revealing ban tendencies, priority picks, and champion pools.
- **Hands-Free AI Coach:** Voice-activated strategic assistant using Whisper STT and Llama-3 for real-time draft advice.
- **Fearless Bans Support:** Built-in tracking for restricted champions across multi-game series to support modern formats.
- **Strategic Draft Library:** Centralized hub for organizing, searching, and reviewing past simulations with persistent storage.
- **Tournament-Grade UI:** High-performance interface built with Next.js 16 and Tailwind CSS v4, featuring fluid Framer Motion animations.

---

### How we built it
- **AI Core - The Hybrid Predictor:**
    - **Transformer Model:** A custom PyTorch Transformer trained on over 10,000 professional matches to understand high-level drafting logic and synergies.
    - **LLM Nudging (Gemini):** Google's Gemini models process real-time "Scouting Reports" to identify priority champions based on GRID data.
    - **Dynamic Weighting:** LLM has higher weight in early stages (player comfort), while the Transformer's weight increases as the draft progresses (strategic balance).
- **Data Pipeline:** Processes GRID data to create structured Team Reports (side-specific bans/picks) and Player Reports (tournament history, blind vs. counter-pick rates).
- **Frontend:** Built with **Next.js 16**, **TypeScript**, and **Tailwind CSS (v4)**.
- **Backend:** A Flask-based microservices architecture handles real-time inference for both the Transformer and the LLM-powered Coach.

---

### Development Setup
**Note:** A `.env` file with all API keys is required. For the submission, it is included in the attached zip file on Devpost.

#### 1. Backend Setup (Draft Predictor)
The backend runs a Flask server with PyTorch and LLM integration (Gemini + Groq).
1.  **Environment Variables**: Create `.env` in `DraftPredictor/`:
    ```env
    GOOGLE_API_KEY=your_gemini_api_key
    GROQ_API_KEY=your_groq_api_key
    ```
2.  **Install & Run**:
    ```bash
    cd DraftPredictor
    python -m venv venv
    # Windows: venv\Scripts\activate | Mac: source venv/bin/activate
    pip install -r requirements.txt
    python server.py
    ```
    Starts on `http://localhost:5001`.

#### 2. AI Coach Setup (TheDraftingAgent)
The AI Coach provides voice/text interaction and strategic advice.
1.  **Environment Variables**: Create `.env` in `TheDraftingAgent/`:
    ```env
    GROQ_API_KEY=your_groq_api_key
    ```
2.  **Install & Run**:
    ```bash
    cd TheDraftingAgent
    python -m venv venv
    # Windows: venv\Scripts\activate | Mac: source venv/bin/activate
    pip install -r requirements.txt
    python server.py
    ```
    Starts on `http://localhost:5002`.

#### 3. Frontend Setup
1.  **Install & Run**:
    ```bash
    # From the project root
    npm install
    npm run dev
    ```
    Open http://localhost:3000 in your browser.

---

### Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS (v4), Framer Motion, Lucide React.
- **Backend:** Python (Flask), REST APIs.
- **AI/ML:** PyTorch (Custom Transformer), Google Gemini (LLM Nudging), Groq (Llama-3 & Llama-4 models), Whisper-large-v3 (STT).
- **Data & Storage:** GRID Data (via custom JSON reports), LocalStorage (Persistence).

---

### Challenges we ran into
- **The "Roster Shift" Problem:** Professional drafts aren't just about the "best" champions; they are about what specific players can play. Static models fail when teams change rosters.
- **Solving the Human Element:** Developed the hybrid "Nudging" system. By feeding player-specific scouting reports into the LLM, we shift predictions towards the current roster's strengths.
- **Real-time Synchronization:** Optimizing the inference pipeline to ensure the AI could process complex GRID-derived reports in milliseconds during a live draft.

### Accomplishments that we're proud of
- **The Hybrid AI Architecture:** Successfully balancing a statistical Transformer with a context-aware LLM.
- **Voice-to-Draft Integration:** A seamless experience where a coach can interact with the AI naturally using Whisper STT.
- **GRID Data Utilization:** Turning raw match history into actionable "Scouting Reports."

### What's next
- **Scrim-to-Stage Integration:** Private portal for teams to upload internal scrim data.
- **Multi-Game Series Adaptability:** Predicting opponent adaptations in Game 2 or 3 of a series.
- **Expanded Game Support:** Supporting Dota 2 and Valorant.
- **Continuous Learning:** Online learning for new champion releases and meta shifts.

---

### License
This project is licensed under the MIT License - see the LICENSE file for details.
