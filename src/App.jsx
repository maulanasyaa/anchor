import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar, SidebarBody } from './components/ui/sidebar'
import FolderTree from './components/FolderTree'
import UrlCard from './components/UrlCard'
import AddUrlModal from './components/AddUrlModal'
import LinkDetailsModal from './components/LinkDetailsModal'
import ConfirmDialog from './components/ConfirmDialog'
import { Search, Plus, Anchor, X, Download, Upload, SortDesc } from 'lucide-react'

const COLOR_PALETTE = [
  '#5B8AF0', '#D97757', '#4CAF7D', '#E8A838',
  '#9B72CF', '#6BB5D4', '#E06B75', '#56B6A0',
]

const DEFAULT_FOLDERS = [
  { id: 'all', name: 'All Links', color: '#5B8AF0' },
]

export default function App() {
  const [links, setLinks] = useState([])
  const [folders, setFolders] = useState(DEFAULT_FOLDERS)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, az
  
  const [selectedLink, setSelectedLink] = useState(null)
  const [editingLink, setEditingLink] = useState(null)
  const [linkToDelete, setLinkToDelete] = useState(null)
  
  const fileInputRef = useRef(null)
  const searchInputRef = useRef(null)

  // ── Load from storage & Shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const savedLinks = await window.electron.store.get('links')
        const savedFolders = await window.electron.store.get('folders')
        if (savedLinks) setLinks(savedLinks)
        if (savedFolders) setFolders(savedFolders)
      } catch {
        const sl = localStorage.getItem('anchor-links')
        const sf = localStorage.getItem('anchor-folders')
        if (sl) setLinks(JSON.parse(sl))
        if (sf) setFolders(JSON.parse(sf))
      }
      setIsLoaded(true)
    }
    load()

    // Global IPC Quick Add
    if (window.electron && window.electron.onQuickAdd) {
      window.electron.onQuickAdd(() => {
        setEditingLink(null)
        setIsModalOpen(true)
      })
    }

    // In-App Keyboard Shortcuts
    const handleKeyDown = (e) => {
      const isCmd = e.metaKey || e.ctrlKey
      
      // Cmd/Ctrl + F: Focus Search
      if (isCmd && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      
      // Cmd/Ctrl + N: New Link
      if (isCmd && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setEditingLink(null)
        setIsModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── Save helpers ───────────────────────────────────────────────────────────
  const saveLinks = async (newLinks) => {
    setLinks(newLinks)
    try { await window.electron.store.set('links', newLinks) }
    catch { localStorage.setItem('anchor-links', JSON.stringify(newLinks)) }
  }

  const saveFolders = async (newFolders) => {
    setFolders(newFolders)
    try { await window.electron.store.set('folders', newFolders) }
    catch { localStorage.setItem('anchor-folders', JSON.stringify(newFolders)) }
  }

  // ── Link actions ───────────────────────────────────────────────────────────
  const addLink = async (data) => {
    const newLink = { 
      id: Date.now().toString(), 
      ...data, 
      isPinned: false,
      createdAt: new Date().toISOString() 
    }
    await saveLinks([newLink, ...links])
  }

  const updateLink = async (data) => {
    const updatedLinks = links.map(l => l.id === data.id ? { ...l, ...data } : l)
    await saveLinks(updatedLinks)
    if (selectedLink?.id === data.id) setSelectedLink({ ...selectedLink, ...data })
  }

  const handleSaveLink = async (data) => {
    if (editingLink) {
      await updateLink(data)
      setEditingLink(null)
    } else {
      await addLink(data)
    }
  }

  const togglePin = async (id) => {
    const updatedLinks = links.map(l => l.id === id ? { ...l, isPinned: !l.isPinned } : l)
    await saveLinks(updatedLinks)
  }

  const confirmDeleteLink = async () => {
    if (linkToDelete) {
      await saveLinks(links.filter(l => l.id !== linkToDelete.id))
      if (selectedLink?.id === linkToDelete.id) setSelectedLink(null)
      setLinkToDelete(null)
    }
  }

  // ── Import/Export ─────────────────────────────────────────────────────────
  const handleExport = () => {
    const data = JSON.stringify({ links, folders }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `anchor-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result)
        if (imported.links) {
          const mergedLinks = [...imported.links]
          const existingIds = new Set(mergedLinks.map(l => l.id))
          links.forEach(l => { if (!existingIds.has(l.id)) mergedLinks.push(l) })
          await saveLinks(mergedLinks)
        }
        if (imported.folders) {
          const mergedFolders = [...imported.folders]
          const existingIds = new Set(mergedFolders.map(f => f.id))
          folders.forEach(f => { if (!existingIds.has(f.id)) mergedFolders.push(f) })
          await saveFolders(mergedFolders)
        }
        alert('Import successful!')
      } catch (err) {
        alert('Invalid backup file.')
      }
    }
    reader.readAsText(file)
  }

  // ── Folder actions ─────────────────────────────────────────────────────────
  const addFolder = async (name, parentId = null) => {
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const colorIdx = folders.length % COLOR_PALETTE.length
    const newFolder = { id, name, color: COLOR_PALETTE[colorIdx], parentId }
    await saveFolders([...folders, newFolder])
  }

  const deleteFolder = async (id) => {
    const getAllDescendants = (folderId) => {
      const children = folders.filter(f => f.parentId === folderId).map(f => f.id)
      return [folderId, ...children.flatMap(getAllDescendants)]
    }
    const toDelete = getAllDescendants(id)
    const updatedLinks = links.map(l => toDelete.includes(l.category) ? { ...l, category: null } : l)
    await saveLinks(updatedLinks)
    await saveFolders(folders.filter(f => !toDelete.includes(f.id)))
    if (toDelete.includes(selectedCategory)) setSelectedCategory('all')
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const linkCounts = useMemo(() => {
    const counts = { all: links.length, readingList: links.filter(l => l.isUnread).length }
    links.forEach(l => { 
      const cat = l.category || 'all'
      counts[cat] = (counts[cat] || 0) + 1 
    })
    return counts
  }, [links])

  const sortedLinks = useMemo(() => {
    let result = links.filter(link => {
      // Apply main navigation filter
      let matchCat = false
      if (selectedCategory === 'all') matchCat = true
      else if (selectedCategory === 'reading-list') matchCat = link.isUnread
      else matchCat = link.category === selectedCategory

      const q = searchQuery.toLowerCase()
      const matchSearch = !q ||
        link.title?.toLowerCase().includes(q) ||
        link.url?.toLowerCase().includes(q) ||
        link.description?.toLowerCase().includes(q)
      return matchCat && matchSearch
    })

    const sortFn = (a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
      if (sortBy === 'az') return (a.title || a.url).localeCompare(b.title || b.url)
      return 0
    }

    const pinned = result.filter(l => l.isPinned).sort(sortFn)
    const unpinned = result.filter(l => !l.isPinned).sort(sortFn)
    
    return [...pinned, ...unpinned]
  }, [links, selectedCategory, searchQuery, sortBy])

  return (
    <div className="flex h-screen bg-[#1C1917] overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImport} 
        accept=".json" 
        className="hidden" 
      />

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="pb-4 pt-10">

          {/* Logo */}
          <div className={`drag-region h-8 mb-4 flex items-center transition-all duration-300 ease-in-out justify-start overflow-hidden ${
            sidebarOpen ? "pl-3" : "pl-[28px]"
          }`}>
            <div className="w-6 h-6 rounded-lg bg-[#D97757] flex items-center justify-center flex-shrink-0">
              <Anchor size={13} className="text-white" />
            </div>
            <span
              className={`no-drag text-sm font-semibold text-[#E8E3DC] whitespace-pre overflow-hidden transition-all duration-300 ease-in-out ${
                sidebarOpen ? "max-w-[100px] opacity-100 ml-2.5" : "max-w-0 opacity-0 ml-0"
              }`}
            >
              Anchor
            </span>
          </div>

          {/* New Link button */}
          <div className="px-2 mb-3">
            <button
              onClick={() => { setEditingLink(null); setIsModalOpen(true) }}
              className={`no-drag w-full flex items-center bg-[#D97757]/15 hover:bg-[#D97757]/25 border border-[#D97757]/30 text-[#D97757] rounded-lg transition-all duration-300 ease-in-out text-xs font-medium py-1.5 justify-start overflow-hidden ${
                sidebarOpen ? "pl-2.5" : "pl-[25.5px]"
              }`}
            >
              <Plus size={13} className="flex-shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                  sidebarOpen ? "max-w-[100px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0"
                }`}
              >
                New Link
              </span>
            </button>
          </div>

          {/* Folder Tree */}
          {sidebarOpen && (
            <div className="flex-1 overflow-y-auto no-drag">
              <FolderTree
                folders={folders}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
                linkCounts={linkCounts}
                onAddFolder={addFolder}
                onDeleteFolder={deleteFolder}
                sidebarOpen={sidebarOpen}
                animate={true}
              />
            </div>
          )}

          {/* Footer - Backup Actions */}
          <div className="px-3 mt-2 pt-3 border-t border-[#2E2A27] flex flex-col gap-2">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 text-[10px] text-[#6B645C] hover:text-[#E8E3DC] transition-colors"
                  title="Export Backup"
                >
                  <Download size={12} />
                  <span>Export</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-2 text-[10px] text-[#6B645C] hover:text-[#E8E3DC] transition-colors"
                  title="Import Backup"
                >
                  <Upload size={12} />
                  <span>Import</span>
                </button>
              </div>
            )}
            <motion.p
              animate={{
                display: sidebarOpen ? 'block' : 'none',
                opacity: sidebarOpen ? 1 : 0,
              }}
              className="text-[10px] text-[#4A4440] font-mono"
            >
              {links.length} links saved
            </motion.p>
          </div>

        </SidebarBody>
      </Sidebar>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="drag-region h-12 flex items-center px-4 gap-3 border-b border-[#2E2A27] flex-shrink-0">
          <div className="no-drag flex-1 max-w-lg relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B645C]" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search links... (⌘F)"
              className="w-full bg-[#242120] border border-[#2E2A27] rounded-lg pl-8 pr-8 py-1.5 text-sm text-[#E8E3DC] placeholder-[#6B645C] focus:outline-none focus:border-[#D97757]/50 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B645C] hover:text-[#E8E3DC]">
                <X size={13} />
              </button>
            )}
          </div>
          
          <div className="no-drag ml-auto flex items-center gap-3">
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 bg-[#242120] border border-[#2E2A27] rounded-lg px-2 py-1">
              <SortDesc size={13} className="text-[#6B645C]" />
              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-[#E8E3DC] outline-none cursor-pointer pr-1"
              >
                <option value="newest" className="bg-[#1C1917]">Newest</option>
                <option value="oldest" className="bg-[#1C1917]">Oldest</option>
                <option value="az" className="bg-[#1C1917]">A-Z</option>
              </select>
            </div>

            <span className="text-xs text-[#6B645C]">{sortedLinks.length} links</span>
            <button
              onClick={() => { setEditingLink(null); setIsModalOpen(true) }}
              className="no-drag flex items-center gap-1.5 bg-[#D97757] hover:bg-[#C46645] text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              <Plus size={13} />
              Add
            </button>
          </div>
        </div>

        {/* Links grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {!isLoaded ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[#6B645C] text-sm">Loading...</div>
            </div>
          ) : sortedLinks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#242120] border border-[#2E2A27] flex items-center justify-center">
                <Anchor size={28} className="text-[#3A3530]" />
              </div>
              <div className="text-center">
                <p className="text-[#E8E3DC] text-sm font-medium mb-1">
                  {searchQuery ? 'No links found' : 
                   selectedCategory === 'reading-list' ? 'Your reading list is empty' : 'No links yet'}
                </p>
                <p className="text-[#6B645C] text-xs">
                  {searchQuery ? 'Try a different search' : 
                   selectedCategory === 'reading-list' ? 'Mark links as "To Read" to see them here' : 'Click "+ Add" to save your first link'}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence>
                {sortedLinks.map((link, i) => (
                  <UrlCard 
                    key={link.id} 
                    link={link} 
                    onDelete={(id) => setLinkToDelete(links.find(l => l.id === id))} 
                    onEdit={(l) => { setEditingLink(l); setIsModalOpen(true) }}
                    onPinToggle={togglePin}
                    onViewDetails={setSelectedLink}
                    index={i} 
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <AddUrlModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingLink(null) }}
        onSave={handleSaveLink}
        folders={folders.filter(f => f.id !== 'all')}
        links={links}
        initialData={editingLink}
      />

      <LinkDetailsModal
        isOpen={!!selectedLink}
        onClose={() => setSelectedLink(null)}
        link={selectedLink}
        folders={folders}
        onEdit={(l) => { setSelectedLink(null); setEditingLink(l); setIsModalOpen(true) }}
        onDelete={(id) => { setSelectedLink(null); setLinkToDelete(links.find(l => l.id === id)) }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!linkToDelete}
        title="Delete Link"
        message={`Are you sure you want to delete "${linkToDelete?.title || linkToDelete?.url}"? This action cannot be undone.`}
        confirmLabel="Delete Link"
        onConfirm={confirmDeleteLink}
        onCancel={() => setLinkToDelete(null)}
      />
    </div>
  )
}
