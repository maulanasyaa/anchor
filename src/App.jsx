import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar, SidebarBody } from './components/ui/sidebar'
import FolderTree from './components/FolderTree'
import UrlCard from './components/UrlCard'
import AddUrlModal from './components/AddUrlModal'
import LinkDetailsModal from './components/LinkDetailsModal'
import ConfirmDialog from './components/ConfirmDialog'
import BackupSettings from './components/BackupSettings'
import ExportModal from './components/ExportModal'
import ImportModal from './components/ImportModal'
import UpdateBanner from './components/UpdateBanner'
import { Search, Plus, Anchor, X, Download, Upload, SortDesc, Settings } from 'lucide-react'
import anchorLogo from './assets/anchor.png'
import anchorEmptyLogo from './assets/anchor-transparent.png'

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
  const [isBackupSettingsOpen, setIsBackupSettingsOpen] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, az
  const [updateInfo, setUpdateInfo] = useState(null)
  
  const [selectedLink, setSelectedLink] = useState(null)
  const [editingLink, setEditingLink] = useState(null)
  const [linkToDelete, setLinkToDelete] = useState(null)
  
  const fileInputRef = useRef(null)
  const searchInputRef = useRef(null)

  // Use refs for links/folders to avoid closure issues in IPC listener
  const linksRef = useRef(links)
  const foldersRef = useRef(folders)
  useEffect(() => { linksRef.current = links }, [links])
  useEffect(() => { foldersRef.current = folders }, [folders])

  // ── Update Checker ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      const info = await window.electron?.updater?.check()
      if (info?.latestVersion) {
        const current = '0.1.2'
        if (info.latestVersion !== current) {
          setUpdateInfo(info)
        }
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

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

    // Auto Backup Request listener
    if (window.electron && window.electron.onBackupRequest) {
      window.electron.onBackupRequest(async () => {
        await window.electron.backup.now({
          links: linksRef.current,
          folders: foldersRef.current
        })
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

      // Cmd/Ctrl + ,: Open Backup Settings
      if (isCmd && e.key === ',') {
        e.preventDefault()
        setIsBackupSettingsOpen(true)
      }

      // Cmd/Ctrl + E: Open Export
      if (isCmd && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setShowExport(true)
      }

      // Cmd/Ctrl + I: Open Import
      if (isCmd && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        handleImportClick()
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
    setShowExport(true)
  }

  const handleImportClick = async () => {
    const data = await window.electron.import.openFile()
    if (data) {
      setImportData(data)
      setShowImport(true)
    }
  }

  const handleImportSuccess = async (newFolders, newLinks) => {
    if (!Array.isArray(newFolders) || !Array.isArray(newLinks)) {
      console.error('Import failed: Invalid data format')
      return
    }
    // saveFolders and saveLinks already handle state update and persistence
    await saveFolders(newFolders)
    await saveLinks(newLinks)
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
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="pb-4 pt-10">

          {/* Logo */}
          <div className={`drag-region h-8 mb-4 flex items-center transition-all duration-300 ease-in-out justify-start overflow-hidden ${
            sidebarOpen ? "pl-3" : "pl-[28px]"
          }`}>
            <img 
              src={anchorLogo} 
              alt="Anchor Logo"
              className="w-6 h-6 rounded-lg flex-shrink-0 object-cover" 
            />
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
              <div className="flex flex-col gap-2">
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
                    onClick={handleImportClick}
                    className="flex items-center gap-2 text-[10px] text-[#6B645C] hover:text-[#E8E3DC] transition-colors"
                    title="Import Backup"
                  >
                    <Upload size={12} />
                    <span>Import</span>
                  </button>
                </div>
                <button
                  onClick={() => setIsBackupSettingsOpen(true)}
                  className="flex items-center gap-2 text-[10px] text-[#6B645C] hover:text-[#E8E3DC] transition-colors"
                >
                  <Settings size={12} />
                  <span>Backup Settings</span>
                </button>
              </div>
            )}
            {!sidebarOpen && (
              <button
                onClick={() => setIsBackupSettingsOpen(true)}
                className="flex items-center justify-center py-2 text-[#6B645C] hover:text-[#E8E3DC] transition-colors"
                title="Backup Settings"
              >
                <Settings size={14} />
              </button>
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
                <img src={anchorEmptyLogo} className="w-15 h-15 object-contain" />
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

      <BackupSettings
        isOpen={isBackupSettingsOpen}
        onClose={() => setIsBackupSettingsOpen(false)}
        links={links}
        folders={folders}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        folders={folders}
        links={links}
        linkCounts={linkCounts}
      />

      <ImportModal
        isOpen={showImport}
        onClose={() => { setShowImport(false); setImportData(null) }}
        folders={folders}
        links={links}
        onImport={handleImportSuccess}
        importData={importData}
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

      {updateInfo && (
        <UpdateBanner 
          version={updateInfo.latestVersion}
          releaseUrl={updateInfo.releaseUrl}
          onDismiss={() => setUpdateInfo(null)}
        />
      )}
    </div>
  )
}
