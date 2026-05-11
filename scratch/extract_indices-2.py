import re
import json

def extract_indices(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # Find all <text> elements with indices
    labels = re.findall(r'<text x="([\d.]+)" y="([\d.]+)"[^>]*>(\d+)</text>', content)
    
    indices = []
    for x, y, idx in labels:
        indices.append({
            'index': int(idx),
            'x': float(x),
            'y': float(y)
        })
    return indices

front_indices = extract_indices('scratch/front-index-map.html')
back_indices = extract_indices('scratch/back-index-map.html')

with open('scratch/extracted_indices.json', 'w') as f:
    json.dump({'front': front_indices, 'back': back_indices}, f, indent=2)

print(f"Extracted {len(front_indices)} front indices and {len(back_indices)} back indices.")
