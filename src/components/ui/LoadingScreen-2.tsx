import { Zap } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[var(--surface-0)] flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: 'linear-gradient(135deg, #5548f5, #8b85ff)' }}>
          <Zap size={32} className="text-white" />
        </div>
        <p className="font-display text-[#dddaff] text-lg tracking-widest">LOADING</p>
        <div className="flex gap-1 justify-center">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#5548f5] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
