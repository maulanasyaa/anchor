import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, Loader2, Folder, AlertCircle, AlignLeft, BookOpen } from 'lucide-react'

export default function AddUrlModal({ isOpen, onClose, onSave, folders = [], links = [], initialData = null }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isUnread, setIsUnread] = useState(false)
  const [category, setCategory] = useState('all')
  const [favicon, setFavicon] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setError('')
      if (initialData) {
        setUrl(initialData.url || '')
        setTitle(initialData.title || '')
        setDescription(initialData.description || '')
        setIsUnread(initialData.isUnread || false)
        setCategory(initialData.category || 'all')
        setFavicon(initialData.favicon || '')
      } else {
        setUrl('')
        setTitle('')
        setDescription('')
        setIsUnread(false)
        setCategory('all')
        setFavicon('')
      }
    }
  }, [isOpen, initialData])

  const validateUrl = (string) => {
    try {
      const trimmed = string.trim()
      // Pre-check: if no protocol, it must at least have a dot to be eligible for auto-prefixing
      if (!trimmed.includes('://') && !trimmed.includes('.')) return false

      const urlToCheck = trimmed.includes('://') ? trimmed : 'https://' + trimmed
      const parsed = new URL(urlToCheck)
      const hasTLD = parsed.hostname.includes('.') && 
                    parsed.hostname.split('.').pop().length >= 2
      
      return (parsed.protocol === 'https:' || 
              parsed.protocol === 'http:') && hasTLD
    } catch {
      return false
    }
  }

  const duplicateLink = url.trim() ? links.find(l => {
    const normalizedInput = url.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    const normalizedExisting = l.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
    return normalizedInput === normalizedExisting && l.id !== initialData?.id
  }) : null

  const duplicateFolderName = duplicateLink 
    ? (folders.find(f => f.id === duplicateLink.category)?.name || 'All Links')
    : null

  const handleSubmit = async () => {
    setError('')
    const trimmedUrl = url.trim()
    const trimmedTitle = title.trim()

    if (!trimmedTitle) { setError('Title is required'); return }
    if (!trimmedUrl) { setError('URL is required'); return }
    if (!validateUrl(trimmedUrl)) { setError('Please enter a fully qualified URL'); return }

    setIsSaving(true)
    let normalized = trimmedUrl
    if (!normalized.startsWith('http')) normalized = 'https://' + normalized
    
    const data = {
      url: normalized,
      title: trimmedTitle,
      description: description || '',
      isUnread,
      favicon,
      category: category === 'all' ? null : category
    }

    await onSave(initialData ? { ...initialData, ...data } : data)
    setIsSaving(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed bottom-5 right-5 z-[70] w-[380px] max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-[#211E1B] border border-[#3D3730] rounded-2xl shadow-2xl shadow-black/50 p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#D97757]/15 flex items-center justify-center">
                    <Link2 size={13} className="text-[#D97757]" />
                  </div>
                  <h2 className="text-[#E8E3DC] font-bold text-sm">
                    {initialData ? 'Edit Link' : 'Add New Link'}
                  </h2>
                </div>
                <button onClick={onClose} className="text-[#6B645C] hover:text-[#E8E3DC] transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-[11px] font-medium">
                  <AlertCircle size={12} />
                  {error}
                </div>
              )}

              {/* URL */}
              <div className="mb-3">
                <label className="text-[10px] text-[#6B645C] font-bold mb-1 block uppercase tracking-widest">URL</label>
                <div className="relative">
                  <input
                    type="url"
                    className={`w-full bg-[#171412] border rounded-xl px-3 py-2 text-sm text-[#E8E3DC] placeholder-[#4A4440] focus:outline-none transition-colors font-mono ${
                      duplicateLink ? 'border-yellow-500/50' : 'border-[#2E2A27] focus:border-[#D97757]/50'
                    }`}
                    placeholder="https://example.com"
                    value={url}
                    onChange={e => { setUrl(e.target.value); if(error) setError('') }}
                    autoFocus={!initialData}
                  />
                </div>
                {/* Duplicate Warning */}
                {duplicateLink && (
                  <div className="mt-1 flex items-center gap-1.5 text-yellow-500/80 text-[10px] font-medium px-1">
                    <AlertCircle size={10} />
                    <span>Already exists in "{duplicateFolderName}"</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="mb-3">
                <label className="text-[10px] text-[#6B645C] font-bold mb-1 block uppercase tracking-widest">Title</label>
                <input
                  type="text"
                  className="w-full bg-[#171412] border border-[#2E2A27] rounded-xl px-3 py-2 text-sm text-[#E8E3DC] placeholder-[#4A4440] focus:outline-none focus:border-[#D97757]/50 transition-colors"
                  placeholder="Page title"
                  value={title}
                  onChange={e => { setTitle(e.target.value); if(error) setError('') }}
                />
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="text-[10px] text-[#6B645C] font-bold mb-1 block uppercase tracking-widest">Description</label>
                <div className="relative">
                  <textarea
                    className="w-full bg-[#171412] border border-[#2E2A27] rounded-xl px-3 py-2 text-sm text-[#E8E3DC] placeholder-[#4A4440] focus:outline-none focus:border-[#D97757]/50 transition-colors min-h-[60px] resize-none"
                    placeholder="Add a description (optional)..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                  <AlignLeft size={12} className="absolute right-3 top-2.5 text-[#4A4440]" />
                </div>
              </div>

              {/* To Read Toggle */}
              <div className="mb-4 flex items-center justify-between bg-[#171412] border border-[#2E2A27] rounded-xl px-3 py-2.5 cursor-pointer" onClick={() => setIsUnread(!isUnread)}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isUnread ? 'bg-blue-500/15 text-blue-400' : 'bg-[#211E1B] text-[#4A4440]'}`}>
                    <BookOpen size={14} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#E8E3DC] uppercase tracking-wide">Mark as To Read</p>
                    <p className="text-[10px] text-[#6B645C]">Add to your reading list</p>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${isUnread ? 'bg-blue-500' : 'bg-[#2E2A27]'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${isUnread ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </div>

              {/* Folder selection */}
              <div className="mb-5">
                <label className="text-[10px] text-[#6B645C] font-bold mb-1.5 block uppercase tracking-widest">Folder</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setCategory('all')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                      category === 'all'
                        ? 'bg-[#5B8AF0]/15 text-[#5B8AF0] border-[#5B8AF0]/30'
                        : 'bg-transparent text-[#6B645C] border-[#2E2A27] hover:border-[#3D3730]'
                    }`}
                  >
                    <Folder size={10} />
                    All
                  </button>
                  {folders.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setCategory(f.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                        category === f.id
                          ? 'text-white'
                          : 'bg-transparent text-[#6B645C] border-[#2E2A27] hover:border-[#3D3730]'
                      }`}
                      style={category === f.id ? { backgroundColor: f.color, borderColor: f.color } : {}}
                    >
                      <Folder size={10} />
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 rounded-xl border border-[#2E2A27] text-xs font-semibold text-[#6B645C] hover:text-[#E8E3DC] hover:border-[#3D3730] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving || !!duplicateLink}
                  className={`flex-1 py-2 rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    isSaving || !!duplicateLink
                      ? 'bg-[#D97757]/50 opacity-50 cursor-not-allowed'
                      : 'bg-[#D97757] hover:bg-[#C46645] cursor-pointer'
                  }`}
                >
                  {isSaving && <Loader2 size={12} className="animate-spin" />}
                  {initialData ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
