import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  seedFileSystem,
  dedupeName,
  isDescendant,
  collectSubtree,
  ROOT_ID,
  type NodeMap,
  type FSNode,
  type NodeType,
} from '@/lib/fs'

// Unique id for runtime-created nodes. Browser-only paths; crypto.randomUUID
// is available in modern browsers, with a cheap fallback.
function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'n_' + Math.random().toString(36).slice(2, 11)
}

function now(): number {
  return typeof Date !== 'undefined' ? Date.now() : 0
}

interface FileSystemState {
  nodes: NodeMap

  /** Create a file or folder under `parentId`. Returns the new id, or null. */
  createNode: (
    parentId: string,
    name: string,
    type: NodeType,
    content?: string
  ) => string | null

  /** Overwrite a file's content (no-op on folders). */
  updateContent: (id: string, content: string) => void

  /** Rename a node (de-duped against siblings). Root cannot be renamed. */
  rename: (id: string, name: string) => void

  /** Delete a node and its whole subtree. Root cannot be deleted. */
  deleteNode: (id: string) => void

  /** Move a node into `newParentId`. Guards against cycles + folder targets. */
  move: (id: string, newParentId: string) => boolean

  /** Restore the default seed tree (Settings → Reset). */
  reset: () => void
}

export const useFileSystemStore = create<FileSystemState>()(
  persist(
    (set, get) => ({
      nodes: seedFileSystem(),

      createNode: (parentId, name, type, content = '') => {
        const { nodes } = get()
        const parent = nodes[parentId]
        if (!parent || parent.type !== 'folder') return null

        const id = genId()
        const ts = now()
        const node: FSNode = {
          id,
          name: dedupeName(nodes, parentId, name),
          type,
          parentId,
          content: type === 'folder' ? '' : content,
          createdAt: ts,
          modifiedAt: ts,
        }
        set((s) => ({ nodes: { ...s.nodes, [id]: node } }))
        return id
      },

      updateContent: (id, content) =>
        set((s) => {
          const node = s.nodes[id]
          if (!node || node.type !== 'file') return s
          return {
            nodes: {
              ...s.nodes,
              [id]: { ...node, content, modifiedAt: now() },
            },
          }
        }),

      rename: (id, name) =>
        set((s) => {
          const node = s.nodes[id]
          if (!node || id === ROOT_ID) return s
          const trimmed = name.trim()
          if (!trimmed) return s
          const unique = dedupeName(s.nodes, node.parentId!, trimmed, id)
          return {
            nodes: {
              ...s.nodes,
              [id]: { ...node, name: unique, modifiedAt: now() },
            },
          }
        }),

      deleteNode: (id) =>
        set((s) => {
          if (id === ROOT_ID || !s.nodes[id]) return s
          const doomed = new Set(collectSubtree(s.nodes, id))
          const next: NodeMap = {}
          for (const [key, node] of Object.entries(s.nodes)) {
            if (!doomed.has(key)) next[key] = node
          }
          return { nodes: next }
        }),

      move: (id, newParentId) => {
        const { nodes } = get()
        const node = nodes[id]
        const target = nodes[newParentId]
        if (!node || id === ROOT_ID) return false
        if (!target || target.type !== 'folder') return false
        if (node.parentId === newParentId) return false
        // Can't move a folder into itself or one of its descendants.
        if (isDescendant(nodes, newParentId, id)) return false

        const unique = dedupeName(nodes, newParentId, node.name)
        set((s) => ({
          nodes: {
            ...s.nodes,
            [id]: {
              ...s.nodes[id],
              parentId: newParentId,
              name: unique,
              modifiedAt: now(),
            },
          },
        }))
        return true
      },

      reset: () => set({ nodes: seedFileSystem() }),
    }),
    {
      name: 'webos-filesystem',
      version: 1,
    }
  )
)
