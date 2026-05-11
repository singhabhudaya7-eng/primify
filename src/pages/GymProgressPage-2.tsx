import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMuscleProgress } from '@/hooks/useMuscleProgress';
import { MuscleMap } from '@/components/MuscleMap';
import { MuscleSidePanel } from '@/components/MuscleSidePanel';
import { BodySide, MuscleMapping, FRONT_MUSCLES, BACK_MUSCLES, ALL_MUSCLES, XP_GAIN_PER_SESSION } from '@/lib/muscle-logic';
import { Dumbbell, Settings, Check, X, Zap, Clock, Target, RotateCcw, ChevronRight, CheckCircle2, Trophy, Medal } from 'lucide-react';

const LEVELS = [
  { key: 'none',     name: 'Dormant',  color: '#3a3a4a', min: 0,    max: 100  },
  { key: 'bronze',   name: 'Bronze',   color: '#CD7F32', min: 100,  max: 500  },
  { key: 'silver',   name: 'Silver',   color: '#C0C0C0', min: 500,  max: 1000 },
  { key: 'gold',     name: 'Gold',     color: '#FFD700', min: 1000, max: 2500 },
  { key: 'champion', name: 'Champion', color: '#00F2FF', min: 2500, max: 5000 },
  { key: 'titan',    name: 'Titan',    color: '#FF00EA', min: 5000, max: null },
];
const getLevel = (xp: number) => {
  if (xp >= 5000) return LEVELS[5]; if (xp >= 2500) return LEVELS[4];
  if (xp >= 1000) return LEVELS[3]; if (xp >= 500)  return LEVELS[2];
  if (xp >= 100)  return LEVELS[1]; return LEVELS[0];
};
const getPct = (xp: number) => { const l = getLevel(xp); if (!l.max) return 100; return Math.min(100, ((xp - l.min) / (l.max - l.min)) * 100); };
const isToday = (iso: string) => { const d = new Date(iso), n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); };
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
const relTime = (iso: string) => { const d = daysSince(iso); if (d === 0) return 'Today'; if (d === 1) return 'Yesterday'; if (d < 7) return `${d}d ago`; return `${Math.floor(d / 7)}w ago`; };

