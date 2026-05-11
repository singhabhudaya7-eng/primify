const fs = require('fs');
const path = require('path');

function extractIndices(filename) {
    if (!fs.existsSync(filename)) {
        console.log(`File not found: ${filename}`);
        return [];
    }
    const content = fs.readFileSync(filename, 'utf8');
    const regex = /<text x="([\d.]+)" y="([\d.]+)"[^>]*>(\d+)<\/text>/g;
    const indices = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        indices.push({
            index: parseInt(match[3]),
            x: parseFloat(match[1]),
            y: parseFloat(match[2])
        });
    }
    return indices;
}

const basePath = process.cwd();
const frontIndices = extractIndices(path.join(basePath, 'scratch', 'front-index-map.html'));
const backIndices = extractIndices(path.join(basePath, 'scratch', 'back-index-map.html'));

const output = { front: frontIndices, back: backIndices };
fs.writeFileSync(path.join(basePath, 'scratch', 'extracted_indices.json'), JSON.stringify(output, null, 2));

console.log(`Extracted ${frontIndices.length} front and ${backIndices.length} back indices.`);
