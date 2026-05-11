import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Trophy, Dumbbell, CheckSquare, TrendingUp, Medal, Share, Check } from 'lucide-react';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'gym' | 'goals'>('gym');
  const [copied, setCopied] = useState(false);
  const { entries, loading } = useLeaderboard();

  const sorted = [...entries].sort((a, b) =>
    tab === 'gym' ? b.gymXp - a.gymXp : b.goalsXp - a.goalsXp
  );

  const topThree = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const currentUserRank = sorted.findIndex(e => e.isCurrentUser) + 1;
  const currentUser = sorted.find(e => e.isCurrentUser);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#6c63ff] mb-1">
            <Trophy size={13} />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">Rankings</span>
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-[#dddaff]">
            Leaderboard
          </h1>
          <p className="text-[11px] text-[#555] mt-1">How do you stack up against your crew?</p>
        </div>

        {/* Action & Your rank badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="group flex items-center gap-2 px-5 py-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-all"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="flex items-center gap-2 text-green-400">
                  <Check size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Copied!</span>
                </motion.div>
              ) : (
                <motion.div key="share" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="flex items-center gap-2 text-[#888] group-hover:text-[#aaa]">
                  <Share size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Invite Squad</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {currentUser && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-right px-5 py-3 rounded-2xl border border-[rgba(108,99,255,0.25)] bg-[rgba(108,99,255,0.08)] shadow-[0_0_20px_rgba(108,99,255,0.1)]">
              <div className="text-[8px] font-black uppercase tracking-[0.35em] text-[#6c63ff] mb-1">Your Rank</div>
              <div className="text-3xl font-black italic text-[#b9b5ff] leading-none">#{currentUserRank}</div>
              <div className="text-[9px] text-[#555] mt-1 font-mono uppercase tracking-widest">
                {tab === 'gym' ? currentUser.gymXp : currentUser.goalsXp} XP
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Toggle */}
      <div className="flex p-1 gap-1 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] w-fit">
        <button onClick={() => setTab('gym')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
            tab === 'gym'
              ? 'bg-[rgba(85,72,245,0.3)] text-[#b9b5ff] shadow-[0_0_20px_rgba(85,72,245,0.2)]'
              : 'text-[#444] hover:text-[#777]'
          }`}>
          <Dumbbell size={12} /> Gym XP
        </button>
        <button onClick={() => setTab('goals')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
            tab === 'goals'
              ? 'bg-[rgba(168,85,247,0.25)] text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
              : 'text-[#444] hover:text-[#777]'
          }`}>
          <CheckSquare size={12} /> Habits XP
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-[#333] text-sm">Loading...</div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {/* Reorder: 2nd, 1st, 3rd */}
              {[topThree[1], topThree[0], topThree[2]].map((entry, podiumIdx) => {
                if (!entry) return <div key={podiumIdx} />;
                const actualRank = topThree.indexOf(entry);
                const xp = tab === 'gym' ? entry.gymXp : entry.goalsXp;
                const heights = ['h-28', 'h-36', 'h-24'];
                const podiumHeights = ['pt-8', 'pt-2', 'pt-12'];
                return (
                  <motion.div key={entry.userId}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: podiumIdx * 0.1 }}
                    className={`flex flex-col items-center justify-end ${podiumHeights[podiumIdx]}`}>
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-2 mb-3">
                      <div className="text-2xl">{MEDALS[actualRank]}</div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border-2"
                        style={entry.isCurrentUser
                          ? { background: 'linear-gradient(135deg,#5548f5,#8b85ff)', color: '#fff', borderColor: '#8b85ff' }
                          : { background: `${MEDAL_COLORS[actualRank]}18`, color: MEDAL_COLORS[actualRank], borderColor: `${MEDAL_COLORS[actualRank]}60` }}>
                        {entry.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <span className="text-[10px] font-black text-[#dddaff] truncate max-w-[80px]">{entry.username}</span>
                          {entry.isCurrentUser && <span className="text-[6px] font-black text-[#8b85ff]">YOU</span>}
                        </div>
                        <div className="text-[9px] font-black" style={{ color: MEDAL_COLORS[actualRank] }}>
                          {xp.toLocaleString()} XP
                        </div>
                      </div>
                    </div>
                    {/* Podium block */}
                    <div className={`w-full ${heights[podiumIdx]} rounded-t-2xl flex items-start justify-center pt-3 border-t border-x`}
                      style={{
                        background: `linear-gradient(180deg, ${MEDAL_COLORS[actualRank]}18 0%, ${MEDAL_COLORS[actualRank]}06 100%)`,
                        borderColor: `${MEDAL_COLORS[actualRank]}30`,
                      }}>
                      <span className="text-[11px] font-black text-[#333]">#{actualRank + 1}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Rest of the list */}
          {rest.length > 0 && (
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)] flex items-center gap-2">
                <TrendingUp size={11} className="text-[#555]" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#444]">Full Rankings</span>
              </div>
              <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                {rest.map((entry, i) => {
                  const rank = i + 4;
                  const xp = tab === 'gym' ? entry.gymXp : entry.goalsXp;
                  return (
                    <motion.div key={entry.userId}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-center gap-4 px-4 py-3 transition-all ${
                        entry.isCurrentUser ? 'bg-[rgba(108,99,255,0.08)]' : 'hover:bg-[rgba(255,255,255,0.02)]'
                      }`}>
                      <span className="text-[11px] font-black text-[#333] w-6 text-center shrink-0">#{rank}</span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                        style={entry.isCurrentUser
                          ? { background: 'linear-gradient(135deg,#5548f5,#8b85ff)', color: '#fff' }
                          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                        {entry.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-bold truncate ${entry.isCurrentUser ? 'text-[#b9b5ff]' : 'text-[#666]'}`}>
                            {entry.username}
                          </span>
                          {entry.isCurrentUser && (
                            <span className="text-[6px] font-black text-[#8b85ff] bg-[rgba(108,99,255,0.15)] px-1 py-0.5 rounded shrink-0">YOU</span>
                          )}
                        </div>
                        <div className="text-[8px] text-[#333]">Level {entry.level}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-black text-[#555]">{xp > 0 ? xp.toLocaleString() : '—'}</div>
                        <div className="text-[7px] text-[#333] uppercase tracking-widest">XP</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {entries.length <= 1 && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-12 text-center py-16 px-8 rounded-3xl border border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.01)]">
              <div className="w-16 h-16 rounded-full bg-[rgba(108,99,255,0.08)] flex items-center justify-center mx-auto mb-4">
                <Trophy size={24} className="text-[#6c63ff] opacity-40" />
              </div>
              <h3 className="text-lg font-black text-[#dddaff] uppercase italic tracking-tighter">Longevity is better with a Crew</h3>
              <p className="text-[11px] text-[#555] mt-2 max-w-[280px] mx-auto leading-relaxed">
                You're currently dominating the board alone. Share your invite link to challenge your squad and see who really has the best discipline.
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="mt-6 px-8 py-3 rounded-2xl bg-[#6c63ff] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(108,99,255,0.3)] hover:scale-105 transition-all"
              >
                Copy Invite Link
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
