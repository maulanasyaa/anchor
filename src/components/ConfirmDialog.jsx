import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] bg-[#211E1B] border border-[#3D3730] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#E8E3DC] font-semibold text-base mb-1 truncate">{title}</h3>
                  <p className="text-[#8B837A] text-sm leading-relaxed">{message}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#2E2A27] text-sm font-medium text-[#8B837A] hover:text-[#E8E3DC] hover:bg-[#2E2A27]/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-900/20 transition-all active:scale-[0.98]"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
