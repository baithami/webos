import { case001 } from './case001'
import { case002 } from './case002'
import { case003 } from './case003'
import type { GameCase } from '../types'

export const CASES: GameCase[] = [case001, case002, case003]

export function getCase(id: string): GameCase | undefined {
  return CASES.find((c) => c.id === id)
}
