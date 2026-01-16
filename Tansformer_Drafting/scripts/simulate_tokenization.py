import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.tokenizer import LoLTokenizer

# Dummy History
# Blue Picks: Maokai (Support/Tank)
# Red Picks: Varus (Marksman)
history = [
    # Bans...
    {"step": "1", "champion": "Aatrox", "champion_class": ["FIGHTER"]},
    # ...
    # Step 7: Blue Pick Maokai
    {"step": "7", "champion": "Maokai", "champion_class": ["SUPPORT", "TANK"]},
    # Step 8: Red Pick Varus
    {"step": "8", "champion": "Varus", "champion_class": ["MARKSMAN"]},
    # Step 9: Red Pick Nautilus
    {"step": "9", "champion": "Nautilus", "champion_class": ["SUPPORT", "TANK"]},
    # Step 10: Blue Pick Jinx
    {"step": "10", "champion": "Jinx", "champion_class": ["MARKSMAN"]},
]

tokenizer = LoLTokenizer("Data/metadata/vocab.json")
print("Encoding History...")
tokens = tokenizer.encode(history)
decoded = tokenizer.decode(tokens)

print("\nDecoded Tokens:")
chunk_size = 15
for i in range(0, len(decoded), chunk_size):
    print(decoded[i:i+chunk_size])
