const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('scratch/extracted_indices.json', 'utf8'));

const frontMapping = {
  shoulders_front: [],
  shoulders_side: [],
  chest_upper: [],
  chest_middle: [],
  chest_lower: [],
  biceps: [],
  forearms: [],
  abs: [],
  obliques: [],
  quads: []
};

const backMapping = {
  traps: [],
  shoulders_rear: [],
  triceps: [],
  lats: [],
  back_lower: [],
  hamstrings: [],
  calves: []
};

data.front.forEach(p => {
  const { index, x, y } = p;
  
  // Quads
  if (y > 260) frontMapping.quads.push(index);
  // Forearms
  else if (y > 200 && (x < 60 || x > 180)) frontMapping.forearms.push(index);
  // Biceps
  else if (y > 140 && y <= 200 && (x < 85 || x > 165)) frontMapping.biceps.push(index);
  // Abs / Obliques
  else if (y > 185 && y <= 260) {
    if (x > 100 && x < 145) frontMapping.abs.push(index);
    else frontMapping.obliques.push(index);
  }
  // Chest
  else if (y > 110 && y <= 185 && x > 80 && x < 170) {
    if (y < 145) frontMapping.chest_upper.push(index);
    else if (y < 165) frontMapping.chest_middle.push(index);
    else frontMapping.chest_lower.push(index);
  }
  // Shoulders
  else if (y > 100 && y <= 170) {
    if (x < 100 || x > 145) {
        // Distinguish front vs side by X relative to center
        // Side delt is further out
        if (x < 45 || x > 200) frontMapping.shoulders_side.push(index);
        else frontMapping.shoulders_front.push(index);
    }
  }
});

data.back.forEach(p => {
  const { index, x, y } = p;
  
  // Calves
  if (y > 310) backMapping.calves.push(index);
  // Hamstrings
  else if (y > 270 && y <= 310) backMapping.hamstrings.push(index);
  // Lower Back
  else if (y > 230 && y <= 270 && x > 70 && x < 130) backMapping.back_lower.push(index);
  // Lats
  else if (y > 130 && y <= 230 && (x < 70 || x > 130)) backMapping.lats.push(index);
  // Traps
  else if (y < 130 && x > 70 && x < 130) backMapping.traps.push(index);
  // Shoulders Rear
  else if (y > 100 && y <= 170 && (x < 70 || x > 130)) backMapping.shoulders_rear.push(index);
  // Triceps
  else if (y > 130 && y <= 230 && (x >= 70 && x <= 130)) {
     // Center of back Y 130-230 is tricky - could be upper lats or spine.
     // But triceps are outer.
     // Re-check: Triceps in back view are usually outer arms.
     if (x < 40 || x > 160) backMapping.triceps.push(index);
     else backMapping.lats.push(index);
  }
});

console.log('FRONT_MAPPING:', JSON.stringify(frontMapping, null, 2));
console.log('BACK_MAPPING:', JSON.stringify(backMapping, null, 2));
