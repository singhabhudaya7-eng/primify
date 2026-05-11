import xml.etree.ElementTree as ET
import os

def prepare_svg(input_file, side_mapping):
    ET.register_namespace('', "http://www.w3.org/2000/svg")
    tree = ET.parse(input_file)
    root = tree.getroot()
    
    # Path list
    paths = root.findall('.//{http://www.w3.org/2000/svg}path')
    
    # Create groups
    groups = {}
    for group_id, indices in side_mapping.items():
        g = ET.SubElement(root, '{http://www.w3.org/2000/svg}g', id=group_id)
        groups[group_id] = g
        for idx in indices:
            if idx < len(paths):
                path = paths[idx]
                # Move path to group
                # root.remove(path) # This is tricky in ElementTree while iterating
                # Better: just set attribute for now or rebuild
                path.set('data-muscle-group', group_id)

    # I will rebuild the root children to maintain order roughly but grouped
    # Actually, the user wants interactivity. Adding IDs to paths directly is fine too.
    # But grouping is cleaner.
    
    # To avoid complex ET manipulation, I'll just add IDs to paths.
    for group_id, indices in side_mapping.items():
        for i, idx in enumerate(indices):
            if idx < len(paths):
                # For multiple paths in one muscle, we might need a unique ID or a shared class
                # But the user asked for "chest_front" etc.
                # If there are multiple, I'll use chest_front_1, chest_front_2 and handle in React
                # OR wrap them in a group <g id="chest_front">
                pass

    # Actually, the easiest way is to just inject IDs into the raw text if I want groups.
    # Or just use path attributes.
    
    tree.write(input_file.replace('.svg', '.processed.svg'))

# Front Mapping (indices from subagent)
front_mapping = {
    'chest_right_front': [35, 39],
    'chest_left_front': [37, 30, 28],
    'abs_front': [31, 34, 36, 20],
    'shoulder_right_front': [19, 12],
    'shoulder_left_front': [16, 11],
    'bicep_right': [22, 24],
    'bicep_left': [21, 25, 26, 27],
    'quad_right': [4, 13],
    'quad_left': [7, 8, 14, 23],
    'forearm_right': [41], # Best guess
    'forearm_left': [40]   # Best guess
}

# Back Mapping (Need to identify these still or guess)
# I'll just do front first to show progress.

print("Script template ready. I'll use a better way to inject IDs.")
