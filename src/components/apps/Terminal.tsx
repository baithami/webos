'use client'

import { useEffect, useRef, useState } from 'react'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { useAppIntent } from '@/store/useAppIntent'
import {
  getByPath,
  getChildren,
  pathString,
  nodeCategory,
  ROOT_ID,
  type NodeMap,
} from '@/lib/fs'
import { categoryMeta } from '@/lib/fileTypes'

interface Line {
  kind: 'in' | 'out' | 'err'
  text: string
}

const HELP = `Available commands:
  ls [path]        list directory contents
  cd [path]        change directory (cd with no arg → home)
  pwd              print working directory
  cat <file>       print a file's contents
  mkdir <name>     create a folder
  touch <name>     create an empty file
  rm <name>        remove a file or folder
  open <file>      open a file in its default app
  echo <text>      print text
  whoami           print the current user
  date             print the current date
  clear            clear the screen
  help             show this help`

export default function Terminal() {
  const nodes = useFileSystemStore((s) => s.nodes)
  const createNode = useFileSystemStore((s) => s.createNode)
  const deleteNode = useFileSystemStore((s) => s.deleteNode)
  const openFile = useAppIntent((s) => s.openFile)

  const [cwd, setCwd] = useState<string>(ROOT_ID)
  const [lines, setLines] = useState<Line[]>([
    { kind: 'out', text: 'WebOS Terminal — type "help" to get started.' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histPos, setHistPos] = useState<number>(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset to home if the working directory disappears.
  useEffect(() => {
    if (!nodes[cwd]) setCwd(ROOT_ID)
  }, [nodes, cwd])

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [lines])

  const prompt = `webos:${pathString(nodes, cwd)} $`

  const print = (newLines: Line[]) => setLines((prev) => [...prev, ...newLines])

  const run = (raw: string) => {
    const command = raw.trim()
    print([{ kind: 'in', text: `${prompt} ${command}` }])
    if (!command) return

    setHistory((h) => [...h, command])
    setHistPos(-1)

    const [cmd, ...args] = command.split(/\s+/)
    const out = (text: string) => print([{ kind: 'out', text }])
    const err = (text: string) => print([{ kind: 'err', text }])

    switch (cmd) {
      case 'help':
        out(HELP)
        break
      case 'clear':
        setLines([])
        break
      case 'whoami':
        out('webos')
        break
      case 'date':
        out(new Date().toString())
        break
      case 'echo':
        out(args.join(' '))
        break
      case 'pwd':
        out(pathString(nodes, cwd))
        break
      case 'ls': {
        const target = args[0] ? getByPath(nodes, args[0], cwd) : nodes[cwd]
        if (!target) return err(`ls: ${args[0]}: no such file or directory`)
        if (target.type === 'file') return out(target.name)
        const children = getChildren(nodes, target.id)
        out(
          children.length
            ? children
                .map((c) => (c.type === 'folder' ? `${c.name}/` : c.name))
                .join('   ')
            : ''
        )
        break
      }
      case 'cd': {
        if (!args[0]) {
          setCwd(ROOT_ID)
          break
        }
        const target = getByPath(nodes, args[0], cwd)
        if (!target) return err(`cd: ${args[0]}: no such file or directory`)
        if (target.type !== 'folder') return err(`cd: ${args[0]}: not a directory`)
        setCwd(target.id)
        break
      }
      case 'cat': {
        if (!args[0]) return err('cat: missing file operand')
        const target = getByPath(nodes, args[0], cwd)
        if (!target) return err(`cat: ${args[0]}: no such file or directory`)
        if (target.type === 'folder') return err(`cat: ${args[0]}: is a directory`)
        out(target.content || '')
        break
      }
      case 'mkdir':
        if (!args[0]) return err('mkdir: missing operand')
        if (createNode(cwd, args[0], 'folder') === null)
          return err('mkdir: cannot create directory')
        break
      case 'touch':
        if (!args[0]) return err('touch: missing operand')
        if (createNode(cwd, args[0], 'file', '') === null)
          return err('touch: cannot create file')
        break
      case 'rm': {
        if (!args[0]) return err('rm: missing operand')
        const target = resolveChildOrPath(nodes, cwd, args[0])
        if (!target) return err(`rm: ${args[0]}: no such file or directory`)
        if (target.id === ROOT_ID) return err('rm: cannot remove home directory')
        deleteNode(target.id)
        break
      }
      case 'open': {
        if (!args[0]) return err('open: missing file operand')
        const target = getByPath(nodes, args[0], cwd)
        if (!target) return err(`open: ${args[0]}: no such file or directory`)
        if (target.type === 'folder') return err('open: cannot open a folder')
        const app = categoryMeta(nodeCategory(target)).defaultApp
        if (!app) return err(`open: no app for ${target.name}`)
        openFile(app, target.id)
        out(`Opening ${target.name}…`)
        break
      }
      default:
        err(`${cmd}: command not found`)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length === 0) return
      const pos = histPos === -1 ? history.length - 1 : Math.max(0, histPos - 1)
      setHistPos(pos)
      setInput(history[pos])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histPos === -1) return
      const pos = histPos + 1
      if (pos >= history.length) {
        setHistPos(-1)
        setInput('')
      } else {
        setHistPos(pos)
        setInput(history[pos])
      }
    }
  }

  return (
    <div
      ref={scrollRef}
      onClick={() => inputRef.current?.focus()}
      className="h-full w-full overflow-auto bg-[#0c0c10] p-3 font-mono text-[13px] leading-relaxed text-[#e6e6e6]"
    >
      {lines.map((line, i) => (
        <pre
          key={i}
          className={`whitespace-pre-wrap break-words ${
            line.kind === 'err'
              ? 'text-[#ff6b6b]'
              : line.kind === 'in'
                ? 'text-[#7ee787]'
                : ''
          }`}
        >
          {line.text}
        </pre>
      ))}
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[#7ee787]">{prompt}</span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          spellCheck={false}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-[#e6e6e6] outline-none"
        />
      </div>
    </div>
  )
}

/** Resolve an argument to a child of cwd by name, or any path. */
function resolveChildOrPath(nodes: NodeMap, cwd: string, arg: string) {
  const byPath = getByPath(nodes, arg, cwd)
  if (byPath) return byPath
  return getChildren(nodes, cwd).find((c) => c.name === arg)
}
