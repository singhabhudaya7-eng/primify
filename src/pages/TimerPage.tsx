import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Timer as TimerIcon, Zap, Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTimer } from '@/hooks/useTimer'
import { cn } from '@/lib/utils'
import quotes from '../../quotes.json'

const MODE = 'countdown' as const

function pickQuote(): string {
  return quotes[Math.floor(Math.random() * quotes.length)]
}

function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function TimerPage() {
  const { sessions, isLoading, isError, finishSession } = useTimer()

  const [taskName, setTaskName] = useState('')
  const [targetMinutes, setTargetMinutes] = useState(25)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [quote, setQuote] = useState('')

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const goalNotifiedRef = useRef(false)

  const targetSeconds = targetMinutes * 60

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  useEffect(() => {
    if (goalNotifiedRef.current) return
    if (elapsedSeconds >= targetSeconds && targetSeconds > 0) {
      goalNotifiedRef.current = true
      setRunning(false)
      toast.success('⏰ Time\'s up!', { duration: 3000 })
      finishSession.mutateAsync({
        taskName: taskName.trim() || 'Untitled focus session',
        mode: MODE,
        targetSeconds,
        elapsedSeconds: targetSeconds,
      }).then(() => {
        setTaskName('')
        setElapsedSeconds(0)
        setQuote('')
        goalNotifiedRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds, targetSeconds])

  const handleStartPause = useCallback(() => {
    if (!running && !taskName.trim()) {
      toast.error('Give your task a name first')
      return
    }
    if (!running && elapsedSeconds === 0) setQuote(pickQuote())
    setRunning(r => !r)
  }, [running, taskName, elapsedSeconds])

  function handleReset() {
    setRunning(false)
    setElapsedSeconds(0)
    setQuote('')
    goalNotifiedRef.current = false
  }

  const displaySeconds = Math.max(0, targetSeconds - elapsedSeconds)
  const progressPct = targetSeconds > 0 ? Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100)) : 0
  const goalReached = elapsedSeconds >= targetSeconds && targetSeconds > 0
  const locked = running || elapsedSeconds > 0

  const sliderPct = ((targetMinutes - 1) / (120 - 1)) * 100

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <TimerIcon size={22} className="text-[#8b85ff]" />
          Timer
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-0.5">Focus on a task and earn points & energy when you hit your goal</p>
      </div>

      <div className="stat-card space-y-5 shadow-xl shadow-black/30 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8b85ff]/60 to-transparent" />

        {/* Task name */}
        <div>
          <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Task name</label>
          <input
            className="input-field"
            placeholder="e.g. Deep work on report, Read a chapter..."
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            disabled={locked}
          />
        </div>

        {/* Duration slider */}
        {!locked && (
          <div className="p-3.5 rounded-xl bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.22)]">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-[var(--text-secondary)]">Duration</span>
              <span className="font-mono font-bold text-[#cfccff] text-sm">{targetMinutes} min</span>
            </div>
            <input
              type="range" min={1} max={120}
              value={targetMinutes}
              onChange={e => setTargetMinutes(parseInt(e.target.value))}
              className="range-slider"
              style={{
                background: `linear-gradient(to right, #8b85ff 0%, #8b85ff ${sliderPct}%, rgba(255,255,255,0.12) ${sliderPct}%, rgba(255,255,255,0.12) 100%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-2 font-mono">
              <span>1m</span><span>30m</span><span>60m</span><span>90m</span><span>120m</span>
            </div>
          </div>
        )}

        {/* Big timer display */}
        <div className="flex flex-col items-center py-5">
          <div
            className={cn(
              'font-mono text-5xl font-bold tracking-wider transition-colors',
              goalReached ? 'text-[#8b85ff] text-glow-void' : running ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
            )}
          >
            {formatMMSS(displaySeconds)}
          </div>
          {running && (
            <span className="mt-1 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#8b85ff]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8b85ff] animate-pulse" />
              live
            </span>
          )}
          <div className="w-full max-w-xs h-2 rounded-full bg-[rgba(255,255,255,0.1)] mt-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #5548f5, #8b85ff)' }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">{progressPct}% elapsed</p>
          {quote && !goalReached && (
            <p className="text-xs text-[var(--text-secondary)] text-center italic mt-3 px-2">"{quote}"</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button onClick={handleStartPause} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? 'Pause' : elapsedSeconds > 0 ? 'Resume' : 'Start'}
          </button>
          <button onClick={handleReset} disabled={elapsedSeconds === 0 && !running} className="btn-ghost flex items-center justify-center gap-2 px-4 disabled:opacity-40">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Recent sessions</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[var(--border)] animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-amber-400/80 text-sm stat-card">
            Couldn't load timer history — make sure the <code className="text-amber-300">timer_sessions</code> table migration has been run in Supabase.
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No sessions yet — finish your first timer above.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="stat-card flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{s.task_name}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {formatMMSS(s.elapsed_seconds)} / {formatMMSS(s.target_seconds)}
                  </p>
                </div>
                {s.completed ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 badge-gold">
                      <Zap size={10} />
                      <span>{s.points_earned}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono"
                      style={{ background: 'rgba(139,133,255,0.18)', color: '#8b85ff' }}>
                      <Flame size={10} />
                      <span>{s.energy_earned}E</span>
                    </div>
                  </div>
                ) : (
                  <span className="badge-void">incomplete</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
