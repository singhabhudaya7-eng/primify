import { motion } from 'framer-motion';
import { MuscleMapping } from '../lib/muscle-logic';
import { Zap, Flame, Activity, Target, RotateCcw, CheckCircle2, Clock, ChevronRight, Trophy } from 'lucide-react';

interface MuscleStatsPanelProps {
  allMuscles: MuscleMapping[];
  userProgress: Record<string, number>;
  lastTrained: Record<string, string>;
  onMuscleClick: (muscle: MuscleMapping) => void;
  selectedMuscleId?: string;
}

const LEVELS = [
  { key: 'none',     name: 'Dormant',  color: '#3a3a4a', min: 0,    max: 100  },
  { key: 'bronze',   name: 'Bronze',   color: '#CD7F32', min: 100,  max: 500  },
  { key: 'silver',   name: 'Silver',   color: '#C0C0C0', min: 500,  max: 1000 },
  { key: 'gold',     name: 'Gold',     color: '#FFD700', min: 1000, max: 2500 },
  { key: 'champion', name: 'Champion', color: '#00F2FF', min: 2500, max: 5000 },
  { key: 'titan',    name: 'Titan',    color: '#FF00EA', min: 5000, max: null },
];

const getLevel = (xp: number) => {
  if (xp >= 5000) return LEVELS[5];
  if (xp >= 2500) return LEVELS[4];
  if (xp >= 1000) return LEVELS[3];
  if (xp >= 500)  return LEVELS[2];
  if (xp >= 100)  return LEVELS[1];
  return LEVELS[0];
};

const getProgressPct = (xp: number) => {
  const l = getLevel(xp);
  if (!l.max) return 100;
  return Math.min(100, ((xp - l.min) / (l.max - l.min)) * 100);
};

