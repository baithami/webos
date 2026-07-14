import { useFileSystemStore } from '@/store/useFileSystemStore'
import { useCaseStore } from '@/store/useCaseStore'
import type { GameCase } from './types'

/** The desktop folder name for a case, e.g. "Case #0001 — The Missing Muffin". */
function caseFolderName(gameCase: GameCase): string {
  return `Case ${gameCase.id
    .replace('case-', '#')
    .replace(/(\d+)/, (n) => n.padStart(4, '0'))} — ${gameCase.title}`
}

/**
 * Creates a folder on the desktop for this case, if it doesn't already exist.
 * DesktopIcons.tsx automatically renders everything in the 'desktop' folder, so
 * no UI wiring is needed beyond writing the node here.
 */
export function createCaseDesktopIcon(gameCase: GameCase): void {
  const { desktopIconsCreated, markDesktopIconCreated } = useCaseStore.getState()

  if (desktopIconsCreated.includes(gameCase.id)) return

  const { createNode, nodes } = useFileSystemStore.getState()

  // Safety check: the desktop folder must exist before we can write into it.
  if (!nodes['desktop']) return

  const folderName = caseFolderName(gameCase)

  // The file system persists server-side and can outlive the (localStorage)
  // desktopIconsCreated flag; skip if the folder is already on the desktop so we
  // never create deduped duplicates ("… 2", "… 3").
  const exists = Object.values(nodes).some(
    (n) => n.parentId === 'desktop' && n.name === folderName
  )
  if (exists) {
    markDesktopIconCreated(gameCase.id)
    return
  }

  createNode('desktop', folderName, 'folder')
  markDesktopIconCreated(gameCase.id)
}

/** Find the case's desktop folder, creating it if absent. Returns its id, or null. */
function ensureCaseFolder(gameCase: GameCase): string | null {
  const { createNode, nodes } = useFileSystemStore.getState()
  if (!nodes['desktop']) return null

  const folderName = caseFolderName(gameCase)
  const existing = Object.values(nodes).find(
    (n) => n.parentId === 'desktop' && n.name === folderName
  )
  return existing ? existing.id : createNode('desktop', folderName, 'folder')
}

/**
 * Drops the case briefing as a plain-text file (e.g. "CASE-0001.txt") *inside*
 * that case's desktop folder, openable in TextEdit. The case number is
 * zero-padded to 4 digits to match the rest of the UI ("Case #0001").
 * Idempotent: if the file is already in the folder it does nothing; if an older
 * copy is sitting loose on the desktop (earlier builds put it there), it's moved
 * into the folder rather than duplicated.
 */
export function createCaseBriefingFile(gameCase: GameCase): void {
  const folderId = ensureCaseFolder(gameCase)
  if (!folderId) return

  const { createNode, move, nodes } = useFileSystemStore.getState()
  const num = gameCase.id.replace(/\D/g, '').padStart(4, '0')
  const fileName = `CASE-${num}.txt`

  // Already filed in the case folder → nothing to do.
  const inFolder = Object.values(nodes).some(
    (n) => n.parentId === folderId && n.name === fileName
  )
  if (inFolder) return

  // Relocate a stray copy left directly on the desktop by an earlier build.
  const stray = Object.values(nodes).find(
    (n) => n.parentId === 'desktop' && n.type === 'file' && n.name === fileName
  )
  if (stray) {
    move(stray.id, folderId)
    return
  }

  createNode(folderId, fileName, 'file', gameCase.briefing)
}
