import { case001 } from './case001'
import { case002 } from './case002'
import { case003 } from './case003'
import { case004 } from './case004'
import { case005 } from './case005'
import { case006 } from './case006'
import type { GameCase } from '../types'

export const CASES: GameCase[] = [
  case001,
  case002,
  case003,
  case004,
  case005,
  case006,
]

export function getCase(id: string): GameCase | undefined {
  return CASES.find((c) => c.id === id)
}
