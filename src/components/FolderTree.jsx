import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Folder, FolderOpen, Plus, X, Check, Bookmark } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

const COLOR_PALETTE = [
  '#5B8AF0', '#D97757', '#4CAF7D', '#E8A838',
  '#9B72CF', '#6BB5D4', '#E06B75', '#56B6A0',
]

// ── Recursive folder item ─────────────────────────────────────────────────────
function FolderItem({
  folder, depth = 0,
  isActive, onClick,
  count, open, animate,
  onDeleteRequest, onAddSubfolder,
  isSpecial, children,
  icon: Icon = Folder
}) {
  const [hovered, setHovered] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const hasChildren = children && children.length > 0
  const color = folder.color

  const handleRowClick = () => {
    onClick(folder.id)
  }

  const handleChevronClick = (e) => {
    e.stopPropagation()
    setExpanded(v => !v)
  }

  return (
    <div>
      {/* Row */}
      <div
        onClick={handleRowClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        className={`flex items-center gap-1.5 py-[5px] pr-2 mx-1 rounded-md cursor-pointer transition-all duration-100 select-none ${
          isActive ? 'bg-[#3D3730] text-[#E8E3DC]' : 'text-[#8A837B] hover:text-[#C5BFB8] hover:bg-[#2A2521]'
        }`}
      >
        {/* Chevron — only if has children */}
        <span
          onClick={hasChildren ? handleChevronClick : undefined}
          className={`flex-shrink-0 transition-colors w-3 flex items-center justify-center ${
            hasChildren ? 'text-[#6B645C] hover:text-[#C5BFB8]' : 'opacity-0 pointer-events-none'
          }`}
        >
          <motion.span
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="flex"
          >
            <ChevronRight size={11} />
          </motion.span>
        </span>

        {/* Folder icon */}
        <span className="flex-shrink-0" style={{ color }}>
          {isActive && !hasChildren && !isSpecial ? <FolderOpen size={15} /> : <Icon size={15} />}
        </span>

        {/* Label */}
        <motion.span
          animate={{
            display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          transition={{ duration: 0.15 }}
          className="text-[13px] font-medium flex-1 truncate whitespace-pre"
        >
          {folder.name}
        </motion.span>

        {/* Right side — count or actions on hover */}
        <motion.span
          animate={{
            display: animate ? (open ? 'flex' : 'none') : 'flex',
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="flex items-center gap-1 ml-auto flex-shrink-0"
        >
          {!isSpecial && hovered ? (
            <>
              {/* Add subfolder button */}
              <span
                onClick={e => { e.stopPropagation(); onAddSubfolder(folder.id) }}
                className="text-[#6B645C] hover:text-[#D97757] transition-colors"
                title="Add subfolder"
              >
                <Plus size={11} />
              </span>
              {/* Delete button */}
              <span
                onClick={e => { e.stopPropagation(); onDeleteRequest(folder.id) }}
                className="text-[#6B645C] hover:text-red-400 transition-colors"
                title="Delete folder"
              >
                <X size={11} />
              </span>
            </>
          ) : count > 0 ? (
            <span className="text-[10px] font-mono text-[#6B645C]">{count}</span>
          ) : null}
        </motion.span>
      </div>

      {/* Children — nested with AnimatePresence */}
      {hasChildren && (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

// ── Recursive render helper ───────────────────────────────────────────────────
function renderFolders({ folders, parentId = null, depth = 0, ...props }) {
  return folders
    .filter(f => (f.parentId || null) === parentId)
    .map(folder => {
      const childFolders = folders.filter(f => f.parentId === folder.id)
      return (
        <FolderItem
          key={folder.id}
          folder={folder}
          depth={depth}
          isActive={props.selectedCategory === folder.id}
          onClick={props.onSelect}
          count={props.linkCounts[folder.id] || 0}
          open={props.sidebarOpen}
          animate={props.animate}
          onDeleteRequest={props.onDeleteRequest}
          onAddSubfolder={props.onAddSubfolder}
          isSpecial={false}
        >
          {childFolders.length > 0
            ? renderFolders({ folders, parentId: folder.id, depth: depth + 1, ...props })
            : null}
        </FolderItem>
      )
    })
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function FolderTree({
  folders, selectedCategory, onSelect,
  linkCounts, onAddFolder, onDeleteFolder,
  sidebarOpen, animate
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [addingParentId, setAddingParentId] = useState(null) // null = root
  const [newName, setNewName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleAdd = () => {
    if (!newName.trim()) { setIsAdding(false); setAddingParentId(null); return }
    onAddFolder(newName.trim(), addingParentId)
    setNewName('')
    setIsAdding(false)
    setAddingParentId(null)
  }

  const handleAddSubfolder = (parentId) => {
    setAddingParentId(parentId)
    setIsAdding(true)
  }

  const handleDeleteRequest = (id) => {
    const folder = folders.find(f => f.id === id)
    setConfirmDelete({ id, name: folder?.name || id })
  }

  const handleDeleteConfirm = () => {
    if (confirmDelete) onDeleteFolder(confirmDelete.id)
    setConfirmDelete(null)
  }

  const allFolder = folders.find(f => f.id === 'all')
  const readingListFolder = { id: 'reading-list', name: 'Reading List', color: '#D97757' }
  const userFolders = folders.filter(f => f.id !== 'all')
  const parentName = addingParentId
    ? folders.find(f => f.id === addingParentId)?.name
    : null

  return (
    <div className="flex flex-col gap-0.5">
      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Folder"
        message={`Delete "${confirmDelete?.name}"? Links inside will be kept but unassigned.`}
        confirmLabel="Delete Folder"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Section header */}
      <motion.div
        animate={{
          display: animate ? (sidebarOpen ? 'flex' : 'none') : 'flex',
          opacity: animate ? (sidebarOpen ? 'open' : 0) : 1,
        }}
        className="flex items-center justify-between px-3 mb-1 mt-1"
      >
        <span className="text-[10px] font-semibold text-[#4A4440] uppercase tracking-widest">
          Folders
        </span>
        <button
          onClick={() => { setAddingParentId(null); setIsAdding(true) }}
          className="text-[#4A4440] hover:text-[#D97757] transition-colors"
          title="New folder"
        >
          <Plus size={13} />
        </button>
      </motion.div>

      {/* Special Navigation Items */}
      {allFolder && (
        <FolderItem
          folder={allFolder}
          depth={0}
          isActive={selectedCategory === 'all'}
          onClick={onSelect}
          count={linkCounts['all'] || 0}
          open={sidebarOpen}
          animate={animate}
          onDeleteRequest={() => {}}
          onAddSubfolder={() => {}}
          isSpecial={true}
          icon={Folder}
        />
      )}

      <FolderItem
        folder={readingListFolder}
        depth={0}
        isActive={selectedCategory === 'reading-list'}
        onClick={onSelect}
        count={linkCounts['readingList'] || 0}
        open={sidebarOpen}
        animate={animate}
        onDeleteRequest={() => {}}
        onAddSubfolder={() => {}}
        isSpecial={true}
        icon={Bookmark}
      />

      {userFolders.length > 0 && (
        <div className="mx-2 my-1 border-t border-[#2E2A27]" />
      )}

      {/* Recursive folder tree */}
      {renderFolders({
        folders: userFolders,
        parentId: null,
        depth: 0,
        selectedCategory,
        onSelect,
        linkCounts,
        sidebarOpen,
        animate,
        onDeleteRequest: handleDeleteRequest,
        onAddSubfolder: handleAddSubfolder,
      })}

      {/* Inline add input */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-2 mt-1"
          >
            <div className="flex items-center gap-1.5 bg-[#2A2521] border border-[#3D3730] rounded-md px-2 py-1.5">
              <Folder size={13} className="text-[#D97757] flex-shrink-0" />
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') { setIsAdding(false); setNewName(''); setAddingParentId(null) }
                }}
                placeholder={parentName ? `Subfolder of "${parentName}"...` : 'Folder name...'}
                className="bg-transparent text-[13px] text-[#E8E3DC] placeholder-[#4A4440] outline-none flex-1 min-w-0"
              />
              <button onClick={handleAdd} className="text-[#D97757] hover:text-[#E88867] flex-shrink-0">
                <Check size={13} />
              </button>
            </div>
            <p className="text-[10px] text-[#4A4440] mt-1 px-1">Enter to save · Esc to cancel</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
