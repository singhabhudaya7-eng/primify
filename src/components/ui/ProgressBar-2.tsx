import { cn } from '@/lib/utils'

interface Props {
  value: number
  max?: number
  variant?: 'void' | 'ember' | 'gold' | 'dragon' | 'green'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  showLabel?: boolean
  label?: string
  className?: string
}

const GRADIENTS = {
  void: 'linear-gradient(90deg, #5548f5, #8b85ff)',
  ember: 'linear-gradient(90deg, #e84400, #ff7a28)',
  gold: 'linear-gradient(90deg, #b88800, #ffd933)',
  dragon: 'linear-gradient(90deg, #e60000, #ff4d4d)',
  green: 'linear-gradient(90deg, #3b6d11, #97c459)',
}

const HEIGHTS = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

export default function ProgressBar({
  value,
  max = 100,
  variant = 'void',
  size = 'md',
  animated = true,
  showLabel = false,
  label,
  className,
}: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full space-y-1', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between text-xs text-[#888]">
          {label && <span>{label}</span>}
          {showLabel && <span className="font-mono">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={cn('progress-track', HEIGHTS[size])}>
        <div
          className={cn('h-full rounded-full', animated && 'transition-all duration-700 ease-out')}
          style={{ width: `${pct}%`, background: GRADIENTS[variant] }}
        />
      </div>
    </div>
  )
}