export default function GymProgressPage() {
  const [side, setSide] = useState<BodySide>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleMapping | null>(null);
  const { progress, lastTrained, logWorkout, isLogging } = useMuscleProgress();
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalXp = ALL_MUSCLES.reduce((s, m) => s + (progress[m.id] || 0), 0);
  const activeMuscles = ALL_MUSCLES.filter(m => (progress[m.id] || 0) > 0);
  const todayMuscles  = ALL_MUSCLES.filter(m => lastTrained[m.id] && isToday(lastTrained[m.id]));
  const avgXp = totalXp / Math.max(1, activeMuscles.length);
  const avgLevel = getLevel(avgXp);
  const avgPct  = getPct(avgXp);
  const avgNextLevel = LEVELS[LEVELS.indexOf(avgLevel) + 1];

  const closestUp = ALL_MUSCLES
    .filter(m => (progress[m.id] || 0) > 0 && getLevel(progress[m.id] || 0).max !== null)
    .sort((a, b) => getPct(progress[b.id] || 0) - getPct(progress[a.id] || 0))[0];

  const sorted = [...ALL_MUSCLES].sort((a, b) => (progress[b.id] || 0) - (progress[a.id] || 0));

  const toggleMuscle = (id: string) => setSelectedMuscles(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleLogSelected = async () => {
    if (!selectedMuscles.size) return; setIsSubmitting(true);
    for (const id of selectedMuscles) await logWorkout(id);
    setIsSubmitting(false); setSelectedMuscles(new Set()); setShowLogModal(false);
  };

  return (
    <div className="relative h-[calc(100vh-100px)] w-full flex overflow-hidden" style={{ background: 'linear-gradient(135deg, #04060e 0%, #050810 50%, #06050e 100%)' }}>

      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px]" />
      </div>

      {/* ═══ LEFT: Body Map (55%) ═══ */}
      <div className="relative w-[55%] flex flex-col overflow-hidden">

        {/* Toggle row */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-2 z-20">
          {/* Front / Back */}
          <div className="flex p-1 gap-1 rounded-xl border border-white/10" style={{ background: 'rgba(10,12,20,0.7)' }}>
            {(['front', 'back'] as BodySide[]).map(s => (
              <button key={s} onClick={() => setSide(s)}
                className={`px-6 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                  side === s ? 'bg-blue-500 text-white shadow-[0_0_14px_rgba(59,130,246,0.5)]' : 'text-white/30 hover:text-white/60'
                }`}>{s}</button>
            ))}
          </div>
          {/* Config */}
          <button onClick={() => setIsConfigMode(!isConfigMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-wider transition-all ${
              isConfigMode ? 'bg-blue-500/15 border-blue-500/40 text-blue-400' : 'bg-black/30 border-white/10 text-white/30 hover:text-white/60'
            }`}>
            <Settings size={11} className={isConfigMode ? 'animate-spin-slow' : ''} />
            {isConfigMode ? 'Exit' : 'Config'}
          </button>
        </div>

        {/* ── COOL LOG BUTTON ── */}
        <div className="absolute bottom-8 right-8 z-30 group">
          <button onClick={() => setShowLogModal(true)}
            className="relative px-6 py-3.5 rounded-[20px] bg-blue-600 text-white font-black uppercase tracking-[0.2em] italic overflow-hidden transition-all hover:scale-[1.05] active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_50px_rgba(37,99,235,0.6)] group border border-white/20">
            {/* Pulsing Aura */}
            <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-20 animate-pulse transition-opacity" />
            {/* Animated Glow / Scanline */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
            
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md group-hover:bg-blue-400/20 transition-all duration-300">
                <Dumbbell size={18} className="group-hover:rotate-[25deg] transition-transform duration-500" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[11px] leading-none tracking-[0.05em] text-white">Log Session</span>
                <span className="text-[6px] text-blue-200/50 tracking-[0.3em] mt-1 not-italic font-black uppercase group-hover:text-blue-200 transition-colors">Physical Evolution</span>
              </div>
            </div>
          </button>
        </div>

        {/* Watermark — Deep Background */}
        <div className="absolute bottom-10 left-10 z-0 pointer-events-none select-none text-left opacity-[0.07]">
          <div className="text-[10px] font-black uppercase tracking-[0.8em] text-blue-400 mb-2">Physical Evolution</div>
          <div className="font-black italic uppercase leading-[0.8] text-white" style={{ fontSize: 'clamp(60px, 8vw, 100px)' }}>
            Daily<br />Gym<br />Progress
          </div>
        </div>

        {/* Tech Corner Specs — Background Decor */}
        <div className="absolute top-24 left-10 z-0 pointer-events-none opacity-[0.15] select-none">
          <div className="text-[8px] font-black uppercase tracking-[0.5em] text-blue-400 mb-1">Biometric Spec</div>
          <div className="font-mono text-[10px] text-white leading-tight">
            SCAN_ID: PRM_772<br />
            FREQ: 44.1 KHZ<br />
            SYNC: STABLE
          </div>
        </div>
        <div className="absolute top-24 right-10 z-0 pointer-events-none opacity-[0.15] select-none text-right">
          <div className="text-[8px] font-black uppercase tracking-[0.5em] text-blue-400 mb-1">Evolution Index</div>
          <div className="font-mono text-[10px] text-white leading-tight">
            DRIVE: OPTIMAL<br />
            RANK: S-CLASS<br />
            POTENTIAL: 99.8%
          </div>
        </div>
        <div className="absolute bottom-40 right-10 z-0 pointer-events-none opacity-[0.15] select-none text-right">
          <div className="text-[8px] font-black uppercase tracking-[0.5em] text-blue-400 mb-1">Muscle Density</div>
          <div className="font-mono text-[10px] text-white leading-tight">
            FIBER_GEN: ACTIVE<br />
            HYPERTROPHY: ENABLED<br />
            STRENGTH: ++
          </div>
        </div>

        {/* Map */}
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              <motion.div key={side} className="absolute inset-0"
                initial={{ opacity: 0, x: side === 'front' ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: side === 'front' ? 16 : -16 }}
                transition={{ type: 'spring', damping: 28, stiffness: 180 }}>
                <MuscleMap side={side} userProgress={progress} onMuscleClick={setSelectedMuscle}
                  selectedMuscleId={selectedMuscle?.id} showIndices={isConfigMode} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="shrink-0 flex items-center justify-center gap-6 py-3">
          {[['bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.7)]', 'Active'], ['bg-white/15', 'Dormant']].map(([cls, label]) => (
            <span key={label} className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-white/25">
              <span className={`w-1.5 h-1.5 rounded-full ${cls}`} />{label}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ RIGHT: Stats Sidebar ═══ */}
      <div className="relative z-10 w-[45%] shrink-0 flex flex-col gap-3 border-l border-white/[0.05] px-5 py-5 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(8,10,22,0.95) 0%, rgba(6,8,18,0.98) 100%)', backdropFilter: 'blur(20px)' }}>

        {/* XP + Level merged card */}
        <div className="shrink-0 rounded-2xl border border-white/[0.07] p-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(8,10,22,0.6) 100%)' }}>
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider"
              style={{ backgroundColor: `${avgLevel.color}22`, color: avgLevel.color, border: `1px solid ${avgLevel.color}40` }}>
              {avgLevel.name}
            </span>
          </div>
          <div className="text-[8px] font-black uppercase tracking-[0.5em] text-blue-400 flex items-center gap-2 mb-2">
            <Zap size={10} className="fill-blue-400" /> Total Evolution XP
          </div>
          <div className="text-5xl font-black italic tracking-tighter leading-none mb-4 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            {totalXp.toLocaleString()}
          </div>
          <div className="h-[3px] w-full bg-white/[0.06] rounded-full overflow-hidden mb-1.5">
            <motion.div className="h-full rounded-full" animate={{ width: `${avgPct}%` }}
              style={{ backgroundColor: avgLevel.color, boxShadow: `0 0 10px ${avgLevel.color}80` }} />
          </div>
          <div className="flex justify-between">
            <span className="text-[7px] text-white/20 font-bold uppercase tracking-wider">{avgLevel.name}</span>
            {avgNextLevel && <span className="text-[7px] text-white/20 font-bold uppercase tracking-wider">{avgNextLevel.name}</span>}
          </div>
        </div>

        {/* Today's Session + Next Milestone */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={11} className="text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
              <span className="text-[7px] font-black uppercase tracking-[0.4em] text-emerald-400/90">Daily Log</span>
            </div>
            {todayMuscles.length === 0
              ? <p className="text-[9px] text-white/20 italic">Nothing logged yet</p>
              : <div className="flex flex-wrap gap-1">
                  {todayMuscles.map(m => {
                    const lvl = getLevel(progress[m.id] || 0);
                    return <button key={m.id} onClick={() => setSelectedMuscle(m)}
                      className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider border hover:scale-105 transition-transform"
                      style={{ borderColor: `${lvl.color}40`, color: lvl.color, background: `${lvl.color}15` }}>{m.label}</button>;
                  })}
                </div>}
          </div>

          <div className="p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            {closestUp ? (
              <>
                <div className="flex items-center gap-1.5 mb-2">
                  <Target size={9} className="text-amber-400" />
                  <span className="text-[6px] font-black uppercase tracking-[0.3em] text-white/40">Next Level</span>
                </div>
                <button onClick={() => setSelectedMuscle(closestUp)} className="w-full text-left">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[9px] font-black truncate">{closestUp.label}</span>
                    <span className="text-[8px] ml-1 shrink-0" style={{ color: getLevel(progress[closestUp.id] || 0).color }}>{Math.round(getPct(progress[closestUp.id] || 0))}%</span>
                  </div>
                  <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" animate={{ width: `${getPct(progress[closestUp.id] || 0)}%` }}
                      style={{ backgroundColor: getLevel(progress[closestUp.id] || 0).color }} />
                  </div>
                  <div className="text-[7px] text-white/20 mt-1">{(() => { const lvl = getLevel(progress[closestUp.id]||0); return lvl.max ? `${lvl.max - (progress[closestUp.id]||0)} XP left` : 'Max!'; })()}</div>
                </button>
              </>
            ) : (
              <p className="text-[9px] text-white/20 italic pt-2">Log to see milestones</p>
            )}
          </div>
        </div>

        {/* Muscles list */}
        <div className="flex-1 min-h-0 rounded-2xl border border-white/[0.06] bg-white/[0.015] flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40 italic">Muscle Matrix</span>
            <span className="text-[7px] text-white/20 font-bold uppercase tracking-widest">{activeMuscles.length} / {ALL_MUSCLES.length} ACTIVE</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {sorted.map((m, i) => {
              const xp = progress[m.id] || 0;
              const lvl = getLevel(xp);
              const lt = lastTrained[m.id];
              const isSel = m.id === selectedMuscle?.id;
              const today = lt && isToday(lt);
              return (
                <motion.button key={m.id} onClick={() => setSelectedMuscle(m)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.008 }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all group ${isSel ? 'bg-blue-500/10' : 'hover:bg-white/[0.02]'}`}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: xp > 0 ? lvl.color : '#202030', boxShadow: xp > 0 ? `0 0 8px ${lvl.color}60` : 'none' }} />
                  <div className="w-24 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold truncate transition-colors ${isSel ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}>{m.label}</span>
                      {today && <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
                    </div>
                    <div className="text-[7px] font-black uppercase tracking-wider mt-0.5" style={{ color: xp > 0 ? lvl.color : '#252530' }}>{lvl.name}</div>
                  </div>
                  <div className="flex-1">
                    <div className="h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${getPct(xp)}%` }} transition={{ duration: 0.6, delay: i * 0.008 }}
                        style={{ backgroundColor: xp > 0 ? lvl.color : 'transparent' }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-20">
                    <div className="text-[10px] font-black tabular-nums" style={{ color: xp > 0 ? lvl.color : '#252530' }}>{xp > 0 ? `${xp.toLocaleString()} XP` : '—'}</div>
                    {lt && <div className="text-[6px] text-white/20 flex items-center gap-0.5 justify-end mt-0.5 uppercase tracking-tighter"><Clock size={5}/>{relTime(lt)}</div>}
                  </div>
                  <ChevronRight size={10} className={`shrink-0 transition-all ${isSel ? 'opacity-60 text-blue-400 translate-x-0.5' : 'opacity-0 group-hover:opacity-20 translate-x-0'}`} />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Side panel */}
      <AnimatePresence>
        {selectedMuscle && (
          <MuscleSidePanel 
            muscle={selectedMuscle} 
            xp={progress[selectedMuscle.id] || 0}
            lastTrainedAt={lastTrained[selectedMuscle.id]}
            onClose={() => setSelectedMuscle(null)} 
            onLogWorkout={logWorkout} 
            isLogging={isLogging} 
          />
        )}
      </AnimatePresence>

      {/* Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => { setShowLogModal(false); setSelectedMuscles(new Set()); }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#0a0a0f] border border-white/10 rounded-3xl w-full max-w-lg mx-4 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2 text-blue-400 mb-0.5"><Dumbbell size={13}/><span className="text-[9px] font-black uppercase tracking-[0.3em]">Log Workout</span></div>
                  <h2 className="text-xl font-black italic tracking-tighter uppercase">What did you train?</h2>
                </div>
                <button onClick={() => { setShowLogModal(false); setSelectedMuscles(new Set()); }}
                  className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="p-5 max-h-[420px] overflow-y-auto space-y-4">
                {[{ label: 'Front Body', muscles: FRONT_MUSCLES }, { label: 'Back Body', muscles: BACK_MUSCLES }].map(sec => (
                  <div key={sec.label}>
                    <div className="text-[8px] font-black uppercase tracking-widest text-white/25 mb-2">{sec.label}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {sec.muscles.filter(m => m.indices.length > 0).map(m => {
                        const isSel = selectedMuscles.has(m.id);
                        const xp = progress[m.id] || 0;
                        const lt = lastTrained[m.id];
                        const trainedToday = lt && isToday(lt);
                        const lvl = getLevel(xp);
                        return (
                          <button key={m.id} 
                            onClick={() => toggleMuscle(m.id)}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                              isSel ? 'bg-blue-500/15 border-blue-500/50' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                            }`}>
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all ${
                              isSel ? 'bg-blue-500' : 'bg-white/10 border border-white/10'
                            }`}>
                              {isSel && <Check size={10} className="text-white" />}
                              {trainedToday && !isSel && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-bold text-white truncate">{m.label}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: lvl.color }} />
                                <span className="text-[7px] font-bold uppercase" style={{ color: lvl.color }}>{lvl.name} {trainedToday && '(Trained Today)'}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 border-t border-white/5 space-y-2">
                <button onClick={handleLogSelected} disabled={!selectedMuscles.size || isSubmitting}
                  className={`w-full p-3.5 rounded-2xl font-black uppercase tracking-tight flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] ${selectedMuscles.size ? 'bg-white text-black hover:bg-blue-400 hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                  <Zap size={16} className="fill-current" />
                  {isSubmitting ? 'Logging...' : selectedMuscles.size > 0 ? `Log ${selectedMuscles.size} Group${selectedMuscles.size > 1 ? 's' : ''} (+${selectedMuscles.size * XP_GAIN_PER_SESSION} XP)` : 'Select muscles to log'}
                </button>
                <p className="text-center text-[7px] font-bold uppercase tracking-widest text-white/15">+{XP_GAIN_PER_SESSION} XP per muscle group</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
