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
//   Side delts:       y 55–100,  x < 75 (left cap) | x > 143 (right cap)  — outermost shoulder
//   Front delts:      y 55–100,  x 75–90 (left)    | x 130–143 (right)    — anterior, closer to chest
//   Chest:            y 74–160,  x 85–165 (center torso)
//   Biceps:           y 100–165, x < 75 (left arm)  | x > 155 (right arm)
//   Abs:              y 155–230, x 85–140 (center)
//   Obliques:         y 155–230, x 68–95 | x 120–145 (flanks)
//   Forearms:         y 180–275, x < 80  | x > 140 (far sides)
//   Quads:            y 260+
// ─────────────────────────────────────────────────────────────────────────────
export const FRONT_MUSCLES: MuscleMapping[] = [
  {
    id: 'side_delts',
    label: 'Side Deltoids',
    description: 'Lateral deltoid — the outermost cap of the shoulder. Primary target of lateral raises, gives the shoulder its width.',
    // y 55–100, outermost edges: left x < 75, right x > 143
    indices: [50, 67, 87, 96, 99, 102, 115, 130, 136]
  },
  {
    id: 'front_delts',
    label: 'Front Deltoids',
    description: 'Anterior deltoid — the front-facing part of the shoulder, heavily recruited in overhead pressing and front raises.',
    // y 55–100, inner shoulder: left x 75–90, right x 130–143
    indices: [1, 5, 10, 27, 28, 38, 49, 74, 88, 108, 118, 131]
  },
  {
    id: 'chest_upper',
    label: 'Upper Chest',
    description: 'Clavicular head of the pectoralis major. Targeted by incline press movements.',
    // y 74–115, center x 85–165
    indices: [4, 9, 13, 16, 29, 36, 52, 69, 81, 85, 106, 112, 122, 126, 134, 139]
  },
  {
    id: 'chest_mid',
    label: 'Mid Chest',
    description: 'Sternocostal head of the pectoralis major. The primary flat bench press zone.',
    // y 115–135, center x 85–160
    indices: [2, 21, 44, 46, 54, 70, 94, 104, 107, 111, 113, 120, 142]
  },
  {
    id: 'chest_lower',
    label: 'Lower Chest',
    description: 'Lower pec / abdominal head. Targeted by decline press and dips.',
    // y 135–160, center x 85–160
    indices: [3, 8, 17, 40, 43, 57, 59, 73, 75, 93, 98, 109, 121, 125, 150]
  },
  {
    id: 'biceps',
    label: 'Biceps',
    description: 'Biceps brachii — the primary elbow flexor on the front of the upper arm.',
    // y 100–165, far left x < 75 and far right x > 155
    indices: [18, 19, 20, 24, 32, 33, 35, 56, 61, 72, 79, 80, 90, 114, 143, 144, 153]
  },
  {
    id: 'triceps_front',
    label: 'Triceps (Lateral Head)',
    description: 'The lateral head of the triceps, visible on the outer edge of the arm in front view.',
    // far outer edges of upper arm, y 100–180
    indices: [19, 56, 90, 143, 153, 154]
  },
  {
    id: 'abs',
    label: 'Abs',
    description: 'Rectus abdominis — the six-pack muscle running vertically down the center of the abdomen.',
    // y 155–230, center x 95–130
    indices: [30, 31, 37, 42, 48, 51, 63, 66, 78, 82, 89, 109, 117, 119, 123, 127, 140, 145, 149]
  },
  {
    id: 'obliques',
    label: 'Obliques',
    description: 'External and internal obliques running along the sides of the torso.',
    // y 155–230, flanks x 68–95 left and x 120–145 right
    indices: [6, 7, 11, 34, 41, 43, 53, 62, 65, 68, 71, 83, 92, 97, 101, 103, 121, 128, 132, 137, 141, 146, 155]
  },
  {
    id: 'forearms_front',
    label: 'Forearms',
    description: 'Forearm flexors on the front of the lower arm, engaged in all pulling and gripping movements.',
    // y 180–275, far outer sides
    indices: [14, 15, 25, 26, 39, 64, 65, 68, 116, 148]
  },
  {
    id: 'quads',
    label: 'Quadriceps',
    description: 'Four-headed muscle group on the front of the thigh. Primary mover in squats and leg press.',
    // y 260+
    indices: [11, 14, 15, 25, 26, 64, 116]
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
    indices: [1, 3, 4, 9, 10, 20, 27, 28, 30, 40, 42, 43, 46, 50, 51, 53, 63, 67, 69, 70, 73, 76, 77, 79, 84, 86, 91, 94, 101, 102, 103, 104, 105, 106, 108, 112, 115, 118, 119, 124]
  },
  {
    id: 'rear_delts',
    label: 'Rear Deltoids',
    description: 'Posterior deltoid — the back cap of the shoulder. Key for posture and rows/face pulls.',
    // y 55–130, far outer sides
    indices: [8, 9, 16, 20, 28, 31, 41, 42, 44, 49, 51, 52, 53, 54, 64, 65, 67, 73, 74, 78, 79, 81, 83, 84, 88, 94, 102, 105, 107, 120, 126]
  },
  {
    id: 'rhomboids',
    label: 'Rhomboids',
    description: 'Rhomboid major and minor — between the shoulder blades. Targeted by rows and face pulls.',
    // y 115–155, center x 75–125
    indices: [22, 23, 43, 50, 69, 70, 76, 80, 82, 101, 103, 104, 108, 112, 115, 122]
  },
  {
    id: 'lats',
    label: 'Lats',
    description: 'Latissimus dorsi — the broadest back muscle. Targeted by pull-ups, rows, and pulldowns.',
    // y 115–190, outer flanks
    indices: [2, 3, 10, 11, 12, 13, 14, 19, 21, 37, 43, 45, 56, 57, 58, 59, 60, 69, 71, 75, 76, 85, 87, 89, 90, 93, 98, 99, 100, 101, 103, 113, 114, 116, 121, 125, 131]
  },
  {
    id: 'triceps',
    label: 'Triceps',
    description: 'Three-headed muscle on the back of the upper arm. Primary mover in all pushing/pressing.',
    // y 115–200, far outer arms
    indices: [6, 7, 14, 15, 33, 36, 37, 38, 48, 57, 59, 60, 61, 68, 85, 87, 90, 92, 99, 100, 113, 114, 121, 125, 128]
  },
  {
    id: 'lower_back',
    label: 'Lower Back',
    description: 'Erector spinae and lumbar region. Engaged in deadlifts, hyperextensions, and heavy compound lifts.',
    // y 175–235, center x 75–125
    indices: [26, 29, 32, 34, 35, 36, 38, 39, 57, 61, 72, 99, 111, 113, 125]
  },
  {
    id: 'glutes',
    label: 'Glutes',
    description: 'Gluteus maximus, medius, and minimus — the largest muscle group. Squats, hip thrusts, deadlifts.',
    // y 175–240
    indices: [6, 7, 26, 29, 32, 33, 34, 35, 36, 38, 39, 48, 61, 68, 72, 92, 111, 113, 128]
  },
  {
    id: 'hamstrings',
    label: 'Hamstrings',
    description: 'Biceps femoris, semitendinosus, and semimembranosus on the back of the thigh.',
    // y 240–295
    indices: [17, 18, 24, 25, 47, 130]
  },
  {
    id: 'calves',
    label: 'Calves',
    description: 'Gastrocnemius and soleus — the muscles of the lower leg. Calf raises, running, jumping.',
    // y 295+
    indices: [96]
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
