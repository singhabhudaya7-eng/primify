const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')
const fs = require('fs')

const boundsFile = path.join(app.getPath('userData'), 'widget-bounds.json')

function loadBounds() {
  try {
    return JSON.parse(fs.readFileSync(boundsFile, 'utf-8'))
  } catch {
    return null
  }
}

function saveBounds(bounds) {
  try {
    fs.writeFileSync(boundsFile, JSON.stringify(bounds))
  } catch {
    // ignore — non-critical
  }
}

let win

function createWindow() {
  const saved = loadBounds()
  const { width: screenW } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width: saved?.width ?? 300,
    height: saved?.height ?? 440,
    x: saved?.x ?? screenW - 320,
    y: saved?.y ?? 40,
    minWidth: 220,
    minHeight: 260,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.setAlwaysOnTop(true, 'floating')
  win.loadFile('index.html')

  win.on('move', () => saveBounds(win.getBounds()))
  win.on('resize', () => saveBounds(win.getBounds()))
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => app.quit())

ipcMain.on('widget:close', () => win?.close())
ipcMain.on('widget:toggle-pin', (_e, pinned) => win?.setAlwaysOnTop(pinned, 'floating'))
ipcMain.on('widget:resize-by', (_e, dx, dy) => {
  if (!win) return
  const b = win.getBounds()
  win.setBounds({
    ...b,
    width: Math.max(220, b.width + dx),
    height: Math.max(260, b.height + dy),
  })
})
