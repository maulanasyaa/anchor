import React from 'react'
import { motion } from 'framer-motion'
import { X, ArrowUpCircle } from 'lucide-react'

export default function UpdateBanner({ version, releaseUrl, onDismiss }) {
  const handleDownload = () => {
    if (window.electron) {
      window.electron.shell.open(releaseUrl)
    } else {
      window.open(releaseUrl, '_blank')
    }
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0, x: '-50%' }}
      animate={{ y: 0, opacity: 1, x: '-50%' }}
      className="fixed bottom-6 left-1/2 z-[100]"
    >
      <div className="bg-[#2A2521] border border-[#D97757] rounded-full px-4 py-2 flex items-center gap-3 shadow-lg shadow-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-[#E8E3DC] text-sm font-medium">
          <ArrowUpCircle size={16} className="text-[#D97757]" />
          <span className="whitespace-nowrap">Anchor v{version} is available</span>
        </div>
        
        <div className="flex items-center gap-2 border-l border-[#3D3730] pl-3 ml-1">
          <button
            onClick={handleDownload}
            className="text-[10px] font-bold uppercase tracking-widest text-[#D97757] hover:text-[#f08a6a] transition-colors"
          >
            Download
          </button>
          <button
            onClick={onDismiss}
            className="p-1 text-[#6B645C] hover:text-[#E8E3DC] transition-colors rounded-full hover:bg-white/5"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
