const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
  },
  shell: {
    open: (url) => ipcRenderer.invoke('shell:open', url),
  },
  backup: {
    chooseFolder: () => ipcRenderer.invoke('backup:choose-folder'),
    now: (data) => ipcRenderer.invoke('backup:now', data),
    getSettings: () => ipcRenderer.invoke('backup:get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('backup:save-settings', settings),
    list: () => ipcRenderer.invoke('backup:list'),
    openFolder: () => ipcRenderer.invoke('backup:open-folder'),
  },
  export: {
    saveFile: (data) => ipcRenderer.invoke('export:save-file', data),
  },
  import: {
    openFile: () => ipcRenderer.invoke('import:open-file'),
  },
  onQuickAdd: (callback) => ipcRenderer.on('trigger-quick-add', () => callback()),
  onBackupRequest: (callback) => ipcRenderer.on('backup:request-data', () => callback()),
})
