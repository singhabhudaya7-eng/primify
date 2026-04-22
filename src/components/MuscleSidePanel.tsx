import { motion } from 'framer-motion';
import { MuscleMapping } from '../lib/muscle-logic';
import { X, Trophy, Activity, Zap } from 'lucide-react';

interface MuscleSidePanelProps {
  muscle: MuscleMapping;
  xp: number;
  onClose: () => void;
  onLogWorkout: (muscleId: string) => void;
  isLogging: boolean;
}

const getLevelInfo = (xp: number) => {
  if (xp >= 5000) return { name: 'Titan', color: 'text-[#FF00EA]', next: null };
  if (xp >= 2500) return { name: 'Champion', color: 'text-[#00F2FF]', next: 5000 };
  if (xp >= 1000) return { name: 'Gold', color: 'text-[#FFD700]', next: 2500 };
  if (xp >= 500) return { name: 'Silver', color: 'text-[#C0C0C0]', next: 1000 };
  if (xp >= 100) return { name: 'Bronze', color: 'text-[#CD7F32]', next: 500 };
  return { name: 'Initiate', color: 'text-white/40', next: 100 };
};

export const MuscleSidePanel = ({
  muscle,
  xp,
  onClose,
  onLogWorkout,
  isLogging
}: MuscleSidePanelProps) => {
  const level = getLevelInfo(xp);
  const nextXp = level.next;
  const progress = nextXp ? (xp / nextXp) * 100 : 100;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      className="absolute top-0 right-0 h-full w-full lg:w-[450px] bg-[#0A0A0A]/95 backdrop-blur-2xl border-l border-white/10 z-[100] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <div className="p-8 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/80">Muscle Profile</h4>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase">{muscle.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!muscle.id.startsWith('unmapped-') ? (
          <div className="space-y-8">
            {/* XP Card */}
            <div className="p-8 bg-gradient-to-br from-white/[0.05] to-transparent rounded-[32px] border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <Trophy size={60} />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter italic">{xp}</span>
                  <span className="text-sm font-bold uppercase tracking-widest text-white/40">Total XP</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className={level.color}>{level.name} Rank</span>
                    <span className="text-white/40">{Math.round(progress)}% Progress</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Activity size={14} className="text-blue-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60 italic">Physiological Overview</h3>
              </div>
              <p className="text-white/50 text-sm leading-relaxed font-medium tracking-tight">
                {muscle.description}
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-8">
              <button
                onClick={() => onLogWorkout(muscle.id)}
                disabled={isLogging}
                className="w-full p-6 bg-white text-black rounded-3xl font-black uppercase tracking-tighter flex items-center justify-center gap-3 hover:bg-blue-400 hover:text-white transition-all group active:scale-[0.98]"
              >
                <Zap size={20} className="fill-current group-hover:animate-pulse" />
                {isLogging ? 'Processing Evolution...' : 'Log Hypertrophy Session'}
              </button>
              <p className="text-center mt-4 text-[9px] font-bold uppercase tracking-widest text-white/20">
                +{XP_GAIN_PER_SESSION} XP per verified session
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-8 bg-blue-500/10 rounded-[32px] border border-blue-500/20">
              <h3 className="text-blue-400 font-black uppercase tracking-widest text-xs mb-4">Configuration Mode</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                This path (Index: <span className="text-white font-bold">{muscle.indices[0]}</span>) is currently unmapped. 
                Add this index to a muscle group in <code className="bg-white/10 px-1 rounded text-blue-300">muscle-logic.ts</code> to make it interactive.
              </p>
            </div>
            
            <div className="p-6 bg-white/5 rounded-[24px] border border-white/10">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Technical ID</div>
              <div className="text-sm font-mono text-white/80 select-all cursor-copy" title="Click to copy">
                {muscle.id}
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto pt-12 border-t border-white/5">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-[9px] font-black uppercase text-white/30 mb-1">Status</div>
              <div className="text-xs font-bold text-green-400 uppercase">Optimal</div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-[9px] font-black uppercase text-white/30 mb-1">Last Trained</div>
              <div className="text-xs font-bold text-white/60 uppercase">Recently</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
