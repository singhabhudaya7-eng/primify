import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { BodySide, getMuscleByPathIndex, MuscleMapping, FRONT_MUSCLES, BACK_MUSCLES } from '../lib/muscle-logic';
import { FRONT_PATHS, BACK_PATHS } from '../lib/muscle-paths';

interface MuscleMapProps {
  side: BodySide;
  userProgress: Record<string, number>;
  onMuscleClick: (muscle: MuscleMapping) => void;
  selectedMuscleId?: string;
  showIndices?: boolean;
}

const LEVEL_COLORS = {
  none: '#1a1a1a',
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  champion: '#00F2FF',
  titan: '#FF00EA'
};

const LEVEL_LABELS: Record<string, { name: string; color: string }> = {
  none: { name: 'Dormant', color: '#555' },
  bronze: { name: 'Bronze', color: '#CD7F32' },
  silver: { name: 'Silver', color: '#C0C0C0' },
  gold: { name: 'Gold', color: '#FFD700' },
  champion: { name: 'Champion', color: '#00F2FF' },
  titan: { name: 'Titan', color: '#FF00EA' }
};

const getLevel = (xp: number) => {
  if (xp >= 5000) return 'titan';
  if (xp >= 2500) return 'champion';
  if (xp >= 1000) return 'gold';
  if (xp >= 500) return 'silver';
  if (xp >= 100) return 'bronze';
  return 'none';
};

export const MuscleMap = ({
  side,
  userProgress,
  onMuscleClick,
  selectedMuscleId,
  showIndices = false
}: MuscleMapProps) => {
  const paths = side === 'front' ? FRONT_PATHS : BACK_PATHS;
  const muscles = side === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMuscleId, setHoveredMuscleId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    muscle: MuscleMapping;
    level: string;
    xp: number;
    x: number;
    y: number;
  } | null>(null);

  const handleMouseMove = (e: React.MouseEvent, muscle: MuscleMapping, xp: number, level: string) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      muscle,
      level,
      xp,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center p-4">
      <svg
        viewBox="0 0 243 403"
        className="w-full h-full max-h-[80vh] drop-shadow-[0_0_30px_rgba(0,150,255,0.1)]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/*
            muscleOutline: dilates the group's combined alpha outward, then
            colours that expansion — creates a border only around the outer
            edge of the whole muscle group, NOT between internal fragments.
          */}
          <filter id="muscleOutline" x="-6%" y="-6%" width="112%" height="112%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="0.8" result="expanded" />
            <feFlood floodColor="rgba(15,22,45,0.55)" result="color" />
            <feComposite in="color" in2="expanded" operator="in" result="outline" />
            <feMerge>
              <feMergeNode in="outline" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Hover: slightly larger blue-tinted outline glow */}
          <filter id="muscleHover" x="-10%" y="-10%" width="120%" height="120%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.4" result="expanded" />
            <feFlood floodColor="rgba(100,170,255,0.75)" result="color" />
            <feComposite in="color" in2="expanded" operator="in" result="outline" />
            <feGaussianBlur in="outline" stdDeviation="0.8" result="softOutline" />
            <feMerge>
              <feMergeNode in="softOutline" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Selected: blue ring */}
          <filter id="muscleSelected" x="-8%" y="-8%" width="116%" height="116%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.1" result="expanded" />
            <feFlood floodColor="rgba(80,150,255,0.9)" result="color" />
            <feComposite in="color" in2="expanded" operator="in" result="outline" />
            <feMerge>
              <feMergeNode in="outline" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Layer 1: unmapped background paths (flat, no border) ── */}
        {paths.map((path, index) => {
          const muscle = getMuscleByPathIndex(index, side);
          if (muscle && !showIndices) return null; // handled in Layer 2
          if (muscle) return null;
          return (
            <g key={`unmapped-${index}`} transform={path.transform}>
              <path
                d={path.d}
                fill="#c8cdd8"
                opacity={0.55}
                stroke="none"
                className={showIndices ? 'cursor-pointer' : ''}
                onClick={() => showIndices && onMuscleClick({
                  id: `unmapped-${index}`,
                  label: `Path ${index}`,
                  description: 'Unmapped path.',
                  indices: [index]
                })}
              />
              {showIndices && (
                <text x={0} y={0} fontSize={3} fill="white" style={{ textShadow: '0 0 2px black' }}>
                  {index}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Layer 2: muscle groups — each group's paths share ONE outline ── */}
        {muscles
          .filter(m => m.indices.length > 0)
          .map(muscle => {
            const xp = userProgress[muscle.id] || 0;
            const level = getLevel(xp);
            const isSelected = muscle.id === selectedMuscleId;
            const isHovered = muscle.id === hoveredMuscleId;

            let fill = '#d4d9e6';
            if (level !== 'none') fill = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS];
            if (isHovered) fill = '#f0f4ff';

            const musclePaths = muscle.indices
              .map(idx => paths[idx])
              .filter(Boolean);

            const filter = isHovered
              ? 'url(#muscleHover)'
              : isSelected
                ? 'url(#muscleSelected)'
                : 'url(#muscleOutline)';

            return (
              <motion.g
                key={muscle.id}
                filter={filter}
                animate={{ opacity: isHovered ? 1 : 0.88 }}
                transition={{ duration: 0.18 }}
                onMouseEnter={() => setHoveredMuscleId(muscle.id)}
                onMouseMove={(e) => handleMouseMove(e as unknown as React.MouseEvent, muscle, xp, level)}
                onMouseLeave={() => { setHoveredMuscleId(null); setTooltip(null); }}
                onClick={() => onMuscleClick(muscle)}
                className="cursor-pointer"
              >
                {musclePaths.map((path, i) => (
                  <motion.path
                    key={i}
                    d={path.d}
                    transform={path.transform}
                    animate={{ fill }}
                    transition={{ duration: 0.18 }}
                    stroke="none"
                  />
                ))}
              </motion.g>
            );
          })}
      </svg>

      {/* Hover Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 animate-in fade-in duration-100"
          style={{
            left: tooltip.x + 16,
            top: tooltip.y - 12,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="bg-[#0c0c0c]/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[140px]">
            <div className="text-white font-black text-sm tracking-tight leading-none mb-1.5">
              {tooltip.muscle.label}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: LEVEL_LABELS[tooltip.level].color }}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: LEVEL_LABELS[tooltip.level].color }}
              >
                {LEVEL_LABELS[tooltip.level].name}
              </span>
              <span className="text-[10px] text-white/30 font-medium ml-auto">
                {tooltip.xp} XP
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};
