import json
import re
import os

def fix_json_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # The file contains multiple JSON arrays like [...] [...] [...]
    # We want to merge them into one [...]
    # Simple strategy: remove all occurrences of "][" or "] [" or "]\n[" etc, replacing with ","
    # This effectively joins the inner lists.
    
    # Regex to find `]` followed by whitespace (optional) followed by `[`
    # indicating the boundary between two concatenated lists.
    fixed_content = re.sub(r'\]\s*\[', ',', content)
    
    try:
        data = json.loads(fixed_content)
        print(f"Successfully parsed {len(data)} items.")
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=4)
        print("Fixed file saved.")
        
    except json.JSONDecodeError as e:
        print(f"Failed to parse fixed content: {e}")

if __name__ == "__main__":
    fix_json_file("Data/raw/new.json")
