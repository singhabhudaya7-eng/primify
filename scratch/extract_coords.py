import re
import json
import os

def extract_indices(filename):
    if not os.path.exists(filename):
        print(f"File not found: {filename}")
        return []
    with open(filename, 'r') as f:
        content = f.read()
    
    # Extract <text x="..." y="...">INDEX</text>
    matches = re.finditer(r'<text x="([\d.]+)" y="([\d.]+)"[^>]*>(\d+)</text>', content)
    indices = []
    for m in matches:
        indices.append({
            'index': int(m.group(3)),
            'x': float(m.group(1)),
            'y': float(m.group(2))
        })
    return indices

base_path = r'c:\Users\FORUS ELECTRIC\Desktop\primify'
front_indices = extract_indices(os.path.join(base_path, 'scratch', 'front-index-map.html'))
back_indices = extract_indices(os.path.join(base_path, 'scratch', 'back-index-map.html'))

output_path = os.path.join(base_path, 'scratch', 'extracted_indices.json')
with open(output_path, 'w') as f:
    json.dump({'front': front_indices, 'back': back_indices}, f, indent=2)

print(f"Extracted {len(front_indices)} front and {len(back_indices)} back indices.")
