require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { ipcRenderer } = require('electron')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const $ = (id) => document.getElementById(id)

const loginForm = $('login-form')
const appView = $('app-view')
const loadingEl = $('loading')
const errorEl = $('error')

let currentUserId = null
let currentProfile = null

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function getStreakMultiplier(streak) {
  if (streak >= 7) return 1.5
  if (streak >= 3) return 1.2
  return 1.0
}

function show(el, display = 'flex') { el.style.display = display }
function hide(el) { el.style.display = 'none' }

function setView(view) {
  hide(loginForm); hide(appView); hide(loadingEl); hide(errorEl)
  if (view === 'login') show(loginForm)
  else if (view === 'app') show(appView, 'block')
  else if (view === 'loading') show(loadingEl, 'block')
  else if (view === 'error') show(errorEl, 'block')
}

async function refreshData() {
  setView('loading')
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setView('login'); return }

    const [profileRes, habitsRes, logsRes, streakRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('daily_logs').select('habit_id').eq('user_id', user.id).eq('date', todayStr()),
      supabase.from('streaks').select('current_streak').eq('user_id', user.id).single(),
    ])

    if (profileRes.error) throw profileRes.error
    if (habitsRes.error) throw habitsRes.error

    const profile = profileRes.data
    const habits = habitsRes.data || []
    const completedIds = new Set((logsRes.data || []).map(l => l.habit_id))
    const currentStreak = streakRes.data?.current_streak ?? 0

    renderApp({ profile, habits, completedIds, currentStreak, userId: user.id })
    setView('app')
  } catch (err) {
    console.error(err)
    errorEl.textContent = err.message || 'Failed to load data'
    setView('error')
  }
}

function renderApp({ profile, habits, completedIds, currentStreak, userId }) {
  currentUserId = userId
  currentProfile = profile

  $('points-value').textContent = profile.total_points ?? 0
  const energy = profile.energy_current ?? 0
  $('energy-value').textContent = `${energy}E`
  $('energy-bar-fill').style.width = `${Math.min(100, Math.round((energy / 100) * 100))}%`

  const listEl = $('habits-list')
  listEl.innerHTML = ''

  if (habits.length === 0) {
    show($('empty'), 'block')
    return
  }
  hide($('empty'))

  for (const habit of habits) {
    const done = completedIds.has(habit.id)
    const row = document.createElement('div')
    row.className = `habit-row${done ? ' done' : ''}`
    row.innerHTML = `
      <span class="habit-check">${done ? '✓' : ''}</span>
      <span class="habit-name">${habit.emoji ?? ''} ${escapeHtml(habit.name)}</span>
      <span class="habit-reward">+${habit.points_value}p ⚡${habit.energy_value}</span>
    `
    if (!done) {
      row.addEventListener('click', () => completeHabit(habit, profile, currentStreak, userId))
    }
    listEl.appendChild(row)
  }
}

function escapeHtml(str) {
  const d = document.createElement('div')
  d.textContent = str
  return d.innerHTML
}

async function completeHabit(habit, profile, currentStreak, userId) {
  try {
    const multiplier = getStreakMultiplier(currentStreak)
    const energyEarned = Math.round(habit.energy_value * multiplier)

    const { error: logError } = await supabase.from('daily_logs').insert({
      user_id: userId,
      habit_id: habit.id,
      date: todayStr(),
      points_earned: habit.points_value,
    })
    if (logError) throw logError

    const newTotal = (profile.total_points ?? 0) + habit.points_value
    const newEnergy = (profile.energy_current ?? 0) + energyEarned
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ total_points: newTotal, energy_current: newEnergy })
      .eq('id', userId)
    if (profileError) throw profileError

    await updateStreak(userId, currentStreak)
    await refreshData()
  } catch (err) {
    console.error('Complete habit error:', err)
  }
}

async function updateStreak(userId, currentStreak) {
  try {
    const { data: streakData } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    const today = todayStr()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (streakData?.last_active_date === today) return

    let newStreak = 1
    if (streakData?.last_active_date === yesterdayStr) {
      newStreak = (streakData.current_streak ?? 0) + 1
    }
    const longest = Math.max(streakData?.longest_streak ?? 0, newStreak)

    await supabase.from('streaks').upsert(
      { user_id: userId, current_streak: newStreak, longest_streak: longest, last_active_date: today },
      { onConflict: 'user_id' }
    )
  } catch (err) {
    console.error('Update streak error:', err)
  }
}

$('login-btn').addEventListener('click', async () => {
  const email = $('login-email').value.trim()
  const password = $('login-password').value
  $('login-error').textContent = ''
  if (!email || !password) {
    $('login-error').textContent = 'Enter email and password'
    return
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    $('login-error').textContent = error.message
    return
  }
  await refreshData()
})

$('signout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut()
  setView('login')
})

$('refresh-btn').addEventListener('click', refreshData)
$('close-btn').addEventListener('click', () => ipcRenderer.send('widget:close'))

// Manual resize handle (frameless transparent windows don't always expose OS resize edges)
const grip = $('resize-grip')
let resizing = false
let lastX = 0
let lastY = 0

grip.addEventListener('mousedown', (e) => {
  resizing = true
  lastX = e.screenX
  lastY = e.screenY
  e.preventDefault()
})

