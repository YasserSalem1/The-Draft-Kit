# Pre-Training Verification Checklist

## 1. Data Integrity ✅
- [x] **Source File**: `Data/raw/all_games.json` exists and is accessible.
- [x] **Cleaning**: 
    - Deduplicated (Removed ~6.8k duplicates).
    - Filtered Short Games (Removed ~150).
    - Final Count: 3,393 High-Quality Matches.
- [x] **Vocabulary**: `Data/metadata/vocab.json`.
    - Size: 285 tokens.
    - Coverage: 100% of data tokens are in vocab.
    - Includes: Champions, Teams, Special Tokens (PAD, START, etc.).

## 2. Tokenizer Logic ✅
- [x] **Context Encoding**: Correctly maps BlueID, RedID, GameNum.
- [x] **Sequence Encoding**: 
    - Correctly infers `PICK`/`BAN` from `played_by`/`banned_by`.
    - Correctly infers `BLUE`/`RED` side from Team Context.
    - Correctly maps Position steps (1-20+).

## 3. Dataset Loading ✅
- [x] **Splitting**: Deterministic split by GameID (80/10/10). No overlap.
- [x] **Tensor Shapes**: 
    - Context: `[Batch, 3]` (Blue, Red, Game) -> `[Batch, 1, Emb]`
    - Sequence: `[Batch, 21, 4]` (Champ, Act, Team, Pos) -> `[Batch, 21, Emb]`
    - **Total Input**: `[Batch, 22, Emb]` (1 Context + 21 Steps)

## 4. Model Architecture ✅
- [x] **Embeddings**: Separate embeddings for all features.
- [x] **Fusion**: Projecting Context (144->256) and Sequence (192->256) to common `d_model`.
- [x] **Masking**: Causal Mask applied (Future tokens hidden).
- [x] **Output**: Linear Head over Vocab Size (285).

## 5. Training Configuration ⚠️ (Action Required)
- [ ] **Device**: Update to support Apple Silicon (`mps`) for faster training on Mac.
- [ ] **Hyperparameters**:
    - Batch Size: 32 (Safe for CPU/MPS).
    - LR: 1e-4 (Standard Transformer start).
    - Epochs: 20.
