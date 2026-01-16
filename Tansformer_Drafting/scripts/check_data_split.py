
import json
import collections

def verify_split():
    data_path = 'Data/raw/all_games.json'
    try:
        with open(data_path, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"File not found: {data_path}")
        return

    total_games = len(data)
    print(f"Total Games in Raw Data: {total_games}")
    
    # Check ID Uniqueness
    ids = [g.get('game_id') for g in data]
    unique_ids = set(ids)
    if len(ids) != len(unique_ids):
        print(f"❌ WARNING: Duplicate Game IDs found! ({len(ids)} total vs {len(unique_ids)} unique)")
    else:
        print(f"✅ Game IDs are unique.")

    # Simulate Split
    train_ids = set()
    val_ids = set()
    test_ids = set()
    
    for g in data:
        gid = int(g.get('game_id', 0))
        if gid % 10 < 8:
            train_ids.add(gid)
        elif gid % 10 == 8:
            val_ids.add(gid)
        elif gid % 10 == 9:
            test_ids.add(gid)
            
    print(f"Train Set: {len(train_ids)} ({len(train_ids)/total_games:.1%})")
    print(f"Val Set:   {len(val_ids)} ({len(val_ids)/total_games:.1%})")
    print(f"Test Set:  {len(test_ids)} ({len(test_ids)/total_games:.1%})")
    
    # Check Overlap
    overlap_tv = train_ids.intersection(val_ids)
    overlap_tt = train_ids.intersection(test_ids)
    overlap_vt = val_ids.intersection(test_ids)
    
    if not overlap_tv and not overlap_tt and not overlap_vt:
        print("✅ No overlap between splits.")
    else:
        print("❌ Overlap detected!")
        print(f"Train/Val Overlap: {len(overlap_tv)}")
        print(f"Train/Test Overlap: {len(overlap_tt)}")
        print(f"Val/Test Overlap: {len(overlap_vt)}")

if __name__ == "__main__":
    verify_split()
