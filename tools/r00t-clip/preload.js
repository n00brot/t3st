const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getState:       ()  => ipcRenderer.invoke('get-state'),
  toggle:         ()  => ipcRenderer.invoke('toggle'),
  browsePath:     ()  => ipcRenderer.invoke('browse-path'),
  openFile:       ()  => ipcRenderer.invoke('open-file'),
  openFolder:     ()  => ipcRenderer.invoke('open-folder'),
  clearLog:       ()  => ipcRenderer.invoke('clear-log'),
  saveNote:       (t) => ipcRenderer.invoke('save-note', t),
  updateSettings: (s) => ipcRenderer.invoke('update-settings', s),
  setStartup:     (e) => ipcRenderer.invoke('set-startup', e),
  minimizeApp:    ()  => ipcRenderer.invoke('minimize-app'),
  hideApp:        ()  => ipcRenderer.invoke('hide-app'),
  closeApp:       ()  => ipcRenderer.invoke('close-app'),
  onNewEntry:     (cb) => ipcRenderer.on('new-entry',     (_, d) => cb(d)),
  onStateChanged: (cb) => ipcRenderer.on('state-changed', (_, d) => cb(d)),
})
