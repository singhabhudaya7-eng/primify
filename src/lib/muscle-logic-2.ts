export type BodySide = 'front' | 'back';

export interface MuscleMapping {
  id: string;
  label: string;
  description: string;
  indices: number[];
}

export const XP_GAIN_PER_SESSION = 100;

// ─────────────────────────────────────────────────────────────────────────────
// FRONT MUSCLES
// Coordinate reference: SVG viewBox 0 0 243 403, body center ~x=120
//   Shoulders:  y 55–100,  x < 90 (left) | x > 130 (right)
//   Chest:      y 74–160,  x 85–165 (center torso)
//   Biceps:     y 100–165, x < 75 (left arm)  | x > 155 (right arm)
//   Abs:        y 155–230, x 85–140 (center)
//   Obliques:   y 155–230, x 68–95 | x 120–145 (flanks)
//   Forearms:   y 180–275, x < 80  | x > 140 (far sides)
//   Quads:      y 260+
// ─────────────────────────────────────────────────────────────────────────────
export const FRONT_MUSCLES: MuscleMapping[] = [
  {
    id: 'shoulders',
    label: 'Shoulders',
    description: 'Deltoid muscle group — the rounded cap of the shoulder. Hit by pressing, raises, and rows.',
    // y 55–100, both sides
    indices: [27, 28, 50, 67, 74, 87, 96, 99, 102, 115, 122, 130, 136]
  },
  {
    id: 'chest',
    label: 'Chest',
    description: 'Pectoralis major — the large chest muscle. Bench press, flyes, push-ups, and dips.',
    // y 74–160, center torso
    indices: [9, 10, 23, 24, 47, 79, 81, 86, 91, 105, 118, 144]
  },
  {
    id: 'biceps',
    label: 'Biceps',
    description: 'Biceps brachii — the primary elbow flexor on the front of the upper arm.',
    // y 100–165, far left x < 75 and far right x > 155
    indices: [18, 32, 33, 35, 56, 72]
  },
  {
    id: 'triceps_front',
    label: 'Triceps (Lateral Head)',
    description: 'The lateral head of the triceps, visible on the outer edge of the arm in front view.',
    // far outer edges of upper arm, y 100–180
    indices: []
  },
  {
    id: 'abs',
    label: 'Abs',
    description: 'Rectus abdominis — the six-pack muscle running vertically down the center of the abdomen.',
    // y 155–230, center x 95–130
    indices: [29, 40, 52, 57, 63, 70, 84, 93, 94, 98, 104, 106, 109, 110, 111, 112, 120, 124, 129, 133, 150, 151]
  },
  {
    id: 'obliques',
    label: 'Obliques',
    description: 'External and internal obliques running along the sides of the torso.',
    // y 155–230, flanks x 68–95 left and x 120–145 right
    indices: [21, 22, 45, 46, 103, 121, 126, 132, 138, 146, 147]
  },
  {
    id: 'forearms_front',
    label: 'Forearms',
    description: 'Forearm flexors on the front of the lower arm, engaged in all pulling and gripping movements.',
    // y 180–275, far outer sides
    indices: [19, 20, 58, 75]
  },
  {
    id: 'quads',
    label: 'Quadriceps',
    description: 'Four-headed muscle group on the front of the thigh. Primary mover in squats and leg press.',
    // y 260+
    indices: [6, 7, 30, 31, 34, 39, 42, 43, 48, 51, 53, 62, 82, 83, 89, 92, 97, 101, 117, 123, 127, 132, 137, 140, 145, 148, 149, 155]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// BACK MUSCLES
// Coordinate reference: SVG viewBox 0 0 243 403, body center ~x=88
//   Traps:       y 55–130, center x 75–130
//   Rear delts:  y 55–130, x < 55 (left arm) | x > 120 (right arm)
//   Rhomboids:   y 115–155, center x 75–125
//   Lats:        y 115–190, x < 70 (left flank) | x > 115 (right flank)
//   Triceps:     y 115–200, x < 55 (left arm)  | x > 120 (right arm)
//   Lower back:  y 175–235, center x 75–125
//   Glutes:      y 175–240
//   Hamstrings:  y 240–295
//   Calves:      y 295+
// ─────────────────────────────────────────────────────────────────────────────
export const BACK_MUSCLES: MuscleMapping[] = [
  {
    id: 'traps',
    label: 'Trapezius',
    description: 'Diamond-shaped muscle of the upper back and neck. Shrugs, rows, and deadlifts hit this hard.',
    // y 55–130, center x 75–130
    indices: [1]
  },
  {
    id: 'rear_delts',
    label: 'Rear Deltoids',
    description: 'Posterior deltoid — the back cap of the shoulder. Key for posture and rows/face pulls.',
    // y 55–130, far outer sides
    indices: [27, 28, 30, 44, 53, 65, 78, 79, 81, 83, 84, 94, 102, 118, 120, 124, 127]
  },
  {
    id: 'rhomboids',
    label: 'Rhomboids',
    description: 'Rhomboid major and minor — between the shoulder blades. Targeted by rows and face pulls.',
    // y 115–155, center x 75–125
    indices: []
  },
  {
    id: 'lats',
    label: 'Lats',
    description: 'Latissimus dorsi — the broadest back muscle. Targeted by pull-ups, rows, and pulldowns.',
    // y 115–190, outer flanks
    indices: [8, 9, 16, 40, 51, 55, 63, 66, 67, 77, 88, 95, 97, 106, 115, 117, 129, 133, 134, 135]
  },
  {
    id: 'triceps',
    label: 'Triceps',
    description: 'Three-headed muscle on the back of the upper arm. Primary mover in all pushing/pressing.',
    // y 115–200, far outer arms
    indices: [20, 41, 42, 52, 73, 74, 86, 105, 126]
  },
  {
    id: 'lower_back',
    label: 'Lower Back',
    description: 'Erector spinae and lumbar region. Engaged in deadlifts, hyperextensions, and heavy compound lifts.',
    // y 175–235, center x 75–125
    indices: [22, 23, 50, 58, 70, 93]
  },
  {
    id: 'glutes',
    label: 'Glutes',
    description: 'Gluteus maximus, medius, and minimus — the largest muscle group. Squats, hip thrusts, deadlifts.',
    // y 175–240
    indices: [12, 13, 56, 60, 71, 87, 89, 99, 116, 125, 128, 131]
  },
  {
    id: 'hamstrings',
    label: 'Hamstrings',
    description: 'Biceps femoris, semitendinosus, and semimembranosus on the back of the thigh.',
    // y 240–295
    indices: [6, 7, 26, 32, 36, 38, 39, 48, 57, 68, 111]
  },
  {
    id: 'calves',
    label: 'Calves',
    description: 'Gastrocnemius and soleus — the muscles of the lower leg. Calf raises, running, jumping.',
    // y 295+
    indices: [17, 18, 24, 25]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_MUSCLES = [...FRONT_MUSCLES, ...BACK_MUSCLES];

export const getMuscleById = (id: string): MuscleMapping | undefined =>
  ALL_MUSCLES.find(m => m.id === id);

export const getMuscleByPathIndex = (
  index: number,
  side: BodySide
): MuscleMapping | undefined => {
  const muscles = side === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;
  return muscles.find(m => m.indices.includes(index));
};

export const getMusclesForSide = (side: BodySide): MuscleMapping[] =>
  side === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;
