'use client'

import { ChevronRight, Folder, FolderOpen } from 'lucide-react'
import { getChildren, type NodeMap } from '@/lib/fs'
import { RenameInput } from '@/components/apps/finder/shared'

export interface FolderTreeProps {
  nodes: NodeMap
  parentId: string
  depth: number
  selectedFolderId: string
  expanded: Set<string>
  renamingId: string | null
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onContextMenu: (e: React.MouseEvent, folderId: string) => void
  onCommitRename: (id: string, name: string) => void
  onCancelRename: () => void
}

/** Recursive folder list (Apple-Notes style, with disclosure triangles). */
export default function FolderTree(props: FolderTreeProps) {
  const { nodes, parentId, depth } = props
  const folders = getChildren(nodes, parentId).filter((n) => n.type === 'folder')

  return (
    <>
      {folders.map((folder) => {
        const subfolders = getChildren(nodes, folder.id).filter(
          (n) => n.type === 'folder'
        )
        const noteCount = getChildren(nodes, folder.id).filter(
          (n) => n.type === 'file'
        ).length
        const isOpen = props.expanded.has(folder.id)
        const isSelected = props.selectedFolderId === folder.id

        return (
          <div key={folder.id}>
            <div
              onClick={() => props.onSelect(folder.id)}
              onDoubleClick={() => props.onToggle(folder.id)}
              onContextMenu={(e) => props.onContextMenu(e, folder.id)}
              className={`flex cursor-default items-center gap-1.5 rounded-md py-1 pr-2 text-[13px] ${
                isSelected
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-primary)] hover:bg-white/5'
              }`}
              style={{ paddingLeft: 8 + depth * 14 }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  props.onToggle(folder.id)
                }}
                className={`flex h-4 w-4 items-center justify-center ${
                  subfolders.length ? '' : 'invisible'
                }`}
              >
                <ChevronRight
                  size={12}
                  className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
              </button>
              {isOpen && subfolders.length ? (
                <FolderOpen size={15} className="shrink-0 text-[#e6b400]" />
              ) : (
                <Folder size={15} className="shrink-0 text-[#e6b400]" />
              )}
              {props.renamingId === folder.id ? (
                <RenameInput
                  initial={folder.name}
                  onCommit={(name) => props.onCommitRename(folder.id, name)}
                  onCancel={props.onCancelRename}
                />
              ) : (
                <>
                  <span className="flex-1 truncate">{folder.name}</span>
                  {noteCount > 0 && (
                    <span
                      className={`text-[12px] ${
                        isSelected
                          ? 'text-white/70'
                          : 'text-[var(--color-text-tertiary)]'
                      }`}
                    >
                      {noteCount}
                    </span>
                  )}
                </>
              )}
            </div>

            {isOpen && subfolders.length > 0 && (
              <FolderTree {...props} parentId={folder.id} depth={depth + 1} />
            )}
          </div>
        )
      })}
    </>
  )
}
