let isRunning = false

// ── init ──────────────────────────────────────────────────────────────────────

async function init() {
  const state = await api.getState()

  isRunning = state.isRunning
  document.getElementById('log-path').textContent    = state.logPath
  document.getElementById('s-ts').checked            = state.settings.timestampEntries
  document.getElementById('s-filter').value          = state.settings.filterMode
  document.getElementById('s-min').value             = state.settings.minLength
  document.getElementById('s-startup').checked       = state.openAtStartup

  updateUI()
  updateCount(state.entryCount)

  api.onNewEntry(onEntry)
  api.onStateChanged((running) => {
    isRunning = running
    updateUI()
  })
}

// ── toggle ────────────────────────────────────────────────────────────────────

async function handleToggle() {
  isRunning = await api.toggle()
  updateUI()
}

function updateUI() {
  const btn   = document.getElementById('toggle-btn')
  const dot   = document.getElementById('status-dot')
  const txt   = document.getElementById('status-text')
  const icon  = document.getElementById('toggle-icon')
  const label = document.getElementById('toggle-label')

  if (isRunning) {
    btn.classList.add('running')
    dot.classList.add('running')
    txt.textContent   = 'Capturing'
    icon.textContent  = '■'
    label.textContent = 'Stop Capturing'
  } else {
    btn.classList.remove('running')
    dot.classList.remove('running')
    txt.textContent   = 'Paused'
    icon.textContent  = '▶'
    label.textContent = 'Start Capturing'
  }
}

// ── note ──────────────────────────────────────────────────────────────────────

async function saveNote() {
  const input = document.getElementById('note-input')
  const text  = input.value.trim()
  if (!text) return
  await api.saveNote(text)
  input.value = ''
}

// ── feed ──────────────────────────────────────────────────────────────────────

function onEntry(data) {
  updateCount(data.count)

  const feed  = document.getElementById('feed')
  const empty = feed.querySelector('.feed-empty')
  if (empty) empty.remove()

  const item = document.createElement('div')
  item.className = 'feed-item' + (data.label === 'NOTE' ? ' is-note' : '')

  const time    = new Date(data.time).toLocaleTimeString()
  const preview = data.text.length > 88
    ? data.text.slice(0, 88).trimEnd() + '…'
    : data.text

  const labelHtml = data.label
    ? `<span class="feed-item-label">${escHtml(data.label)}</span>`
    : ''

  item.innerHTML =
    `<span class="feed-item-time">${time}${labelHtml}</span>` +
    `<span class="feed-item-text">${escHtml(preview)}</span>`

  feed.prepend(item)
  while (feed.children.length > 12) feed.removeChild(feed.lastChild)
}

// ── clear ─────────────────────────────────────────────────────────────────────

async function clearLog() {
  if (!confirm('Delete everything in the log file?')) return
  await api.clearLog()
  updateCount(0)
  document.getElementById('feed').innerHTML = '<p class="feed-empty">Log cleared.</p>'
}

// ── settings ──────────────────────────────────────────────────────────────────

async function pushSettings() {
  await api.updateSettings({
    timestampEntries: document.getElementById('s-ts').checked,
    filterMode:       document.getElementById('s-filter').value,
    minLength:        Math.max(1, parseInt(document.getElementById('s-min').value) || 1),
  })
}

async function toggleStartup() {
  await api.setStartup(document.getElementById('s-startup').checked)
}

// ── helpers ───────────────────────────────────────────────────────────────────

function updateCount(n) {
  const badge = document.getElementById('count-badge')
  badge.textContent = `${n} saved`
  badge.classList.toggle('active', n > 0)
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

init()
