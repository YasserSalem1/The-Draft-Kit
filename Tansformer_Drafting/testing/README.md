# 🧪 Model Testing Guide

This folder contains scripts to test and evaluate the Draft Prediction Model.

## 🚀 1. Interactive Draft (Best for Demo)
**Script**: `interactive_test.py`

This tool lets you simulate a live draft against the AI.

### How to Run
```bash
python3 testing/interactive_test.py
```

### Process
1.  **Input Teams**: Enter the names of Blue and Red teams (e.g., "T1", "Gen.G").
2.  **Model Suggests**: The AI analyzes the empty board and suggests the top 5 valid Champions for Step 1.
3.  **You Input**: You type the champion that was *actually* picked or banned.
4.  **Loop**: The AI adds your input to its "History", re-analyzes the new state, and suggests the next move.
5.  **Result**: At the end (20 steps), it shows a summary of the full draft.

---

## 🔍 2. Manual Scenario Test
**Script**: `manual_test.py`

Use this to test a specific "What if?" scenario or replay a known partial game without typing everything manually.

### How to Inputs
Open `testing/manual_test.py` and edit the `GAME_INPUT` dictionary at the top:
```python
GAME_INPUT = {
    "teams": {"BLUE": "G2", "RED": "Fnatic"},
    "current_draft": [
        {"step": 1, "champion": "Ashe", "action": "BAN", "acting_team": "BLUE"},
        {"step": 2, "champion": "Vi", "action": "BAN", "acting_team": "RED"},
    ]
}
```
When you run it, the model "reads" this history and shows you what it would have predicted at *every single step* along the way.

---

## 🎲 3. Random Match Check
**Script**: `random_sample_test.py`

Picks a random real game from the test dataset (held out from training) and shows you a full walkthrough.

### How to Run
```bash
python3 testing/random_sample_test.py
```
It prints the input context for every step, the model's prediction, and whether it matched the pro team's decision.

---

## 🛡️ How logic works: "Bans, Picks & Fearless"

You asked: *"How do we set bans and picks to a probability so the model only predicts from the available set?"*

We use a technique called **Constraint Masking**.

### The Concept
The model's output is a list of "scores" (logits) for every champion in the game (170+ champions).
- High Score = Highly Recommended.
- Low Score = Not Recommended.

To ensure the model NEVER recommends an unavailable champion, we manually force their scores to **Negative Infinity** before calculating probabilities.

### Step-by-Step Logic

1.  **Track "Seen" Champions**:
    We maintain a list (or Set) of every champion ID that has appeared in the draft so far.
    ```python
    seen_champs = {Ashe, Vi, Lee Sin, ...}
    ```

2.  **Fearless Draft (Cross-Game Constraints)**:
    If this were Game 3 of a Fearless series, we would simply **pre-fill** this list with all picks from Game 1 and Game 2 *before* the draft starts.
    ```python
    # Fearless Mode Start
    seen_champs = {Pick_G1_1, Pick_G1_2, ..., Pick_G2_10} 
    ```

3.  **The Masking Operation**:
    Before showing you predictions, we look at the raw scores from the model:
    
    | Champion | Raw Score | Status |
    | :--- | :--- | :--- |
    | **Ahri** | 5.2 | Available |
    | **Ashe** | 8.9 | **Already Picked** |
    | **Zed** | 2.1 | Available |

    We apply the mask:
    ```python
    for champ in seen_champs:
        raw_score[champ] = -Infinity
    ```

    | Champion | New Score | Probability |
    | :--- | :--- | :--- |
    | **Ahri** | 5.2 | **High %** |
    | **Ashe** | **-∞** | **0%** (Impossible) |
    | **Zed** | 2.1 | Low % |

**Result**: The mathematical probability of picking "Ashe" becomes exactly 0%. The model effectively "ignores" her and redistributes 100% of the probability among the remaining valid champions.
