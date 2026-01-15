import torch
import torch.nn as nn
import math

class FeatureEmbedding(nn.Module):
    def __init__(self, vocab_size, team_vocab_size, d_model=256):
        super().__init__()
        # 192 total dim from concat -> Project to d_model (256)
        
        # Dimensions from spec
        self.d_champ = 128
        self.d_action = 16
        self.d_team = 16
        self.d_pos = 32
        self.d_class = 32 # New Dimension for Class Info
        self.num_classes = 6 # Fixed 6 classes
        
        # Total Input to Projection
        total_input_dim = self.d_champ + self.d_action + self.d_team + self.d_pos + self.d_class
        
        # Embedding Lookups
        self.emb_champ = nn.Embedding(vocab_size, self.d_champ)
        self.emb_action = nn.Embedding(2, self.d_action)     # 0:BAN, 1:PICK
        self.emb_team = nn.Embedding(2, self.d_team)         # 0:BLUE, 1:RED
        self.emb_pos = nn.Embedding(22, self.d_pos)          # Steps 1-20 + Pad
        
        # Class Projection: Multi-Hot (6) -> 32
        self.class_proj = nn.Linear(self.num_classes, self.d_class)
        
        # Context Token Embeddings (Token 0)
        self.d_ctx_team = 64
        self.d_ctx_game = 16
        self.emb_ctx_team = nn.Embedding(team_vocab_size, self.d_ctx_team)
        self.emb_ctx_game = nn.Embedding(6, self.d_ctx_game) 
        
        self.ctx_proj = nn.Linear(self.d_ctx_team * 2 + self.d_ctx_game, d_model) 
        self.seq_proj = nn.Linear(total_input_dim, d_model) 
        
    def forward(self, ctx_data, seq_data):
        """
        ctx_data: {blue: [B], red: [B], game: [B]}
        seq_data: {champ: [B, T], action: [B, T], team: [B, T], pos: [B, T], class_vecs: [B, T, 6]}
        """
        # 1. Context Token (Step 0)
        b_team = self.emb_ctx_team(ctx_data['context_blue'])
        r_team = self.emb_ctx_team(ctx_data['context_red'])
        g_num = self.emb_ctx_game(ctx_data['context_game'])
        
        # Concat [B, 144]
        ctx_cat = torch.cat([b_team, r_team, g_num], dim=-1)
        # Project [B, d_model] -> [B, 1, d_model]
        ctx_emb = self.ctx_proj(ctx_cat).unsqueeze(1)
        
        # 2. Sequence Tokens (Steps 1..N)
        # Embed each feature
        e_champ = self.emb_champ(seq_data['champ_ids'])
        e_act = self.emb_action(seq_data['action_ids'])
        e_team = self.emb_team(seq_data['team_ids'])
        e_pos = self.emb_pos(seq_data['pos_ids'])
        
        # Class Embedding
        # seq_data['class_vecs'] is [B, T, 6] Float
        e_class = self.class_proj(seq_data['class_vecs']) # -> [B, T, 32]
        
        # Concat [B, T, TotalDim]
        seq_cat = torch.cat([e_champ, e_act, e_team, e_pos, e_class], dim=-1)
        # Project [B, T, d_model]
        seq_emb = self.seq_proj(seq_cat)
        
        # 3. Combine [B, 1+T, d_model]
        # We prepend Context
        full_emb = torch.cat([ctx_emb, seq_emb], dim=1)
        
        return full_emb

class DraftTransformer(nn.Module):
    def __init__(self, vocab_size, team_vocab_size=100, d_model=256, nhead=8, num_layers=6, dropout=0.1):
        super().__init__()
        
        self.embedding = FeatureEmbedding(vocab_size, team_vocab_size, d_model)
        self.pos_encoder = PositionalEncoding(d_model, dropout) # Optional if we rely on self.emb_pos
        # Note: We HAVE explicit position embedding in FeatureEmbedding.
        # So standard sinusoidal PE might be redundant, but commonly added anyway. 
        # Let's keep it based on "Transformer Encoder" spec which usually implies PE.
        
        encoder_layer = nn.TransformerEncoderLayer(d_model, nhead, dim_feedforward=1024, dropout=dropout, batch_first=True)
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers)
        
        self.output_head = nn.Linear(d_model, vocab_size)
        
    def forward(self, ctx_data, seq_data, src_key_padding_mask=None):
        # Embed
        src = self.embedding(ctx_data, seq_data) # [B, T+1, D]
        
        # Add PE (Optional, but safe)
        src = self.pos_encoder(src)
        
        # Causal Mask (Autoregressive)
        # We want to predict Step N using Steps 0..N.
        # So position I can attend to <= I.
        sz = src.size(1)
        mask = self.generate_square_subsequent_mask(sz).to(src.device)
        
        output = self.transformer_encoder(src, mask=mask, src_key_padding_mask=src_key_padding_mask)
        
        # Logits [B, T+1, Vocab]
        logits = self.output_head(output)
        
        return logits

    def generate_square_subsequent_mask(self, sz: int) -> torch.Tensor:
        return torch.triu(torch.full((sz, sz), float('-inf')), diagonal=1)

# Re-keeping the Helper for completeness (referenced in __init__)
class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, dropout: float = 0.1, max_len: int = 5000):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)
        position = torch.arange(max_len).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2) * (-math.log(10000.0) / d_model))
        pe = torch.zeros(max_len, 1, d_model)
        pe[:, 0, 0::2] = torch.sin(position * div_term)
        pe[:, 0, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.pe[:x.size(1)].transpose(0, 1)
        return self.dropout(x)
