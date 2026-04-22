import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { BodySide, getMuscleByPathIndex, MuscleMapping } from '../lib/muscle-logic';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMuscleId, setHoveredMuscleId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    muscle: MuscleMapping;
    level: string;
    xp: number;
    x: number;
    y: number;
  } | null>(null);

  const handleMouseMove = (e: React.MouseEvent, muscle: MuscleMapping | undefined, xp: number, level: string) => {
    if (!muscle || !containerRef.current) {
      setTooltip(null);
      return;
    }
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
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#ffffff" floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {paths.map((path, index) => {
          const muscle = getMuscleByPathIndex(index, side);
          const xp = muscle ? (userProgress[muscle.id] || 0) : 0;
          const level = getLevel(xp);
          const isSelected = muscle?.id === selectedMuscleId;
          const isHovered = muscle?.id === hoveredMuscleId;

          // Determine path color
          let fill = '#e0e0e0';
          let opacity = 0.8;
          let stroke = 'rgba(255,255,255,0.05)';

          if (muscle) {
            if (level !== 'none') {
              fill = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS];
            } else {
              fill = '#e0e0e0';
            }

            if (isHovered) {
              fill = '#ffffff';
              opacity = 1;
              stroke = 'rgba(255,255,255,0.6)';
            }

            if (isSelected) {
              opacity = 1;
              stroke = 'rgba(255,255,255,0.4)';
            }
          }

          return (
            <g key={`${side}-${index}`} transform={path.transform} filter={isHovered ? 'url(#glow)' : undefined}>
              <motion.path
                d={path.d}
                initial={false}
                animate={{
                  fill: fill,
                  opacity: opacity,
                  stroke: stroke,
                  strokeWidth: isSelected ? 0.5 : 0.2,
                  scale: isSelected ? 1.01 : 1,
                }}
                transition={{ duration: 0.15 }}
                className={muscle || showIndices ? 'cursor-pointer' : ''}
                onMouseEnter={() => muscle && setHoveredMuscleId(muscle.id)}
                onMouseMove={(e) => handleMouseMove(e as unknown as React.MouseEvent, muscle, xp, level)}
                onMouseLeave={() => {
                  setHoveredMuscleId(null);
                  setTooltip(null);
                }}
                onClick={() => {
                  if (muscle) onMuscleClick(muscle);
                  else if (showIndices) {
                    onMuscleClick({
                      id: `unmapped-${index}`,
                      label: `Path ${index}`,
                      description: 'This path is not yet assigned to any muscle group.',
                      indices: [index]
                    });
                  }
                }}
              />
              {showIndices && (
                <text
                  x={0}
                  y={0}
                  className="fill-white font-bold text-[3px] pointer-events-none select-none drop-shadow-sm"
                  style={{ textShadow: '0 0 2px black' }}
                >
                  {index}
                </text>
              )}
            </g>
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

