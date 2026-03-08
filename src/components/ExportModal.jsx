import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Folder, Download, Check, Minus, FileJson, CheckSquare, Square } from 'lucide-react'

export default function ExportModal({ isOpen, onClose, folders, links, linkCounts }) {
  const [selectedFolderIds, setSelectedFolderIds] = useState([])
  const [isExporting, setIsExporting] = useState(false)

  const userFolders = folders.filter(f => f.id !== 'all')

  useEffect(() => {
    if (isOpen) {
      setSelectedFolderIds(userFolders.map(f => f.id))
    }
  }, [isOpen])

  const toggleFolder = (id) => {
    setSelectedFolderIds(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedFolderIds.length === userFolders.length) {
      setSelectedFolderIds([])
    } else {
      setSelectedFolderIds(userFolders.map(f => f.id))
    }
  }

  const handleExportJSON = async () => {
    setIsExporting(true)
    const exportData = {
      exported_at: new Date().toISOString(),
      exported_from: "Anchor",
      folders: selectedFolderIds.map(fid => {
        const folder = folders.find(f => f.id === fid)
        return {
          id: folder.id,
          name: folder.name,
          color: folder.color,
          links: links.filter(l => l.category === fid).map(l => ({
            title: l.title,
            url: l.url,
            description: l.description,
            createdAt: l.createdAt
          }))
        }
      })
    }

    await window.electron.export.saveFile({
      content: JSON.stringify(exportData, null, 2),
      filename: `anchor-export-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    setIsExporting(false)
    onClose()
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
            className="fixed inset-0 m-auto w-full max-w-[450px] h-fit z-[101] overflow-hidden"
          >
            <div className="bg-[#1C1917] border border-[#2E2A27] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#2E2A27] flex items-center justify-between bg-[#211E1B]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#D97757]/10 text-[#D97757]">
                    <Download size={18} />
                  </div>
                  <div>
                    <h2 className="text-[#E8E3DC] font-bold text-base">Export Links</h2>
                    <p className="text-[10px] text-[#6B645C] font-medium uppercase tracking-wider">Choose folders to export</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-[#6B645C] hover:text-[#E8E3DC] hover:bg-[#2E2A27] rounded-lg transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-[#4A4440] uppercase tracking-widest">
                    {selectedFolderIds.length} of {userFolders.length} selected
                  </span>
                  <button 
                    onClick={toggleAll}
                    className="text-[11px] font-bold text-[#D97757] hover:text-[#E88867] transition-colors flex items-center gap-1.5"
                  >
                    {selectedFolderIds.length === userFolders.length ? (
                      <><Minus size={12} /> Deselect All</>
                    ) : (
                      <><Check size={12} /> Select All</>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                  {userFolders.map(folder => (
                    <div 
                      key={folder.id}
                      onClick={() => toggleFolder(folder.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedFolderIds.includes(folder.id) 
                          ? 'bg-[#211E1B] border-[#3D3730] text-[#E8E3DC]' 
                          : 'bg-transparent border-transparent text-[#6B645C] hover:bg-[#211E1B]/50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {selectedFolderIds.includes(folder.id) ? (
                          <CheckSquare size={18} className="text-[#D97757]" />
                        ) : (
                          <Square size={18} />
                        )}
                      </div>
                      <Folder size={16} style={{ color: folder.color }} className="flex-shrink-0" />
                      <span className="text-sm font-medium flex-1 truncate">{folder.name}</span>
                      <span className="text-[10px] font-mono opacity-50 bg-black/20 px-1.5 py-0.5 rounded-md">
                        {linkCounts[folder.id] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-5 border-t border-[#2E2A27] bg-[#211E1B] flex gap-3">
                <button
                  disabled={isExporting || selectedFolderIds.length === 0}
                  onClick={handleExportJSON}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#D97757] hover:bg-[#C46645] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#D97757]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileJson size={14} />
                  Export JSON
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
