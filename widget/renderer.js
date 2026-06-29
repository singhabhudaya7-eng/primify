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
const timerDisplay = $('timer-display')
const timerCircle = $('timer-circle')
const timerKnob = $('timer-knob')
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

function positionKnob(fraction) {
  const size = timerCircle.clientWidth
  if (!size) return
  const center = size / 2
  const radius = center * 0.9
  const angle = fraction * 2 * Math.PI
  timerKnob.style.left = `${center + radius * Math.sin(angle)}px`
  timerKnob.style.top = `${center - radius * Math.cos(angle)}px`
}

function renderTimer() {
  const targetSeconds = timerTargetSeconds()
  const remaining = Math.max(0, targetSeconds - elapsedSeconds)
  const reached = elapsedSeconds >= targetSeconds && targetSeconds > 0
  const locked = running || elapsedSeconds > 0

  timerDisplay.textContent = formatMMSS(remaining)
  timerDisplay.classList.toggle('reached', reached)

  let fraction
  if (locked) {
    fraction = targetSeconds > 0 ? Math.min(1, elapsedSeconds / targetSeconds) : 0
  } else {
    fraction = (targetMinutes - 1) / (120 - 1)
  }
  timerRingProgress.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - fraction))

  if (locked) {
    const hue = Math.round(fraction * 120) // 0 = red, 120 = green
    timerRingProgress.style.stroke = `hsl(${hue}, 75%, 58%)`
    timerDisplay.style.color = reached ? 'hsl(120, 75%, 58%)' : ''
  } else {
    timerRingProgress.style.stroke = '#8b85ff'
    timerDisplay.style.color = ''
  }

  timerCircle.classList.toggle('editable', !locked)
  positionKnob(fraction)

  timerTaskInput.disabled = locked
  timerResetBtn.disabled = elapsedSeconds === 0 && !running

  timerStartPauseBtn.textContent = running ? '⏸' : '▶'
  timerStartPauseBtn.title = running ? 'Pause' : elapsedSeconds > 0 ? 'Resume' : 'Start'

  if (!locked) timerStatus.textContent = 'Drag the ring to set duration'
  else timerStatus.textContent = !reached ? currentQuote : ''
}

const QUOTE_ROTATE_SECONDS = 15

function pickNewQuote() {
  if (FOCUS_QUOTES.length <= 1) { currentQuote = FOCUS_QUOTES[0] ?? ''; return }
  let next = FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]
  while (next === currentQuote) {
    next = FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]
  }
  currentQuote = next
}

// Drag anywhere on the ring (while idle) to set the duration — the ring
// doubles as both the duration dial and the progress indicator.
//
// We track the *relative* angle moved since pointerdown rather than mapping
// the pointer's absolute angle straight to a value. An absolute mapping puts
// 1 min and 120 min next to each other at the top of the circle, so a tiny
// move across that seam teleports the value from one end to the other.
// Relative dragging has no seam — minutes change smoothly with the angle
// you actually drag through, and clamping at 1/120 means it just stops
// instead of wrapping.
function pointerPolar(clientX, clientY) {
  const rect = timerCircle.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = clientX - cx
  const dy = clientY - cy
  let deg = Math.atan2(dx, -dy) * (180 / Math.PI)
  if (deg < 0) deg += 360
  const radius = Math.sqrt(dx * dx + dy * dy)
  const minRadius = Math.min(rect.width, rect.height) / 2 * 0.3
  return { deg, tooClose: radius < minRadius }
}

let draggingDuration = false
let lastDragAngle = 0
let dragMinutesFloat = 25

timerCircle.addEventListener('pointerdown', (e) => {
  if (running || elapsedSeconds > 0) return
  draggingDuration = true
  lastDragAngle = pointerPolar(e.clientX, e.clientY).deg
  dragMinutesFloat = targetMinutes
  e.preventDefault()
})

window.addEventListener('pointermove', (e) => {
  if (!draggingDuration) return
  const polar = pointerPolar(e.clientX, e.clientY)
  // Angle is wildly sensitive near the center of the dial (a tiny pixel move
  // there swings the angle by a huge amount). If the cursor drifts off the
  // ring toward the middle mid-drag, just ignore that sample instead of
  // letting a spurious angle reading snap the value to 1 or 120.
  if (polar.tooClose) return

  // Delta is computed against the *previous* sample, not the angle from
  // pointerdown — accumulating step-by-step like this means each delta is
  // always small, so it never needs the >180 wrap correction. (Computing
  // against a fixed start angle broke once you'd dragged past 180 total:
  // the wrap-normalization flipped sign and started subtracting, which is
  // why pushing toward the high end of the dial snapped back down.)
  let delta = polar.deg - lastDragAngle
  if (delta > 180) delta -= 360
  if (delta <= -180) delta += 360
  lastDragAngle = polar.deg

  dragMinutesFloat = Math.min(120, Math.max(1, dragMinutesFloat + (delta / 360) * (120 - 1)))
  targetMinutes = Math.round(dragMinutesFloat)
  renderTimer()
})

window.addEventListener('pointerup', () => { draggingDuration = false })

// The knob's pixel position depends on #timer-circle's actual rendered size.
// On first load that size can read 0 (layout not settled yet), which put the
// knob at the container's top-left corner instead of on the ring. A
// ResizeObserver fires as soon as the element has real dimensions, and again
// any time the widget window is resized, so the knob stays correctly placed.
new ResizeObserver(() => renderTimer()).observe(timerCircle)

function startTimerInterval() {
  if (timerIntervalId) return
  timerIntervalId = setInterval(() => {
    elapsedSeconds += 1
    if (elapsedSeconds % QUOTE_ROTATE_SECONDS === 0) pickNewQuote()
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
