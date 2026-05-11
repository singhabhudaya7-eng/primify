import re
import math

def get_centroid(path_data):
    # Very rough centroid calculation
    coords = re.findall(r'([-+]?\d*\.\d+|\d+)', path_data)
    if not coords:
        return None
    xs = [float(x) for x in coords[0::2]]
    ys = [float(y) for y in coords[1::2]]
    if not xs or not ys:
        return None
    return sum(xs) / len(xs), sum(ys) / len(ys)

def analyze_svg(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    paths = re.findall(r'<path[^>]+d="([^"]+)"[^>]*>', content)
    print(f"Analysis of {filename}:")
    for i, d in enumerate(paths):
        centroid = get_centroid(d)
        if centroid:
            print(f"Index {i}: Centroid ({centroid[0]:.1f}, {centroid[1]:.1f})")

if __name__ == "__main__":
    analyze_svg('public/body front.svg')
    analyze_svg('public/body back.svg')
