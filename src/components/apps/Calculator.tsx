'use client'

import { useState } from 'react'

// A standard + scientific calculator. State machine: `display` is the current
// operand string; `acc`/`op` hold the pending left-hand value and operator;
// `overwrite` means the next digit replaces the display rather than appending.

type Op = '+' | '-' | '×' | '÷' | '^'

function compute(a: number, b: number, op: Op): number {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '×':
      return a * b
    case '÷':
      return b === 0 ? NaN : a / b
    case '^':
      return Math.pow(a, b)
  }
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return 'Error'
  // Trim float noise while keeping precision for big/small numbers.
  const rounded = Math.round(n * 1e12) / 1e12
  return String(rounded)
}

export default function Calculator() {
  const [scientific, setScientific] = useState(false)
  const [display, setDisplay] = useState('0')
  const [acc, setAcc] = useState<number | null>(null)
  const [op, setOp] = useState<Op | null>(null)
  const [overwrite, setOverwrite] = useState(true)

  const inputDigit = (d: string) => {
    setDisplay((cur) => {
      if (overwrite) return d
      return cur === '0' ? d : cur + d
    })
    setOverwrite(false)
  }

  const inputDecimal = () => {
    if (overwrite) {
      setDisplay('0.')
      setOverwrite(false)
    } else if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const clearAll = () => {
    setDisplay('0')
    setAcc(null)
    setOp(null)
    setOverwrite(true)
  }

  const applyOp = (next: Op) => {
    const value = Number(display)
    if (acc !== null && op && !overwrite) {
      const result = compute(acc, value, op)
      setAcc(result)
      setDisplay(fmt(result))
    } else {
      setAcc(value)
    }
    setOp(next)
    setOverwrite(true)
  }

  const equals = () => {
    if (acc === null || !op) return
    const result = compute(acc, Number(display), op)
    setDisplay(fmt(result))
    setAcc(null)
    setOp(null)
    setOverwrite(true)
  }

  const unary = (fn: (n: number) => number) => {
    setDisplay(fmt(fn(Number(display))))
    setOverwrite(true)
  }

  const constant = (v: number) => {
    setDisplay(fmt(v))
    setOverwrite(true)
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#1c1c1e] p-3">
      {/* Mode toggle */}
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <button
          onClick={() => setScientific((v) => !v)}
          className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:bg-white/20"
        >
          {scientific ? 'Standard' : 'Scientific'}
        </button>
      </div>

      {/* Display */}
      <div className="mb-2 flex shrink-0 items-end justify-end overflow-hidden rounded-lg px-3 py-2">
        <span className="truncate text-right text-4xl font-light tabular-nums text-white">
          {display}
        </span>
      </div>

      {/* Keypad */}
      <div className="flex min-h-0 flex-1 gap-1.5">
        {scientific && (
          <div className="grid grid-cols-2 gap-1.5">
            <Key onClick={() => unary((n) => Math.sin(n))} variant="fn">sin</Key>
            <Key onClick={() => unary((n) => Math.cos(n))} variant="fn">cos</Key>
            <Key onClick={() => unary((n) => Math.tan(n))} variant="fn">tan</Key>
            <Key onClick={() => unary((n) => Math.log(n))} variant="fn">ln</Key>
            <Key onClick={() => unary((n) => Math.log10(n))} variant="fn">log</Key>
            <Key onClick={() => unary((n) => Math.sqrt(n))} variant="fn">√</Key>
            <Key onClick={() => unary((n) => n * n)} variant="fn">x²</Key>
            <Key onClick={() => applyOp('^')} variant="fn">xʸ</Key>
            <Key onClick={() => unary((n) => 1 / n)} variant="fn">1/x</Key>
            <Key onClick={() => unary(factorial)} variant="fn">x!</Key>
            <Key onClick={() => constant(Math.PI)} variant="fn">π</Key>
            <Key onClick={() => constant(Math.E)} variant="fn">e</Key>
          </div>
        )}

        {/* Main pad */}
        <div className="grid flex-1 grid-cols-4 grid-rows-5 gap-1.5">
          <Key onClick={clearAll} variant="util">AC</Key>
          <Key onClick={() => unary((n) => -n)} variant="util">+/−</Key>
          <Key onClick={() => unary((n) => n / 100)} variant="util">%</Key>
          <Key onClick={() => applyOp('÷')} variant="op" active={op === '÷'}>÷</Key>

          <Key onClick={() => inputDigit('7')}>7</Key>
          <Key onClick={() => inputDigit('8')}>8</Key>
          <Key onClick={() => inputDigit('9')}>9</Key>
          <Key onClick={() => applyOp('×')} variant="op" active={op === '×'}>×</Key>

          <Key onClick={() => inputDigit('4')}>4</Key>
          <Key onClick={() => inputDigit('5')}>5</Key>
          <Key onClick={() => inputDigit('6')}>6</Key>
          <Key onClick={() => applyOp('-')} variant="op" active={op === '-'}>−</Key>

          <Key onClick={() => inputDigit('1')}>1</Key>
          <Key onClick={() => inputDigit('2')}>2</Key>
          <Key onClick={() => inputDigit('3')}>3</Key>
          <Key onClick={() => applyOp('+')} variant="op" active={op === '+'}>+</Key>

          <Key onClick={() => inputDigit('0')} span2>0</Key>
          <Key onClick={inputDecimal}>.</Key>
          <Key onClick={equals} variant="op">=</Key>
        </div>
      </div>
    </div>
  )
}

function Key({
  children,
  onClick,
  variant = 'digit',
  active,
  span2,
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'digit' | 'op' | 'util' | 'fn'
  active?: boolean
  span2?: boolean
}) {
  const base =
    'flex items-center justify-center rounded-lg text-[15px] font-medium transition-colors select-none'
  const styles = {
    digit: 'bg-white/10 text-white hover:bg-white/20',
    op: active
      ? 'bg-white text-[var(--color-accent)]'
      : 'bg-[var(--color-accent)] text-white hover:brightness-110',
    util: 'bg-white/25 text-white hover:bg-white/35',
    fn: 'bg-white/[0.07] text-[var(--color-text-secondary)] hover:bg-white/15 text-[13px]',
  }[variant]
  return (
    <button
      onClick={onClick}
      className={`${base} ${styles} ${span2 ? 'col-span-2' : ''}`}
    >
      {children}
    </button>
  )
}