const isToday = (iso: string) => {
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const relTime = (iso: string) => {
  const d = daysSince(iso);
  if (d === 0) return 'Today'; if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`; return `${Math.floor(d / 7)}w ago`;
};

export const MuscleStatsPanel = ({ allMuscles, userProgress, lastTrained, onMuscleClick, selectedMuscleId }: MuscleStatsPanelProps) => {
  const totalXp       = allMuscles.reduce((s, m) => s + (userProgress[m.id] || 0), 0);
  const activeMuscles = allMuscles.filter(m => (userProgress[m.id] || 0) > 0);
  const todayMuscles  = allMuscles.filter(m => lastTrained[m.id] && isToday(lastTrained[m.id]));
  const needsTraining = allMuscles.filter(m => {
    const lt = lastTrained[m.id];
    return (userProgress[m.id] || 0) > 0 && (!lt || daysSince(lt) >= 2);
  }).slice(0, 3);
  const closestUp = allMuscles
    .filter(m => (userProgress[m.id] || 0) > 0 && getLevel(userProgress[m.id] || 0).max !== null)
    .sort((a, b) => getProgressPct(userProgress[b.id] || 0) - getProgressPct(userProgress[a.id] || 0))[0];
  const overallLevel  = getLevel(totalXp / Math.max(1, allMuscles.length));
  const levelDist     = LEVELS.map(l => ({ ...l, count: allMuscles.filter(m => getLevel(userProgress[m.id] || 0).key === l.key).length }));
  const sorted        = [...allMuscles].sort((a, b) => (userProgress[b.id] || 0) - (userProgress[a.id] || 0));

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">

      {/* ── 4 Summary Cards ── */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        {[
          { icon: <Zap size={11}/>,      label: 'Total XP', value: totalXp.toLocaleString(), sub: 'lifetime',            color: 'text-blue-400',   glow: 'rgba(59,130,246,0.15)'  },
          { icon: <Flame size={11}/>,    label: 'Active',   value: activeMuscles.length,     sub: `of ${allMuscles.length}`, color: 'text-emerald-400', glow: 'rgba(52,211,153,0.15)'  },
          { icon: <Activity size={11}/>, label: 'Today',    value: todayMuscles.length,       sub: todayMuscles.length === 1 ? 'muscle' : 'muscles',  color: 'text-amber-400',  glow: 'rgba(251,191,36,0.15)'  },
          { icon: <Trophy size={11}/>,   label: 'Avg Level', value: overallLevel.name,       sub: `${totalXp} XP`,      color: 'text-purple-400', glow: 'rgba(167,139,250,0.15)' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="p-3.5 rounded-2xl border border-white/[0.07] relative overflow-hidden"
            style={{ background: `radial-gradient(circle at top left, ${c.glow}, transparent 70%)` }}
          >
            <div className={`flex items-center gap-1.5 ${c.color} mb-2`}>
              {c.icon}
              <span className="text-[7px] font-black uppercase tracking-[0.3em]">{c.label}</span>
            </div>
            <div className="text-lg font-black italic tracking-tighter leading-none">{c.value}</div>
            <div className="text-[8px] text-white/30 mt-1">{c.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Today + Milestone ── */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className="p-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-center gap-1.5 mb-2.5">
            <CheckCircle2 size={11} className="text-emerald-400"/>
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/50">Today's Session</span>
          </div>
          {todayMuscles.length === 0
            ? <p className="text-[10px] text-white/20 italic">No muscles logged yet.</p>
            : <div className="flex flex-wrap gap-1.5">
                {todayMuscles.map(m => {
                  const lvl = getLevel(userProgress[m.id] || 0);
                  return (
                    <button key={m.id} onClick={() => onMuscleClick(m)}
                      className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border hover:scale-105 transition-transform"
                      style={{ borderColor: `${lvl.color}40`, color: lvl.color, background: `${lvl.color}18` }}>
                      {m.label}
                    </button>
                  );
                })}
              </div>
          }
        </div>

        <div className="p-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          {needsTraining.length > 0 ? (
            <>
              <div className="flex items-center gap-1.5 mb-2.5">
                <RotateCcw size={11} className="text-orange-400"/>
                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/50">Needs Training</span>
              </div>
              <div className="space-y-1.5">
                {needsTraining.map(m => (
                  <button key={m.id} onClick={() => onMuscleClick(m)} className="w-full flex justify-between group">
                    <span className="text-[10px] font-bold text-white/60 group-hover:text-white/90 transition-colors">{m.label}</span>
                    <span className="text-[9px] font-bold text-orange-400/70">{lastTrained[m.id] ? `${daysSince(lastTrained[m.id])}d rest` : 'never'}</span>
                  </button>
                ))}
              </div>
            </>
          ) : closestUp ? (
            <>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Target size={11} className="text-amber-400"/>
                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/50">Next Milestone</span>
              </div>
              {(() => {
                const xp = userProgress[closestUp.id] || 0;
                const lvl = getLevel(xp);
                const pct = getProgressPct(xp);
                const nextLvl = LEVELS[LEVELS.indexOf(lvl) + 1];
                return (
                  <button onClick={() => onMuscleClick(closestUp)} className="w-full text-left">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[11px] font-black">{closestUp.label}</span>
                      <span className="text-[9px]" style={{ color: lvl.color }}>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-[3px] w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" animate={{ width: `${pct}%` }}
                        style={{ backgroundColor: lvl.color, boxShadow: `0 0 8px ${lvl.color}80` }}/>
                    </div>
                    {nextLvl && <div className="text-[8px] text-white/25 mt-1">{lvl.max! - xp} XP to {nextLvl.name}</div>}
                  </button>
                );
              })()}
            </>
          ) : (
            <p className="text-[10px] text-white/20 italic pt-3">Log workouts to see suggestions.</p>
          )}
        </div>
      </div>

      {/* ── Level Distribution ── */}
      <div className="p-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-1.5 mb-3">
          <Activity size={11} className="text-blue-400"/>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/50">Level Distribution</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {levelDist.map(l => (
            <div key={l.key} className="flex flex-col items-center gap-1">
              <div className="text-base font-black italic" style={{ color: l.count > 0 ? l.color : '#252530' }}>{l.count}</div>
              <div className="h-[2px] w-full rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div className="h-full rounded-full" animate={{ width: `${(l.count / allMuscles.length) * 100}%` }}
                  transition={{ duration: 0.6 }} style={{ backgroundColor: l.color }}/>
              </div>
              <span className="text-[6px] font-black uppercase tracking-wider" style={{ color: l.count > 0 ? l.color : '#252530' }}>{l.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── All Muscles — flex-1 with hidden internal scroll ── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-white/[0.07] bg-white/[0.02] flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
          <div className="flex items-center gap-1.5">
            <Zap size={11} className="text-blue-400"/>
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/50">All Muscles</span>
          </div>
          <span className="text-[7px] text-white/25 font-bold">{activeMuscles.length} / {allMuscles.length} active</span>
        </div>

        {/* Invisible scrollbar */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {sorted.map((muscle, i) => {
            const xp  = userProgress[muscle.id] || 0;
            const lvl = getLevel(xp);
            const pct = getProgressPct(xp);
            const lt  = lastTrained[muscle.id];
            const isSel      = muscle.id === selectedMuscleId;
            const trainedToday = lt && isToday(lt);

            return (
              <motion.button key={muscle.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                onClick={() => onMuscleClick(muscle)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all group ${isSel ? 'bg-blue-500/10' : 'hover:bg-white/[0.025]'}`}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: xp > 0 ? lvl.color : '#252530', boxShadow: xp > 0 ? `0 0 5px ${lvl.color}60` : 'none' }}/>

                <div className="w-24 shrink-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold truncate ${isSel ? 'text-white' : 'text-white/65 group-hover:text-white/90'} transition-colors`}>{muscle.label}</span>
                    {trainedToday && <span className="text-[6px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded shrink-0">TODAY</span>}
                  </div>
                  <div className="text-[7px] font-bold uppercase tracking-wider mt-0.5" style={{ color: xp > 0 ? lvl.color : '#252530' }}>{lvl.name}</div>
                </div>

                <div className="flex-1">
                  <div className="h-[2px] w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, delay: i * 0.01 }} style={{ backgroundColor: xp > 0 ? lvl.color : 'transparent' }}/>
                  </div>
                </div>

                <div className="text-right shrink-0 w-20">
                  <div className="text-[10px] font-black" style={{ color: xp > 0 ? lvl.color : '#252530' }}>{xp > 0 ? `${xp} XP` : '—'}</div>
                  {lt && <div className="text-[7px] text-white/20 flex items-center gap-0.5 justify-end mt-0.5"><Clock size={6}/>{relTime(lt)}</div>}
                </div>

                <ChevronRight size={9} className={`shrink-0 transition-opacity ${isSel ? 'opacity-50 text-blue-400' : 'opacity-0 group-hover:opacity-20'}`}/>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
