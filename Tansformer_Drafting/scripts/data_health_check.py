
import json
import collections
import statistics

def health_check():
    print("🏥 Starting Pre-Training Health Check...")
    
    # Load Vocab & Data
    try:
        with open('Data/metadata/vocab.json', 'r') as f:
            vocab = json.load(f)
        with open('Data/raw/all_games.json', 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error loading files: {e}")
        return

    total_games = len(data)
    print(f"🔹 Total Games: {total_games}")
    
    # 1. Sequence Length Check
    lengths = []
    for g in data:
        draft = g.get('current_draft', [])
        lengths.append(len(draft))
        
    avg_len = statistics.mean(lengths)
    min_len = min(lengths)
    max_len = max(lengths)
    
    print(f"\n📏 Sequence Lengths:")
    print(f"   Avg: {avg_len:.2f}")
    print(f"   Min: {min_len} | Max: {max_len}")
    
    short_games = [l for l in lengths if l < 20]
    if short_games:
        print(f"   ⚠️ Warning: {len(short_games)} games have < 20 steps ({len(short_games)/total_games:.1%}).")
        print("   (These might be remakes or incomplete data. Model handles padding, but too many is noisy.)")
    else:
        print("   ✅ All game drafts are full length (>=20).")

    # 2. Vocabulary Coverage
    print(f"\n📚 Vocabulary Check:")
    known_champs = set(vocab.keys())
    unknown_champs = collections.Counter()
    used_champs = set()
    
    for g in data:
        for step in g.get('current_draft', []):
            c = step.get('champion')
            if c:
                if c not in known_champs:
                    unknown_champs[c] += 1
                else:
                    used_champs.add(c)
                    
    if unknown_champs:
        print(f"   ❌ Found {len(unknown_champs)} unknown champion names in data:")
        print(f"   Top 5 Unk: {unknown_champs.most_common(5)}")
        print("   (You may need to regenerate vocab if these are valid champs)")
    else:
        print("   ✅ 100% of champions in data are present in Vocabulary.")
        
    print(f"   Utilization: {len(used_champs)}/{len(known_champs)} vocab items used.")

    # 3. Duplicate Content Check
    # (Identical drafts? Could be different games but same Pick/Ban)
    print(f"\n👯 Duplicate Draft Check:")
    draft_hashes = collections.defaultdict(list)
    
    for g in data:
        # Create a hashable representation of the draft
        # Tuple of (Step, Champ)
        d_sig = tuple((s.get('step'), s.get('champion')) for s in g.get('current_draft', []))
        draft_hashes[d_sig].append(g.get('game_id'))
        
    duplicates = {k: v for k, v in draft_hashes.items() if len(v) > 1}
    
    if duplicates:
        print(f"   ⚠️ Found {len(duplicates)} drafts that appear multiple times.")
        print(f"   Max duplication: A single draft appears {max(len(v) for v in duplicates.values())} times.")
        print("   (This implies exact same P/B. Valid in LoL history, but extreme duplicates might imply data error.)")
    else:
        print("   ✅ No identical drafts found.")

    print("\n🏁 Health Check Complete.")

if __name__ == "__main__":
    health_check()
