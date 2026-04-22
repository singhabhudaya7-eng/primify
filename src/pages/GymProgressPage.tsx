import { useState } from 'react';
import { useMuscleProgress } from '@/hooks/useMuscleProgress';
import { MuscleMap } from '@/components/MuscleMap';
import { MuscleSidePanel } from '@/components/MuscleSidePanel';
import { BodySide, MuscleMapping, FRONT_MUSCLES, BACK_MUSCLES, ALL_MUSCLES, XP_GAIN_PER_SESSION } from '@/lib/muscle-logic';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, LayoutGrid, Settings, Dumbbell, Check, X, Zap } from 'lucide-react';

const getLevel = (xp: number) => {
  if (xp >= 5000) return { name: 'Titan', color: '#FF00EA' };
  if (xp >= 2500) return { name: 'Champion', color: '#00F2FF' };
  if (xp >= 1000) return { name: 'Gold', color: '#FFD700' };
  if (xp >= 500) return { name: 'Silver', color: '#C0C0C0' };
  if (xp >= 100) return { name: 'Bronze', color: '#CD7F32' };
  return { name: 'Dormant', color: '#555' };
};

export default function GymProgressPage() {
  const [side, setSide] = useState<BodySide>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleMapping | null>(null);
  const { progress, logWorkout, isLogging } = useMuscleProgress();
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMuscleClick = (muscle: MuscleMapping) => {
    setSelectedMuscle(muscle);
  };

  const toggleMuscleSelection = (muscleId: string) => {
    setSelectedMuscles(prev => {
      const next = new Set(prev);
      if (next.has(muscleId)) next.delete(muscleId);
      else next.add(muscleId);
      return next;
    });
  };

  const handleLogSelected = async () => {
    if (selectedMuscles.size === 0) return;
    setIsSubmitting(true);
    for (const muscleId of selectedMuscles) {
      await logWorkout(muscleId);
    }
    setIsSubmitting(false);
    setSelectedMuscles(new Set());
    setShowLogModal(false);
  };

  return (
    <div className="relative h-[calc(100vh-100px)] w-full flex flex-col overflow-hidden bg-[#050505]">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Header Section */}
      <div className="relative z-10 px-8 py-6 flex items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-blue-400"
          >
            <LayoutGrid size={12} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Physical Evolution</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black italic tracking-tighter uppercase"
          >
            Daily <span className="text-white/20">Gym Progress</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-[10px] font-medium tracking-tight"
          >
            Log your workouts and visualize your growth.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4"
        >
          {/* Log Workout Button */}
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95"
          >
            <Dumbbell size={14} />
            Log Workout
          </button>

          <button
            onClick={() => setIsConfigMode(!isConfigMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${
              isConfigMode 
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:bg-white/10'
            }`}
          >
            <Settings size={14} className={isConfigMode ? 'animate-spin-slow' : ''} />
            {isConfigMode ? 'Exit Config' : 'Configure'}
          </button>

          <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              onClick={() => setSide('front')}
              className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                side === 'front' 
                  ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'text-white/20 hover:text-white/40 hover:bg-white/5'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setSide('back')}
              className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                side === 'back' 
                  ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'text-white/20 hover:text-white/40 hover:bg-white/5'
              }`}
            >
              Back
            </button>
          </div>
        </motion.div>
      </div>

      {/* Main Map Area */}
      <div className="relative flex-1 flex items-center justify-center min-h-[500px]">
        <motion.div
          key={side}
          initial={{ opacity: 0, scale: 0.95, rotateY: side === 'front' ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 1.05, rotateY: side === 'front' ? 10 : -10 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="w-full max-w-2xl aspect-[3/5]"
        >
          <MuscleMap
            side={side}
            userProgress={progress}
            onMuscleClick={handleMuscleClick}
            selectedMuscleId={selectedMuscle?.id}
            showIndices={isConfigMode}
          />
        </motion.div>

        {/* Legend / Quick Stats */}
        <div className="absolute bottom-8 left-8 right-8 flex flex-wrap items-center justify-between gap-8 pointer-events-none">
          <div className="flex gap-6 pointer-events-auto">
            <div className="flex items-center gap-3 group">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Active Tracker</span>
            </div>
            <div className="flex items-center gap-3 group">
              <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:scale-150 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Dormant Zone</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-white/20 pointer-events-auto">
            <Info size={14} />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Hover to inspect · Click to view details</span>
          </div>
        </div>
      </div>

      {/* Side Panel Overlay (view-only, no log button) */}
      <AnimatePresence>
        {selectedMuscle && (
          <MuscleSidePanel
            muscle={selectedMuscle}
            xp={progress[selectedMuscle.id] || 0}
            onClose={() => setSelectedMuscle(null)}
            onLogWorkout={logWorkout}
            isLogging={isLogging}
          />
        )}
      </AnimatePresence>

      {/* Log Workout Modal */}
      <AnimatePresence>
        {showLogModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => { setShowLogModal(false); setSelectedMuscles(new Set()); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-lg mx-4 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Dumbbell size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Log Workout</span>
                  </div>
                  <h2 className="text-xl font-black italic tracking-tighter uppercase">
                    What did you train?
                  </h2>
                </div>
                <button
                  onClick={() => { setShowLogModal(false); setSelectedMuscles(new Set()); }}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Muscle Selection Grid */}
              <div className="p-6 max-h-[400px] overflow-y-auto">
                <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">Front Body</div>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {FRONT_MUSCLES.filter(m => m.indices.length > 0).map(muscle => {
                    const isSelected = selectedMuscles.has(muscle.id);
                    const xp = progress[muscle.id] || 0;
                    const level = getLevel(xp);
                    return (
                      <button
                        key={muscle.id}
                        onClick={() => toggleMuscleSelection(muscle.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left ${
                          isSelected
                            ? 'bg-blue-500/15 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                            : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'bg-blue-500' : 'bg-white/10 border border-white/10'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">{muscle.label}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: level.color }} />
                            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: level.color }}>
                              {level.name}
                            </span>
                            <span className="text-[9px] text-white/20 ml-auto">{xp} XP</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">Back Body</div>
                <div className="grid grid-cols-2 gap-2">
                  {BACK_MUSCLES.filter(m => m.indices.length > 0).map(muscle => {
                    const isSelected = selectedMuscles.has(muscle.id);
                    const xp = progress[muscle.id] || 0;
                    const level = getLevel(xp);
                    return (
                      <button
                        key={muscle.id}
                        onClick={() => toggleMuscleSelection(muscle.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left ${
                          isSelected
                            ? 'bg-blue-500/15 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                            : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'bg-blue-500' : 'bg-white/10 border border-white/10'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">{muscle.label}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: level.color }} />
                            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: level.color }}>
                              {level.name}
                            </span>
                            <span className="text-[9px] text-white/20 ml-auto">{xp} XP</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 space-y-3">
                <button
                  onClick={handleLogSelected}
                  disabled={selectedMuscles.size === 0 || isSubmitting}
                  className={`w-full p-4 rounded-2xl font-black uppercase tracking-tight flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                    selectedMuscles.size > 0
                      ? 'bg-white text-black hover:bg-blue-400 hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  <Zap size={18} className="fill-current" />
                  {isSubmitting
                    ? 'Logging...'
                    : selectedMuscles.size > 0
                      ? `Log ${selectedMuscles.size} Muscle Group${selectedMuscles.size > 1 ? 's' : ''} (+${selectedMuscles.size * XP_GAIN_PER_SESSION} XP)`
                      : 'Select muscles to log'
                  }
                </button>
                <p className="text-center text-[9px] font-bold uppercase tracking-widest text-white/20">
                  +{XP_GAIN_PER_SESSION} XP per muscle group
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Access Sidebar (Desktop) */}
      <div className="hidden xl:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col gap-12 z-20">
        <div className="space-y-4">
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-auto" />
          <div className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-[0.6em] text-white/10">
            Physical Excellence
          </div>
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-auto" />
        </div>
      </div>
    </div>
  );
}
