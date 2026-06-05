import type { LucideIcon } from 'lucide-react'
import {
  Folder,
  FileText,
  FileType,
  Image as ImageIcon,
  Music,
  Film,
  FileCode,
  FileArchive,
  File as FileIcon,
} from 'lucide-react'

// File-type detection by extension. Drives Finder icons, the TextEdit open
// filter, and (later) which app a double-click routes to.

export type FileCategory =
  | 'folder'
  | 'text'
  | 'richtext'
  | 'image'
  | 'audio'
  | 'video'
  | 'code'
  | 'pdf'
  | 'archive'
  | 'unknown'

interface CategoryMeta {
  label: string
  icon: LucideIcon
  /** Default app id that opens this category (resolved in Layer 4). */
  defaultApp?: string
}

export const CATEGORY_META: Record<FileCategory, CategoryMeta> = {
  folder: { label: 'Folder', icon: Folder, defaultApp: 'finder' },
  text: { label: 'Plain Text', icon: FileText, defaultApp: 'textedit' },
  richtext: { label: 'Rich Text', icon: FileType, defaultApp: 'textedit' },
  image: { label: 'Image', icon: ImageIcon },
  audio: { label: 'Audio', icon: Music },
  video: { label: 'Movie', icon: Film },
  code: { label: 'Source Code', icon: FileCode, defaultApp: 'textedit' },
  pdf: { label: 'PDF Document', icon: FileType },
  archive: { label: 'Archive', icon: FileArchive },
  unknown: { label: 'Document', icon: FileIcon },
}

const EXT_MAP: Record<string, FileCategory> = {
  // text
  txt: 'text',
  md: 'text',
  log: 'text',
  // rich text
  rtf: 'richtext',
  // images
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  heic: 'image',
  // audio
  mp3: 'audio',
  wav: 'audio',
  aac: 'audio',
  flac: 'audio',
  m4a: 'audio',
  // video
  mp4: 'video',
  mov: 'video',
  avi: 'video',
  mkv: 'video',
  webm: 'video',
  // code
  js: 'code',
  jsx: 'code',
  ts: 'code',
  tsx: 'code',
  json: 'code',
  html: 'code',
  css: 'code',
  py: 'code',
  sh: 'code',
  c: 'code',
  cpp: 'code',
  rs: 'code',
  go: 'code',
  // documents
  pdf: 'pdf',
  // archives
  zip: 'archive',
  tar: 'archive',
  gz: 'archive',
  rar: 'archive',
  '7z': 'archive',
}

/** Extract the lowercase extension (without dot), or '' if none. */
export function getExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

/** Categorize a file by name. Folders are categorized via `type === 'folder'`. */
export function detectCategory(name: string): FileCategory {
  const ext = getExtension(name)
  return EXT_MAP[ext] ?? 'unknown'
}

export function categoryMeta(category: FileCategory): CategoryMeta {
  return CATEGORY_META[category]
}
