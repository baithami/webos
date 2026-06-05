import { create } from 'zustand'
import { useWindowStore } from './useWindowStore'

// Lightweight inter-app "open this file there" bus. Finder calls openFile, which
// records a pending fileId for the target app and opens/focuses that app's
// window. The target app consumes the pending id in an effect and clears it.

interface AppIntentState {
  pendingFile: Record<string, string | undefined>
  openFile: (appId: string, fileId: string) => void
  consumeFile: (appId: string) => string | undefined
}

export const useAppIntent = create<AppIntentState>()((set, get) => ({
  pendingFile: {},

  openFile: (appId, fileId) => {
    set((s) => ({ pendingFile: { ...s.pendingFile, [appId]: fileId } }))
    useWindowStore.getState().openApp(appId)
  },

  consumeFile: (appId) => {
    const fileId = get().pendingFile[appId]
    if (fileId !== undefined) {
      set((s) => ({ pendingFile: { ...s.pendingFile, [appId]: undefined } }))
    }
    return fileId
  },
}))
