import { useFileSystemStore } from '@/store/useFileSystemStore'
import { useCaseStore } from '@/store/useCaseStore'
import type { GameCase } from './types'

/**
 * Creates a folder on the desktop for this case, if it doesn't already exist.
 * The folder name matches the format "Case #0001 — The Missing Muffin".
 * DesktopIcons.tsx automatically renders everything in the 'desktop' folder, so
 * no UI wiring is needed beyond writing the node here.
 */
export function createCaseDesktopIcon(gameCase: GameCase): void {
  const { desktopIconsCreated, markDesktopIconCreated } = useCaseStore.getState()

  if (desktopIconsCreated.includes(gameCase.id)) return

  const { createNode, nodes } = useFileSystemStore.getState()

  // Safety check: the desktop folder must exist before we can write into it.
  if (!nodes['desktop']) return

  const folderName = `Case ${gameCase.id
    .replace('case-', '#')
    .replace(/(\d+)/, (n) => n.padStart(4, '0'))} — ${gameCase.title}`

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
