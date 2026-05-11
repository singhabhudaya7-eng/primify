declare const __APP_VERSION__: string

const VERSION_KEY = 'primeos_app_version'

export function detectAndHandleStaleCache(): void {
  try {
    const stored = localStorage.getItem(VERSION_KEY)
    if (stored && stored !== __APP_VERSION__) {
      console.log('[PrimeOS] New version detected — clearing stale cache and re-logging in')
      localStorage.clear()
      sessionStorage.clear()
      // Reload to /auth — no session will be found, user re-logs in cleanly
      window.location.replace('/auth')
      return
    }
    localStorage.setItem(VERSION_KEY, __APP_VERSION__)
  } catch {
    // localStorage unavailable (private mode) — skip silently
  }
}
