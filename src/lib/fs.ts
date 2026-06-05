import { detectCategory, type FileCategory } from './fileTypes'

// Virtual file system model. The tree is stored NORMALIZED — a flat map of
// id → node with parent pointers — which makes move/rename/delete O(1)-ish and
// avoids deep recursive tree surgery. Pure helpers here operate on a NodeMap
// and never mutate; the Zustand store (useFileSystemStore) owns mutation.

export type NodeType = 'file' | 'folder'

export interface FSNode {
  id: string
  name: string
  type: NodeType
  parentId: string | null // null only for ROOT
  content: string // '' for folders
  createdAt: number
  modifiedAt: number
}

export type NodeMap = Record<string, FSNode>

export const ROOT_ID = 'root'

/** Stable timestamp for seed nodes so SSR and client agree (no Date.now). */
const SEED_TS = 1717459200000 // 2024-06-04T00:00:00Z

function seedNode(
  id: string,
  name: string,
  type: NodeType,
  parentId: string | null,
  content = ''
): FSNode {
  return {
    id,
    name,
    type,
    parentId,
    content,
    createdAt: SEED_TS,
    modifiedAt: SEED_TS,
  }
}

/** Default home tree shipped on first run. */
export function seedFileSystem(): NodeMap {
  const nodes: FSNode[] = [
    seedNode(ROOT_ID, 'Home', 'folder', null),
    seedNode('desktop', 'Desktop', 'folder', ROOT_ID),
    seedNode('documents', 'Documents', 'folder', ROOT_ID),
    seedNode('downloads', 'Downloads', 'folder', ROOT_ID),
    seedNode('pictures', 'Pictures', 'folder', ROOT_ID),
    seedNode('music', 'Music', 'folder', ROOT_ID),
    seedNode('movies', 'Movies', 'folder', ROOT_ID),
    seedNode(
      'desktop-readme',
      'Read Me.txt',
      'file',
      'desktop',
      'Items in your Desktop folder show up right here on the desktop.\n\nTry creating a file or folder in Finder (or with the Terminal) inside Desktop — it will appear on the desktop automatically.'
    ),
    seedNode(
      'welcome',
      'Welcome.txt',
      'file',
      'documents',
      'Welcome to WebOS.\n\nThis is a fully functional virtual file system. Create, rename, move, and delete files and folders — everything persists in your browser.\n\nOpen TextEdit to start writing.'
    ),
    seedNode(
      'about',
      'About WebOS.txt',
      'file',
      'documents',
      'WebOS v1.0.0\nBuilt with Next.js, React, TypeScript, Tailwind, Framer Motion, and Zustand.'
    ),
  ]
  const map: NodeMap = {}
  for (const n of nodes) map[n.id] = n
  return map
}

// ---- Pure read helpers -------------------------------------------------

export function getChildren(nodes: NodeMap, parentId: string): FSNode[] {
  return Object.values(nodes)
    .filter((n) => n.parentId === parentId)
    .sort(sortNodes)
}

/** Folders first, then case-insensitive name order. */
export function sortNodes(a: FSNode, b: FSNode): number {
  if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

/** Walk from a node up to the root. Returns root→node order. */
export function getPath(nodes: NodeMap, id: string): FSNode[] {
  const chain: FSNode[] = []
  let current: FSNode | undefined = nodes[id]
  let guard = 0
  while (current && guard++ < 1000) {
    chain.unshift(current)
    current = current.parentId ? nodes[current.parentId] : undefined
  }
  return chain
}

/** POSIX-style path string, e.g. "/Documents/Welcome.txt". Root → "/". */
export function pathString(nodes: NodeMap, id: string): string {
  const chain = getPath(nodes, id)
  if (chain.length <= 1) return '/'
  return '/' + chain.slice(1).map((n) => n.name).join('/')
}

/** Resolve a POSIX-style path to a node, starting from `baseId` (default root). */
export function getByPath(
  nodes: NodeMap,
  path: string,
  baseId: string = ROOT_ID
): FSNode | undefined {
  const parts = path.split('/').filter(Boolean)
  let current = path.startsWith('/') ? nodes[ROOT_ID] : nodes[baseId]
  for (const part of parts) {
    if (!current) return undefined
    if (part === '.') continue
    if (part === '..') {
      current = current.parentId ? nodes[current.parentId] : current
      continue
    }
    const child = getChildren(nodes, current.id).find((n) => n.name === part)
    if (!child) return undefined
    current = child
  }
  return current
}

/** True if `maybeDescendantId` is `ancestorId` or sits beneath it. */
export function isDescendant(
  nodes: NodeMap,
  maybeDescendantId: string,
  ancestorId: string
): boolean {
  let current: FSNode | undefined = nodes[maybeDescendantId]
  let guard = 0
  while (current && guard++ < 1000) {
    if (current.id === ancestorId) return true
    current = current.parentId ? nodes[current.parentId] : undefined
  }
  return false
}

/**
 * Produce a name that doesn't collide with existing siblings in `parentId`.
 * "report.txt" → "report 2.txt" → "report 3.txt"; "Folder" → "Folder 2".
 */
export function dedupeName(
  nodes: NodeMap,
  parentId: string,
  name: string,
  ignoreId?: string
): string {
  const siblings = getChildren(nodes, parentId).filter((n) => n.id !== ignoreId)
  const taken = new Set(siblings.map((n) => n.name.toLowerCase()))
  if (!taken.has(name.toLowerCase())) return name

  const dot = name.lastIndexOf('.')
  const hasExt = dot > 0
  const base = hasExt ? name.slice(0, dot) : name
  const ext = hasExt ? name.slice(dot) : ''
  let i = 2
  let candidate = `${base} ${i}${ext}`
  while (taken.has(candidate.toLowerCase())) {
    i += 1
    candidate = `${base} ${i}${ext}`
  }
  return candidate
}

/** Collect a node and all its descendants' ids (for recursive delete). */
export function collectSubtree(nodes: NodeMap, id: string): string[] {
  const ids: string[] = []
  const stack = [id]
  let guard = 0
  while (stack.length && guard++ < 100000) {
    const current = stack.pop()!
    ids.push(current)
    for (const child of getChildren(nodes, current)) stack.push(child.id)
  }
  return ids
}

/** Category for a node (folders short-circuit to 'folder'). */
export function nodeCategory(node: FSNode): FileCategory {
  return node.type === 'folder' ? 'folder' : detectCategory(node.name)
}