window.addEventListener('mousemove', (e) => {
  if (!resizing) return
  const dx = e.screenX - lastX
  const dy = e.screenY - lastY
  lastX = e.screenX
  lastY = e.screenY
  ipcRenderer.send('widget:resize-by', dx, dy)
})

window.addEventListener('mouseup', () => { resizing = false })

// ── Tabs ─────────────────────────────────────────────────────────────────
const tabHabitsBtn = $('tab-habits')
const tabTimerBtn = $('tab-timer')
const habitsPanel = $('habits-panel')
const timerPanel = $('timer-panel')

function selectTab(tab) {
  const isHabits = tab === 'habits'
  tabHabitsBtn.classList.toggle('active', isHabits)
  tabTimerBtn.classList.toggle('active', !isHabits)
  habitsPanel.style.display = isHabits ? 'flex' : 'none'
  timerPanel.style.display = isHabits ? 'none' : 'flex'
}

tabHabitsBtn.addEventListener('click', () => selectTab('habits'))
tabTimerBtn.addEventListener('click', () => selectTab('timer'))
selectTab('habits')

// ── Timer ────────────────────────────────────────────────────────────────
const timerTaskInput = $('timer-task')
const timerSlider = $('timer-slider')
const timerDurationValue = $('timer-duration-value')
const timerDisplay = $('timer-display')
const timerRingProgress = $('timer-ring-progress')
const timerStatus = $('timer-status')

const RING_CIRCUMFERENCE = 2 * Math.PI * 45
const timerStartPauseBtn = $('timer-startpause')
const timerResetBtn = $('timer-reset')

// Shared with the web app's Timer page — edit /quotes.json at the project root
// to change what shows up here too.
const FOCUS_QUOTES = require('../quotes.json')

let targetMinutes = 25
let elapsedSeconds = 0
let running = false
let timerIntervalId = null
let goalNotified = false
let currentQuote = ''

function timerTargetSeconds() { return targetMinutes * 60 }

function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function renderTimer() {
  const targetSeconds = timerTargetSeconds()
  const remaining = Math.max(0, targetSeconds - elapsedSeconds)
  const pct = targetSeconds > 0 ? Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100)) : 0
  const reached = elapsedSeconds >= targetSeconds && targetSeconds > 0

  timerDisplay.textContent = formatMMSS(remaining)
  timerDisplay.classList.toggle('reached', reached)
  timerRingProgress.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - pct / 100))

  const locked = running || elapsedSeconds > 0
  timerTaskInput.disabled = locked
  timerSlider.disabled = locked
  timerResetBtn.disabled = elapsedSeconds === 0 && !running

  timerStartPauseBtn.textContent = running ? '⏸ Pause' : elapsedSeconds > 0 ? '▶ Resume' : '▶ Start'
  timerStatus.textContent = elapsedSeconds > 0 && !reached ? currentQuote : ''
}

function pickNewQuote() {
  currentQuote = FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]
}

timerSlider.addEventListener('input', () => {
  targetMinutes = parseInt(timerSlider.value, 10)
  timerDurationValue.textContent = `${targetMinutes} min`
  renderTimer()
})

function startTimerInterval() {
  if (timerIntervalId) return
  timerIntervalId = setInterval(() => {
    elapsedSeconds += 1
    renderTimer()
    if (!goalNotified && elapsedSeconds >= timerTargetSeconds()) {
      goalNotified = true
      stopTimerInterval()
      running = false
      finishTimerSession()
    }
  }, 1000)
}

function stopTimerInterval() {
  if (timerIntervalId) {
    clearInterval(timerIntervalId)
    timerIntervalId = null
  }
}

timerStartPauseBtn.addEventListener('click', () => {
  if (!running && !timerTaskInput.value.trim()) {
    timerTaskInput.focus()
    return
  }
  if (!running && elapsedSeconds === 0) pickNewQuote()
  running = !running
  if (running) startTimerInterval()
  else stopTimerInterval()
  renderTimer()
})

timerResetBtn.addEventListener('click', () => {
  running = false
  elapsedSeconds = 0
  goalNotified = false
  stopTimerInterval()
  renderTimer()
})

async function finishTimerSession() {
  if (!currentUserId) return
  const targetSeconds = timerTargetSeconds()
  const completed = elapsedSeconds >= targetSeconds
  const taskName = timerTaskInput.value.trim() || 'Untitled focus session'

  const pointsEarned = completed ? Math.max(5, Math.round((targetSeconds / 60) * 2)) : 0
  const energyEarned = completed ? Math.max(2, Math.round((targetSeconds / 60) * 1)) : 0

  try {
    await supabase.from('timer_sessions').insert({
      user_id: currentUserId,
      task_name: taskName,
      mode: 'countdown',
      target_seconds: targetSeconds,
      elapsed_seconds: targetSeconds,
      completed,
      points_earned: pointsEarned,
      energy_earned: energyEarned,
    })

    if (completed && currentProfile) {
      const newTotal = (currentProfile.total_points ?? 0) + pointsEarned
      const newEnergy = (currentProfile.energy_current ?? 0) + energyEarned
      await supabase.from('profiles').update({ total_points: newTotal, energy_current: newEnergy }).eq('id', currentUserId)
    }
  } catch (err) {
    console.error('Finish timer session error:', err)
  }

  timerTaskInput.value = ''
  elapsedSeconds = 0
  goalNotified = false
  renderTimer()
  await refreshData()
}

renderTimer()

refreshData()
setInterval(refreshData, 60000)
