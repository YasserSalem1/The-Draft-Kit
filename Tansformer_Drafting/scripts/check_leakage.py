import pandas as pd
import json

def check_leakage():
    print("Loading Train, Val, and Test Parquet...")
    try:
        train_df = pd.read_parquet("data/processed/train.parquet")
        val_df = pd.read_parquet("data/processed/val.parquet")
        test_df = pd.read_parquet("data/processed/test.parquet")
    except Exception as e:
        print(f"Error loading data: {e}")
        return

    print(f"Train Samples: {len(train_df)}")
    print(f"Val Samples:   {len(val_df)}")
    print(f"Test Samples:  {len(test_df)}")
    
    # Check Content Overlap
    train_history = set(train_df['draft_history'].unique())
    val_history = set(val_df['draft_history'].unique())
    test_history = set(test_df['draft_history'].unique())
    
    print(f"Unique Train Seqs: {len(train_history)}")
    print(f"Unique Val Seqs:   {len(val_history)}")
    print(f"Unique Test Seqs:  {len(test_history)}")
    
    # 1. Train vs Test
    leak_tt = train_history.intersection(test_history)
    pct_tt = len(leak_tt) / len(test_history) if len(test_history) else 0
    
    # 2. Train vs Val
    leak_tv = train_history.intersection(val_history)
    pct_tv = len(leak_tv) / len(val_history) if len(val_history) else 0
    
    # 3. Val vs Test
    leak_vt = val_history.intersection(test_history)
    
    print("\n" + "="*50)
    print("LEAKAGE ANALYSIS")
    print("="*50)
    print(f"Train vs Test Overlap: {len(leak_tt)} ({pct_tt:.2%})")
    print(f"Train vs Val Overlap:  {len(leak_tv)} ({pct_tv:.2%})")
    print(f"Val vs Test Overlap:   {len(leak_vt)}")
    print("-" * 50)
    
    if len(leak_tt) > 0 or len(leak_tv) > 0 or len(leak_vt) > 0:
        print("[CRITICAL] LEAKAGE DETECTED!")
    else:
        print("[PASS] CLEAN SPLIT. No content overlap found anywhere.")
    
if __name__ == "__main__":
    check_leakage()
