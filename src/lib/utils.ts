type ClassValue = string | number | boolean | null | undefined | ClassValue[] | Record<string, unknown>

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter(Boolean)
    .map(i => (typeof i === 'object' ? Object.entries(i as Record<string, unknown>).filter(([, v]) => v).map(([k]) => k).join(' ') : String(i)))
    .join(' ')
    .trim()
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatPoints(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function getProgressPercent(current: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(100, Math.round((current / max) * 100))
}

export function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Start today'
  if (streak < 3) return 'Building...'
  if (streak < 7) return 'Keep going'
  if (streak < 14) return 'On fire!'
  if (streak < 30) return 'Unstoppable'
  return 'Legendary'
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export function spawnFloatingText(
  text: string,
  x: number,
  y: number,
  type: 'damage' | 'points'
) {
  const el = document.createElement('div')
  el.className = `floating-text ${type}`
  el.textContent = text
  el.style.left = `${x}px`
  el.style.top = `${y}px`
  document.body.appendChild(el)
  el.addEventListener('animationend', () => el.remove())
}

export function getWeaponDamage(
  weapon: { damage_min: number; damage_max: number },
  special?: string
): { damage: number; isCrit: boolean } {
  const base = Math.floor(Math.random() * (weapon.damage_max - weapon.damage_min + 1)) + weapon.damage_min
  const isCrit = special?.toLowerCase().includes('crit')
    ? Math.random() < 0.3
    : Math.random() < 0.1
  return { damage: isCrit ? Math.floor(base * 1.8) : base, isCrit }
}
