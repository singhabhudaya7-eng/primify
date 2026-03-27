import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AuthPage from '@/pages/AuthPage'
import DashboardPage from '@/pages/DashboardPage'
import GoalsPage from '@/pages/GoalsPage'
import HabitsPage from '@/pages/HabitsPage'
import DragonPage from '@/pages/DragonPage'
import ShopPage from '@/pages/ShopPage'
import RewardsPage from '@/pages/RewardsPage'
import Layout from '@/components/ui/Layout'
import LoadingScreen from '@/components/ui/LoadingScreen'

const missingEnv = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { isInitialized } = useAuth()

  // Show a clear error instead of a forever-loading screen when env vars are missing
  if (missingEnv) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', background: '#0f0f0f',
        color: '#fff', fontFamily: 'monospace', gap: '16px', padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px' }}>⚡</div>
        <h2 style={{ color: '#a78bfa', margin: 0 }}>Missing Supabase Config</h2>
        <p style={{ color: '#aaa', maxWidth: '400px', lineHeight: 1.6 }}>
          Create a <code style={{ color: '#f9a8d4' }}>.env</code> file in the project root with:
        </p>
        <pre style={{
          background: '#1a1a2e', padding: '16px', borderRadius: '8px',
          color: '#7dd3fc', textAlign: 'left', fontSize: '13px'
        }}>
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        <p style={{ color: '#666', fontSize: '13px' }}>
          Then restart the dev server with <code style={{ color: '#f9a8d4' }}>npm run dev</code>
        </p>
      </div>
    )
  }

  // Only show loading while initialization is in progress
  if (!isInitialized) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="dragon" element={<DragonPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="rewards" element={<RewardsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
