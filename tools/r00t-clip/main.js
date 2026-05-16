const { app, BrowserWindow, ipcMain, clipboard, dialog, shell } = require('electron')
const fs   = require('fs')
const path = require('path')
const os   = require('os')

let win
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

// ── helpers ───────────────────────────────────────────────────────────────────

function ensureLogDir() {
  const dir = path.dirname(logPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function buildEntry(text, label) {
  let entry = ''
  if (settings.timestampEntries) {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19)
    entry += label
      ? `[${ts}] [${label}]\n`
      : `[${ts}]\n`
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

// ── polling ───────────────────────────────────────────────────────────────────

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

// ── window ────────────────────────────────────────────────────────────────────

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 700,
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
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  stopPolling()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ── IPC ───────────────────────────────────────────────────────────────────────

ipcMain.handle('get-state', () => ({ isRunning, logPath, settings, entryCount }))

ipcMain.handle('toggle', () => {
  isRunning ? stopPolling() : startPolling()
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
})

ipcMain.handle('save-note', (_, text) => {
  if (!text.trim()) return
  writeEntry(text.trim(), 'NOTE')
  entryCount++
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

ipcMain.handle('minimize-app', () => win?.minimize())
ipcMain.handle('close-app',   () => app.quit())
