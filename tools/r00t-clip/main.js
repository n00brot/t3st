const {
  app, BrowserWindow, ipcMain, clipboard,
  dialog, shell, Tray, Menu, nativeImage,
} = require('electron')
const fs   = require('fs')
const path = require('path')
const os   = require('os')

// ── state ─────────────────────────────────────────────────────────────────────

let win, tray
let pollInterval = null
let lastClip     = ''
let isRunning    = false
let entryCount   = 0

let logPath = path.join(os.homedir(), 'r00t-clip', 'clips.txt')

let settings = {
  timestampEntries: true,
  filterMode: 'all',   // 'all' | 'urls'
  minLength: 1,
  maxLength: 50000,
}

// ── log helpers ───────────────────────────────────────────────────────────────

function ensureLogDir() {
  const dir = path.dirname(logPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function buildEntry(text, label) {
  let entry = ''
  if (settings.timestampEntries) {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19)
    entry += label ? `[${ts}] [${label}]\n` : `[${ts}]\n`
  } else if (label) {
    entry += `[${label}]\n`
  }
  entry += text.trimEnd() + '\n' + '─'.repeat(48) + '\n'
  return entry
}

function writeEntry(text, label) {
  ensureLogDir()
  fs.appendFileSync(logPath, buildEntry(text, label), 'utf8')
}

function matchesFilter(text) {
  if (settings.filterMode === 'urls') return /^https?:\/\//.test(text.trim())
  return true
}

// ── clipboard polling ─────────────────────────────────────────────────────────

function startPolling() {
  lastClip = clipboard.readText()
  pollInterval = setInterval(() => {
    const current = clipboard.readText()
    if (
      current !== lastClip &&
      current.trim().length >= settings.minLength &&
      current.length <= settings.maxLength &&
      matchesFilter(current)
    ) {
      lastClip = current
      writeEntry(current)
      entryCount++
      updateTray()
      win?.webContents.send('new-entry', {
        text:  current,
        time:  new Date().toISOString(),
        count: entryCount,
      })
    }
  }, 500)
  isRunning = true
}

function stopPolling() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
  isRunning = false
}

// ── tray ──────────────────────────────────────────────────────────────────────

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: isRunning ? '■  Stop Capturing' : '▶  Start Capturing',
      click() {
        isRunning ? stopPolling() : startPolling()
        updateTray()
        win?.webContents.send('state-changed', isRunning)
      },
    },
    { type: 'separator' },
    {
      label: 'Show Window',
      click() { win?.show(); win?.focus() },
    },
    { type: 'separator' },
    {
      label: 'Quit r00t Clip',
      click() { app.isQuiting = true; app.quit() },
    },
  ])
}

function updateTray() {
  if (!tray) return
  const status = isRunning ? 'Capturing' : 'Paused'
  tray.setToolTip(`r00t Clip  ·  ${status}  ·  ${entryCount} saved`)
  tray.setContextMenu(buildTrayMenu())
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png')
  const img = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty()

  tray = new Tray(img)
  tray.on('double-click', () => { win?.show(); win?.focus() })
  updateTray()
}

// ── window ────────────────────────────────────────────────────────────────────

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 720,
    resizable: false,
    frame: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'))

  win.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault()
      win.hide()
    }
  })
}

// ── lifecycle ─────────────────────────────────────────────────────────────────

app.isQuiting = false

app.whenReady().then(() => {
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  // intentionally empty — keep running in tray
})

app.on('before-quit', () => {
  app.isQuiting = true
  stopPolling()
})

// ── IPC ───────────────────────────────────────────────────────────────────────

ipcMain.handle('get-state', () => ({
  isRunning,
  logPath,
  settings,
  entryCount,
  openAtStartup: app.getLoginItemSettings().openAtLogin,
}))

ipcMain.handle('toggle', () => {
  isRunning ? stopPolling() : startPolling()
  updateTray()
  return isRunning
})

ipcMain.handle('browse-path', async () => {
  const result = await dialog.showSaveDialog(win, {
    title: 'Choose where to save clips',
    defaultPath: logPath,
    filters: [{ name: 'Text file', extensions: ['txt'] }],
  })
  if (!result.canceled && result.filePath) {
    const wasRunning = isRunning
    stopPolling()
    logPath = result.filePath
    if (wasRunning) startPolling()
  }
  return logPath
})

ipcMain.handle('open-file', () => {
  ensureLogDir()
  if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, '', 'utf8')
  shell.openPath(logPath)
})

ipcMain.handle('open-folder', () => {
  ensureLogDir()
  shell.openPath(path.dirname(logPath))
})

ipcMain.handle('clear-log', () => {
  ensureLogDir()
  fs.writeFileSync(logPath, '', 'utf8')
  entryCount = 0
  updateTray()
})

ipcMain.handle('save-note', (_, text) => {
  if (!text.trim()) return
  writeEntry(text.trim(), 'NOTE')
  entryCount++
  updateTray()
  win?.webContents.send('new-entry', {
    text:  text.trim(),
    time:  new Date().toISOString(),
    count: entryCount,
    label: 'NOTE',
  })
})

ipcMain.handle('update-settings', (_, patch) => {
  settings = { ...settings, ...patch }
})

ipcMain.handle('set-startup', (_, enable) => {
  app.setLoginItemSettings({ openAtLogin: enable })
})

ipcMain.handle('minimize-app', () => win?.minimize())
ipcMain.handle('hide-app',    () => win?.hide())
ipcMain.handle('close-app',   () => { app.isQuiting = true; app.quit() })
