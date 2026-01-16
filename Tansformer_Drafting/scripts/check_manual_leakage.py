import pandas as pd
import sys

def check_manual_leakage():
    print("Loading Train and Manual Test Parquet...")
    try:
        train_df = pd.read_parquet("data/processed/train.parquet")
        manual_df = pd.read_parquet("data/processed/newtest.parquet")
    except Exception as e:
        print(f"Error loading data: {e}")
        return

    print(f"Train Samples: {len(train_df)}")
    print(f"Manual Test Samples: {len(manual_df)}")
    
    train_history = set(train_df['draft_history'].unique())
    manual_history = set(manual_df['draft_history'].unique())
    
    overlap = train_history.intersection(manual_history)
    
    print("\n" + "="*50)
    print("MANUAL DATA LEAKAGE ANALYSIS")
    print("="*50)
    print(f"Train vs Manual Test Overlap: {len(overlap)} samples")
    
    if len(overlap) > 0:
        print("[WARNING] The manual test data overlaps with training data!")
        print("This is expected if manual data was taken from real games that are in the training set.")
        print("Sample Overlap:")
        for i, s in enumerate(list(overlap)[:3]):
            print(f"  {i+1}: {s[:100]}...")
    else:
        print("[PASS] No overlap between Manual Test Data and Training Data.")
        
if __name__ == "__main__":
    check_manual_leakage()
