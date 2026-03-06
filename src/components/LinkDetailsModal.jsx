import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Calendar, Folder, Link2, Edit3, Trash2, Copy, Check } from 'lucide-react'

export default function LinkDetailsModal({ isOpen, onClose, link, folders, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)

  if (!link) return null

  const folder = folders.find(f => f.id === link.category)
  const folderName = folder ? folder.name : 'All'
  const folderColor = folder ? folder.color : '#5B8AF0'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpen = () => {
    if (window.electron) window.electron.shell.open(link.url)
    else window.open(link.url, '_blank')
  }

  const hostname = (() => {
    try { return new URL(link.url).hostname }
    catch { return link.url }
  })()

  const cleanHostname = hostname.replace('www.', '')
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-[#211E1B] border border-[#3D3730] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl shadow-black/50 pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative h-20 bg-[#171412] flex items-center justify-center border-b border-[#2E2A27]">
                <div className="w-10 h-10 rounded-xl bg-[#D97757]/10 border border-[#D97757]/20 flex items-center justify-center overflow-hidden">
                  {!imgError ? (
                    <img 
                      src={faviconUrl} 
                      alt="" 
                      className="w-5 h-5 object-contain" 
                      onError={() => setImgError(true)} 
                    />
                  ) : (
                    <span className="text-base font-bold text-[#D97757] font-mono">
                      {(link.title || cleanHostname).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button 
                  onClick={onClose}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full text-[#6B645C] hover:text-[#E8E3DC] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-[#E8E3DC] mb-0.5 leading-tight truncate">{link.title || link.url}</h2>
                  <p className="text-[11px] text-[#D97757] font-mono truncate">{link.url}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div className="bg-[#171412] p-2 rounded-xl border border-[#2E2A27]">
                    <div className="flex items-center gap-1 text-[#6B645C] text-[9px] uppercase tracking-wider mb-0.5 font-bold">
                      <Folder size={10} />
                      <span>Folder</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folderColor }} />
                      <span className="text-[12px] text-[#E8E3DC] font-semibold">{folderName}</span>
                    </div>
                  </div>
                  <div className="bg-[#171412] p-2 rounded-xl border border-[#2E2A27]">
                    <div className="flex items-center gap-1 text-[#6B645C] text-[9px] uppercase tracking-wider mb-0.5 font-bold">
                      <Calendar size={10} />
                      <span>Added</span>
                    </div>
                    <span className="text-[12px] text-[#E8E3DC] font-semibold">
                      {new Date(link.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-5">
                  <div className="flex items-center gap-1 text-[#6B645C] text-[9px] uppercase tracking-wider mb-1.5 font-bold">
                    <span>Description</span>
                  </div>
                  <div className="bg-[#171412] p-3 rounded-xl border border-[#2E2A27] min-h-[70px]">
                    <p className="text-[12px] text-[#8A837B] leading-relaxed">
                      {link.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpen}
                    className="flex-1 bg-[#D97757] hover:bg-[#C46645] text-white py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={14} />
                    Open
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl border border-[#2E2A27] text-[#6B645C] hover:text-[#E8E3DC] hover:border-[#3D3730] transition-all"
                    title="Copy URL"
                  >
                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={() => onEdit(link)}
                    className="p-2 rounded-xl border border-[#2E2A27] text-[#6B645C] hover:text-[#D97757] hover:border-[#D97757]/30 transition-all"
                    title="Edit Link"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(link.id)}
                    className="p-2 rounded-xl border border-[#2E2A27] text-[#6B645C] hover:text-red-400 hover:border-red-400/30 transition-all"
                    title="Delete Link"
                  >
                    <Trash2 size={16} />
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
