import re
import os

def process_svg(filename, out_filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Find paths
    paths = re.findall(r'<path[^>]+d="([^"]+)"[^>]*>', content)
    
    # We want to keep the original content but inject text after paths
    # A simpler way is to just append labels at the end of the SVG
    labels = []
    
    for i, d in enumerate(paths):
        # Extract points to find center
        # This is a very rough heuristic but works for labeled SVGs
        coords = re.findall(r'([-+]?\d*\.\d+|\d+)', d)
        if coords:
            # Take the average of the first 10 coordinates as a rough center
            xs = [float(x) for x in coords[0::2]][:10]
            ys = [float(y) for y in coords[1::2]][:10]
            if xs and ys:
                cx = sum(xs) / len(xs)
                cy = sum(ys) / len(ys)
                labels.append(f'<text x="{cx}" y="{cy}" font-size="4" fill="red" font-weight="bold" pointer-events="none">{i}</text>')

    # Inject labels before </svg>
    new_content = content.replace('</svg>', '\n'.join(labels) + '\n</svg>')
    
    with open(out_filename, 'w') as f:
        f.write(new_content)

if __name__ == "__main__":
    process_svg('public/body front.svg', 'public/debug_front.svg')
    process_svg('public/body back.svg', 'public/debug_back.svg')
    print("Debug SVGs generated.")
