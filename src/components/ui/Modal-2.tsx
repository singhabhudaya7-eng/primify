import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export default function Modal({ isOpen, onClose, title, children, className }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom-sheet on mobile, centered on desktop */}
      <div className={cn(
        'relative glass-strong w-full animate-slide-up',
        // Mobile: slides up from bottom, rounded top corners, scrollable
        'rounded-t-2xl max-h-[90dvh] overflow-y-auto p-5',
        // Desktop: centered card with rounded corners
        'md:rounded-2xl md:max-w-md md:p-6 md:max-h-[85vh]',
        className
      )}>
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.15)]" />
        </div>

        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.08)] text-[#666] hover:text-[#ddd] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
