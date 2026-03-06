const { app, BrowserWindow, ipcMain, shell, globalShortcut } = require('electron')
const path = require('path')
const Store = require('electron-store')

// 1. Set App Name programmatically
app.name = 'Anchor'

let mainWindow
const store = new Store()

// 2. Resolve Icon Paths
const iconPath = path.resolve(app.getAppPath(), 'public', 'anchor.png')

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Custom title bar handled in React
    titleBarStyle: 'hiddenInset',
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const isDev = !app.isPackaged
  mainWindow.loadURL(
    isDev 
      ? 'http://localhost:5173' 
      : `file://${path.join(__dirname, '../dist/index.html')}`
  )

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', () => {
  createWindow()

  // Global Keyboard Shortcut & Quick Add (Keeping this as it wasn't requested for removal)
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('trigger-quick-add')
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

// IPC Handlers
ipcMain.handle('store:get', (event, key) => store.get(key))
ipcMain.handle('store:set', (event, key, value) => store.set(key, value))
ipcMain.handle('store:delete', (event, key) => store.delete(key))
ipcMain.handle('shell:open', (event, url) => shell.openExternal(url))
