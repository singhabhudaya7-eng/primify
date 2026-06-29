import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Zap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const { signIn, signUp, resetPasswordForEmail, updatePassword } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const inviteName = searchParams.get('invite')
  const modeParam = searchParams.get('mode')
  const initialMode = modeParam === 'reset' ? 'reset' : (inviteName ? 'signup' : 'login')

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else if (mode === 'signup') {
        if (!username.trim()) { toast.error('Username required'); return }
        await signUp(email, password, username)
        toast.success('Account created! Check your email to confirm.')
      } else if (mode === 'forgot') {
        if (!email.trim()) { toast.error('Email required'); return }
        await resetPasswordForEmail(email)
        toast.success('Password reset email sent! Check your inbox.')
        setMode('login')
      } else if (mode === 'reset') {
        if (!password.trim() || password.length < 6) { toast.error('Password must be at least 6 characters'); return }
        await updatePassword(password)
        toast.success('Password updated successfully! Logging you in...')
        setSearchParams({})
        navigate('/dashboard', { replace: true })
      }
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #5548f5 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8"
        style={{ background: 'radial-gradient(circle, #ff5c0a 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 glow-void"
            style={{ background: 'linear-gradient(135deg, #5548f5, #8b85ff)' }}>
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#dddaff] text-glow-void">PrimeOS</h1>
          <p className="text-[#888] mt-1 text-sm">Turn discipline into power</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-6">
          {/* Invite Welcome */}
          {inviteName && (
            <div className="mb-6 p-3 rounded-xl bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.2)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[rgba(108,99,255,0.2)] flex items-center justify-center shrink-0">
                <User size={20} className="text-[#b9b5ff]" />
              </div>
              <div>
                <p className="text-[10px] text-[#6c63ff] font-black uppercase tracking-widest leading-none mb-1">Squad Invitation</p>
                <p className="text-xs text-[#dddaff]">You've been invited by <span className="font-bold text-[#b9b5ff]">{inviteName}</span></p>
              </div>
            </div>
          )}

          {/* Heading for forgot / reset modes */}
          {(mode === 'forgot' || mode === 'reset') && (
            <h2 className="text-center font-display text-xl font-bold text-[#dddaff] mb-6">
              {mode === 'forgot' ? 'Reset Password' : 'Set New Password'}
            </h2>
          )}

          {/* Tab toggle */}
          {mode !== 'forgot' && mode !== 'reset' && (
            <div className="flex bg-[rgba(255,255,255,0.04)] rounded-xl p-1 mb-6">
              {(['login', 'signup'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    mode === m
                      ? 'bg-[rgba(108,99,255,0.25)] text-[#b9b5ff]'
                      : 'text-[#666] hover:text-[#999]'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-field pl-10"
                  required={mode === 'signup'}
                />
              </div>
            )}

            {mode !== 'reset' && (
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10"
                  required
                />
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'reset' ? 'New Password' : 'Password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-[#6c63ff] hover:text-[#b9b5ff] transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 
               mode === 'login' ? 'Enter the Arena' : 
               mode === 'signup' ? 'Begin Your Journey' :
               mode === 'forgot' ? 'Send Reset Link' : 'Update Password'}
            </button>

            {(mode === 'forgot' || mode === 'reset') && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-[#666] hover:text-[#999] transition-colors block mx-auto mt-2"
              >
                Back to Sign In
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-[#444] mt-4">
          Your data is encrypted and synced across all devices.
        </p>
      </div>
    </div>
  )
}
