import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Folder, Calendar, Shield, Trash2, Save, Download, ExternalLink, Check, AlertCircle, RefreshCw } from 'lucide-react'

export default function BackupSettings({ isOpen, onClose, links, folders }) {
  const [settings, setSettings] = useState({
    enabled: false,
    path: '',
    interval: 24,
    maxBackups: 10
  })
  const [lastBackup, setLastBackup] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const loadSettings = async () => {
    const data = await window.electron.backup.getSettings()
    if (data) {
      setSettings({
        enabled: data.enabled,
        path: data.path,
        interval: data.interval,
        maxBackups: data.maxBackups
      })
      setLastBackup(data.lastBackupTime)
    }
  }

  const handleChooseFolder = async () => {
    const path = await window.electron.backup.chooseFolder()
    if (path) {
      setSettings(prev => ({ ...prev, path }))
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    await window.electron.backup.saveSettings(settings)
    setIsSaving(false)
    showMessage('Settings saved successfully', 'success')
  }

  const handleBackupNow = async () => {
    setIsBackingUp(true)
    const success = await window.electron.backup.now({ links, folders })
    setIsBackingUp(false)
    if (success) {
      showMessage('Backup created successfully', 'success')
      const updatedData = await window.electron.backup.getSettings()
      setLastBackup(updatedData.lastBackupTime)
    } else {
      showMessage('Backup failed. Check folder permissions.', 'error')
    }
  }

  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-[500px] h-fit z-[101] overflow-hidden"
          >
            <div className="bg-[#1C1917] border border-[#2E2A27] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#2E2A27] flex items-center justify-between bg-[#211E1B]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#D97757]/10 text-[#D97757]">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h2 className="text-[#E8E3DC] font-bold text-base">Auto Backup</h2>
                    <p className="text-[10px] text-[#6B645C] font-medium uppercase tracking-wider">Keep your data safe</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-[#6B645C] hover:text-[#E8E3DC] hover:bg-[#2E2A27] rounded-lg transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Auto Backup Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#211E1B] border border-[#2E2A27] rounded-xl group transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${settings.enabled ? 'bg-blue-500/10 text-blue-400' : 'bg-[#2E2A27] text-[#4A4440]'}`}>
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#E8E3DC]">Auto Backup</h3>
                      <p className="text-[11px] text-[#6B645C]">Automatically save backups periodically</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${settings.enabled ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-[#2E2A27]'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${settings.enabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {/* Path Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] text-[#6B645C] font-bold uppercase tracking-widest px-1">Backup Location</label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2.5 bg-[#211E1B] border border-[#2E2A27] rounded-xl px-3.5 py-2.5 overflow-hidden group hover:border-[#3D3730] transition-all">
                      <Folder size={14} className="text-[#4A4440] flex-shrink-0" />
                      <span className="text-xs text-[#E8E3DC] truncate font-mono tracking-tight">{settings.path || 'Not selected'}</span>
                    </div>
                    <button
                      onClick={handleChooseFolder}
                      className="px-4 py-2.5 bg-[#242120] border border-[#2E2A27] text-[#E8E3DC] text-xs font-bold rounded-xl hover:bg-[#2E2A27] transition-all flex-shrink-0"
                    >
                      Choose
                    </button>
                  </div>
                  {settings.path && (
                    <button
                      onClick={() => window.electron.backup.openFolder()}
                      className="flex items-center gap-1.5 text-[10px] text-[#6B645C] hover:text-[#D97757] transition-colors px-1 font-medium"
                    >
                      <ExternalLink size={10} />
                      Open backup folder
                    </button>
                  )}
                </div>

                {/* Configuration Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#6B645C] font-bold uppercase tracking-widest px-1">Interval</label>
                    <div className="relative">
                      <select
                        value={settings.interval}
                        onChange={e => setSettings(s => ({ ...s, interval: parseInt(e.target.value) }))}
                        className="w-full bg-[#211E1B] border border-[#2E2A27] rounded-xl px-3.5 py-2.5 text-xs text-[#E8E3DC] outline-none appearance-none hover:border-[#3D3730] transition-all cursor-pointer font-medium"
                      >
                        <option value={1}>Every 1 hour</option>
                        <option value={6}>Every 6 hours</option>
                        <option value={12}>Every 12 hours</option>
                        <option value={24}>Every 24 hours</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#4A4440]">
                        <Calendar size={12} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#6B645C] font-bold uppercase tracking-widest px-1">Keep Max</label>
                    <div className="relative">
                      <select
                        value={settings.maxBackups}
                        onChange={e => setSettings(s => ({ ...s, maxBackups: parseInt(e.target.value) }))}
                        className="w-full bg-[#211E1B] border border-[#2E2A27] rounded-xl px-3.5 py-2.5 text-xs text-[#E8E3DC] outline-none appearance-none hover:border-[#3D3730] transition-all cursor-pointer font-medium"
                      >
                        <option value={3}>3 Backups</option>
                        <option value={5}>5 Backups</option>
                        <option value={10}>10 Backups</option>
                        <option value={20}>20 Backups</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#4A4440]">
                        <Trash2 size={12} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-4 bg-[#211E1B] border border-[#2E2A27] rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#6B645C] font-medium">Last successful backup</span>
                    <span className="text-[#E8E3DC] font-mono">{formatDate(lastBackup)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#2E2A27] bg-[#211E1B] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AnimatePresence mode="wait">
                    {message.text && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={`flex items-center gap-1.5 text-[11px] font-bold ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {message.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
                        {message.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleBackupNow}
                    disabled={isBackingUp || !settings.path}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2E2A27] hover:bg-[#3D3730] text-[#E8E3DC] text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isBackingUp ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                    Backup Now
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-[#D97757] hover:bg-[#C46645] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#D97757]/10 disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
