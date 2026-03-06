import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Trash2, Copy, Check, Edit3, Star, BookOpen } from 'lucide-react'

export default function UrlCard({ link, onDelete, onEdit, onPinToggle, onViewDetails, index }) {
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleOpen = (e) => {
    e.stopPropagation()
    if (window.electron) window.electron.shell.open(link.url)
    else window.open(link.url, '_blank')
  }

  const handleCopy = async (e) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(link.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePin = (e) => {
    e.stopPropagation()
    onPinToggle(link.id)
  }

  const hostname = (() => {
    try { return new URL(link.url).hostname }
    catch { return link.url }
  })()

  const cleanHostname = hostname.replace('www.', '')
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={() => onViewDetails(link)}
      className="group bg-[#211E1B] border border-[#2E2A27] rounded-xl p-4 cursor-pointer hover:border-[#3D3730] hover:bg-[#252220] transition-all duration-200 relative"
    >
      {/* Top Indicators */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {link.isUnread && (
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" title="To Read" />
        )}
        <button
          onClick={handlePin}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            link.isPinned 
              ? 'text-yellow-500 bg-yellow-500/10 opacity-100' 
              : 'text-[#6B645C] hover:text-yellow-500 hover:bg-yellow-500/10 opacity-0 group-hover:opacity-100'
          }`}
          title={link.isPinned ? "Unpin from top" : "Pin to top"}
        >
          <Star size={14} fill={link.isPinned ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex items-start gap-3 mb-2.5">
        {/* Favicon with Fallback */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#171412] border border-[#2E2A27] flex items-center justify-center overflow-hidden mt-0.5">
          {!imgError ? (
            <img 
              src={faviconUrl} 
              alt="" 
              className="w-4 h-4 object-contain" 
              onError={() => setImgError(true)} 
            />
          ) : (
            <span className="text-xs text-[#6B645C] font-mono font-bold">
              {(link.title || cleanHostname).charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Title + domain */}
        <div className="flex-1 min-w-0 pr-12">
          <h3 className="text-sm font-medium text-[#E8E3DC] group-hover:text-white truncate transition-colors">
            {link.title || link.url}
          </h3>
          <p className="text-xs text-[#6B645C] font-mono truncate mt-0.5">{cleanHostname}</p>
        </div>
      </div>

      {/* Description Preview */}
      {link.description && (
        <p className="text-xs text-[#6B645C] leading-relaxed line-clamp-2 ml-11 mt-1 italic pr-2">
          {link.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 ml-11">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#4A4440] font-mono">
            {new Date(link.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </span>
          {link.isUnread && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-blue-400 uppercase tracking-tighter">
              <BookOpen size={10} />
              To Read
            </span>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={handleCopy} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B645C] hover:text-[#E8E3DC] hover:bg-white/5 transition-all">
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(link) }} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B645C] hover:text-[#D97757] hover:bg-[#D97757]/10 transition-all">
            <Edit3 size={13} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(link.id) }} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B645C] hover:text-red-400 hover:bg-red-400/10 transition-all">
            <Trash2 size={13} />
          </button>
          <button onClick={handleOpen} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B645C] hover:text-[#D97757] hover:bg-[#D97757]/10 transition-all">
            <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
