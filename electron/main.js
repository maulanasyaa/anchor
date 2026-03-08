const { app, BrowserWindow, ipcMain, shell, globalShortcut, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const Store = require('electron-store')

// 1. Set App Name programmatically
app.name = 'Anchor'

let mainWindow
let backupInterval
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

  // Disable DevTools in production
  if (!isDev) {
    // Remove default menu (also removes Cmd+Option+I shortcut)
    Menu.setApplicationMenu(null)
    
    // Block devtools from opening programmatically
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

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

// Backup Logic
async function performBackup(data) {
  const settings = store.get('backupSettings')
  if (!settings || !settings.path) return

  if (!fs.existsSync(settings.path)) {
    try {
      fs.mkdirSync(settings.path, { recursive: true })
    } catch (err) {
      console.error('Failed to create backup directory:', err)
      return
    }
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-')
  const filename = `anchor-backup-${timestamp}.json`
  const filePath = path.join(settings.path, filename)

  const backupData = {
    version: app.getVersion(),
    date: new Date().toISOString(),
    links: data.links || [],
    folders: data.folders || []
  }

  try {
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2))
    store.set('lastBackupTime', new Date().toISOString())
    
    // Auto cleanup
    const files = fs.readdirSync(settings.path)
      .filter(f => f.startsWith('anchor-backup-') && f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.statSync(path.join(settings.path, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time)

    if (files.length > settings.maxBackups) {
      const toDelete = files.slice(settings.maxBackups)
      toDelete.forEach(f => {
        try {
          fs.unlinkSync(path.join(settings.path, f.name))
        } catch (e) {
          console.error('Failed to delete old backup:', e)
        }
      })
    }
    return true
  } catch (err) {
    console.error('Backup failed:', err)
    return false
  }
}

function startAutoBackup() {
  stopAutoBackup()
  const settings = store.get('backupSettings')
  if (settings && settings.enabled && settings.path && settings.interval) {
    const intervalMs = parseInt(settings.interval) * 60 * 60 * 1000
    
    backupInterval = setInterval(async () => {
      if (mainWindow) {
        mainWindow.webContents.send('backup:request-data')
      }
    }, intervalMs)
  }
}

function stopAutoBackup() {
  if (backupInterval) {
    clearInterval(backupInterval)
    backupInterval = null
  }
}

app.on('ready', () => {
  createWindow()

  // Initialize backup settings if not exists
  if (!store.get('backupSettings')) {
    store.set('backupSettings', {
      enabled: false,
      path: path.join(app.getPath('userData'), 'backups'),
      interval: 24, // hours
      maxBackups: 10
    })
  }

  startAutoBackup()

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
  stopAutoBackup()
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

// Backup IPC Handlers
ipcMain.handle('backup:choose-folder', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Backup Folder'
  })
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('backup:now', async (event, data) => {
  return await performBackup(data)
})

ipcMain.handle('backup:get-settings', () => {
  return {
    ...store.get('backupSettings'),
    lastBackupTime: store.get('lastBackupTime')
  }
})

ipcMain.handle('backup:save-settings', (event, settings) => {
  store.set('backupSettings', settings)
  if (settings.enabled) {
    startAutoBackup()
  } else {
    stopAutoBackup()
  }
  return true
})

ipcMain.handle('backup:list', async () => {
  const settings = store.get('backupSettings')
  if (!settings || !settings.path || !fs.existsSync(settings.path)) return []
  
  try {
    return fs.readdirSync(settings.path)
      .filter(f => f.startsWith('anchor-backup-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(settings.path, f),
        size: fs.statSync(path.join(settings.path, f)).size,
        time: fs.statSync(path.join(settings.path, f)).mtime
      }))
      .sort((a, b) => b.time - a.time)
  } catch (err) {
    return []
  }
})

// Export IPC Handlers
ipcMain.handle('export:save-file', async (event, { content, filename, filters }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: filters
  })
  if (!result.canceled) {
    fs.writeFileSync(result.filePath, content, 'utf8')
    shell.showItemInFolder(result.filePath)
    return { success: true, path: result.filePath }
  }
  return { success: false }
})

// Import IPC Handlers
ipcMain.handle('import:open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
    title: 'Select Anchor Export File'
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const content = fs.readFileSync(result.filePaths[0], 'utf8')
    try {
      return JSON.parse(content)
    } catch (err) {
      console.error('Failed to parse import file:', err)
      return null
    }
  }
  return null
})

ipcMain.handle('backup:open-folder', async () => {
  const settings = store.get('backupSettings')
  if (settings && settings.path) {
    if (!fs.existsSync(settings.path)) {
      fs.mkdirSync(settings.path, { recursive: true })
    }
    shell.openPath(settings.path)
  }
})
