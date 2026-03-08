import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Folder, Upload, Check, Minus, CheckSquare, Square, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function ImportModal({ isOpen, onClose, folders, links, onImport, importData }) {
  const [selectedFolderIndices, setSelectedFolderIndices] = useState([])
  const [importMode, setImportMode] = useState('merge') // 'merge' or 'replace'
  const [isSuccess, setIsSuccess] = useState(false)
  const [results, setResults] = useState({ links: 0, folders: 0, skipped: 0 })

  const importedFolders = importData?.folders || []

  useEffect(() => {
    if (isOpen && importData) {
      setSelectedFolderIndices(importedFolders.map((_, i) => i))
      setIsSuccess(false)
    }
  }, [isOpen, importData])

  const toggleFolder = (index) => {
    setSelectedFolderIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const toggleAll = () => {
    if (selectedFolderIndices.length === importedFolders.length) {
      setSelectedFolderIndices([])
    } else {
      setSelectedFolderIndices(importedFolders.map((_, i) => i))
    }
  }

  const handleImport = async () => {
    const selectedFolders = selectedFolderIndices.map(i => importedFolders[i])
    
    let workingFolders = importMode === 'replace' ? [{ id: 'all', name: 'All Links', color: '#5B8AF0' }] : [...folders]
    let workingLinks = importMode === 'replace' ? [] : [...links]
    
    let stats = { links: 0, folders: 0, skipped: 0 }

    selectedFolders.forEach(impFolder => {
      let targetFolderId
      // Match by name (case-insensitive)
      const existingFolder = workingFolders.find(f => f.name.toLowerCase() === impFolder.name.toLowerCase() && f.id !== 'all')

      if (existingFolder) {
        targetFolderId = existingFolder.id
      } else {
        targetFolderId = 'folder-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5)
        workingFolders.push({
          id: targetFolderId,
          name: impFolder.name,
          color: impFolder.color || '#5B8AF0',
          parentId: null
        })
        stats.folders++
      }

      if (Array.isArray(impFolder.links)) {
        impFolder.links.forEach(impLink => {
          const isDuplicate = workingLinks.some(l => l.url === impLink.url && l.category === targetFolderId)
          if (isDuplicate && importMode === 'merge') {
            stats.skipped++
          } else {
            workingLinks.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              url: impLink.url,
              title: impLink.title || impLink.url,
              description: impLink.description || '',
              category: targetFolderId,
              isPinned: false,
              isUnread: false,
              favicon: '',
              createdAt: impLink.createdAt || new Date().toISOString()
            })
            stats.links++
          }
        })
      }
    })

    // Pass the FINAL combined state to App.jsx
    await onImport(workingFolders || [], workingLinks || [])
    
    setResults(stats)
    setIsSuccess(true)
  }

  const totalLinksToImport = (selectedFolderIndices || []).reduce((sum, i) => {
    const folder = importedFolders[i]
    return sum + (folder?.links?.length || 0)
  }, 0)

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
            className="fixed inset-0 m-auto w-full max-w-[480px] h-fit z-[101] overflow-hidden"
          >
            <div className="bg-[#1C1917] border border-[#2E2A27] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#2E2A27] flex items-center justify-between bg-[#211E1B]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#D97757]/10 text-[#D97757]">
                    <Upload size={18} />
                  </div>
                  <div>
                    <h2 className="text-[#E8E3DC] font-bold text-base">Import Links</h2>
                    <p className="text-[10px] text-[#6B645C] font-medium uppercase tracking-wider">
                      {isSuccess ? 'Import Complete' : 'Review and confirm'}
                    </p>
                  </div>
                </div>
                {!isSuccess && (
                  <button onClick={onClose} className="p-2 text-[#6B645C] hover:text-[#E8E3DC] hover:bg-[#2E2A27] rounded-lg transition-all">
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex flex-col gap-5">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-4">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-[#E8E3DC] mb-2">Success!</h3>
                    <p className="text-sm text-[#6B645C] max-w-[280px]">
                      Imported {results.links} links across {results.folders} new folders.
                      {results.skipped > 0 && ` ${results.skipped} duplicates were skipped.`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-[#4A4440] uppercase tracking-widest">
                        {importedFolders.length} folders found
                      </span>
                      <button 
                        onClick={toggleAll}
                        className="text-[11px] font-bold text-[#D97757] hover:text-[#E88867] transition-colors flex items-center gap-1.5"
                      >
                        {selectedFolderIndices.length === importedFolders.length ? (
                          <><Minus size={12} /> Deselect All</>
                        ) : (
                          <><Check size={12} /> Select All</>
                        )}
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                      {importedFolders.map((folder, index) => (
                        <div 
                          key={index}
                          onClick={() => toggleFolder(index)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedFolderIndices.includes(index) 
                              ? 'bg-[#211E1B] border-[#3D3730] text-[#E8E3DC]' 
                              : 'bg-transparent border-transparent text-[#6B645C] hover:bg-[#211E1B]/50'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {selectedFolderIndices.includes(index) ? (
                              <CheckSquare size={18} className="text-[#D97757]" />
                            ) : (
                              <Square size={18} />
                            )}
                          </div>
                          <Folder size={16} style={{ color: folder.color }} className="flex-shrink-0" />
                          <span className="text-sm font-medium flex-1 truncate">{folder.name}</span>
                          <span className="text-[10px] font-mono opacity-50 bg-black/20 px-1.5 py-0.5 rounded-md">
                            {folder.links?.length || 0} links
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-[#4A4440] uppercase tracking-widest px-1">Import Mode</label>
                      <div className="grid grid-cols-1 gap-2">
                        <div 
                          onClick={() => setImportMode('merge')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            importMode === 'merge' ? 'bg-[#211E1B] border-[#3D3730]' : 'border-transparent hover:bg-[#211E1B]/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${importMode === 'merge' ? 'border-[#D97757]' : 'border-[#4A4440]'}`}>
                              {importMode === 'merge' && <div className="w-2 h-2 rounded-full bg-[#D97757]" />}
                            </div>
                            <span className="text-sm font-bold text-[#E8E3DC]">Merge with existing data</span>
                          </div>
                          <p className="text-[11px] text-[#6B645C] ml-7">New links will be added. Duplicate URLs in the same folder will be skipped.</p>
                        </div>

                        <div 
                          onClick={() => setImportMode('replace')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            importMode === 'replace' ? 'bg-red-500/5 border-red-500/20' : 'border-transparent hover:bg-[#211E1B]/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${importMode === 'replace' ? 'border-red-400' : 'border-[#4A4440]'}`}>
                              {importMode === 'replace' && <div className="w-2 h-2 rounded-full bg-red-400" />}
                            </div>
                            <span className="text-sm font-bold text-[#E8E3DC]">Replace all data</span>
                          </div>
                          <p className="text-[11px] text-[#6B645C] ml-7">All current links and folders will be deleted and replaced with imported data.</p>
                        </div>
                      </div>
                    </div>

                    {importMode === 'replace' && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400">
                        <AlertTriangle size={18} className="flex-shrink-0" />
                        <p className="text-[11px] font-medium leading-relaxed">
                          Warning: This action is irreversible. All your current data will be permanently deleted.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-5 border-t border-[#2E2A27] bg-[#211E1B] flex gap-3">
                {isSuccess ? (
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 bg-[#D97757] hover:bg-[#C46645] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#D97757]/10"
                  >
                    Done
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 bg-[#2E2A27] hover:bg-[#3D3730] text-[#E8E3DC] text-xs font-bold rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={selectedFolderIndices.length === 0}
                      onClick={handleImport}
                      className={`flex-[2] py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                        importMode === 'replace' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/10' : 'bg-[#D97757] hover:bg-[#C46645] shadow-[#D97757]/10'
                      }`}
                    >
                      Import {totalLinksToImport} links
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
