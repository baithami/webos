// Shared static content for the SQL Detective game apps. SQL execution, real
// cases, and game state arrive in a later phase — for now this is the single
// source of truth for the placeholder UI so the Inbox, Case File, and SQL
// Terminal don't drift out of sync.

export interface CaseSummary {
  /** Zero-padded case number, e.g. '0001'. */
  number: string
  title: string
  /** 1–3, rendered as filled/empty difficulty dots. */
  difficulty: number
  status: 'OPEN' | 'LOCKED'
  classification: string
}

export const CASES: CaseSummary[] = [
  {
    number: '0001',
    title: 'The Missing Muffin',
    difficulty: 1,
    status: 'OPEN',
    classification: 'PETTY THEFT — BAKED GOODS',
  },
  {
    number: '0002',
    title: 'The Unauthorized Nap',
    difficulty: 2,
    status: 'LOCKED',
    classification: 'WORKPLACE MISCONDUCT',
  },
  {
    number: '0003',
    title: 'The Serial Jaywalker',
    difficulty: 3,
    status: 'LOCKED',
    classification: 'REPEAT OFFENSE — TRAFFIC',
  },
]

/** Full briefing for Case #0001, shared by the Inbox and Case File. */
export const CASE_001_BRIEFING = `CASE FILE #0001
CLASSIFICATION: PETTY THEFT (BAKED GOODS)

Detective,

We have a situation on the 4th floor. At approximately 9:07 AM
this morning, one (1) blueberry muffin went missing from the
communal break room. Surveillance cameras were offline for
maintenance. We have no leads except the building access logs.

Your job is to query the evidence database and find out who
was on the 4th floor during the theft window (9:00–9:20 AM).

Available tables: employees, break_room_log, muffin_inventory

— Dispatch`

export interface TableSchema {
  name: string
  columns: { name: string; type: string }[]
}

export const CASE_001_SCHEMA: TableSchema[] = [
  {
    name: 'employees',
    columns: [
      { name: 'id', type: 'INTEGER' },
      { name: 'name', type: 'TEXT' },
      { name: 'department', type: 'TEXT' },
      { name: 'floor', type: 'INTEGER' },
      { name: 'badge_color', type: 'TEXT' },
    ],
  },
  {
    name: 'break_room_log',
    columns: [
      { name: 'id', type: 'INTEGER' },
      { name: 'employee_id', type: 'INTEGER' },
      { name: 'entry_time', type: 'TEXT' },
      { name: 'exit_time', type: 'TEXT' },
      { name: 'date', type: 'TEXT' },
    ],
  },
  {
    name: 'muffin_inventory',
    columns: [
      { name: 'id', type: 'INTEGER' },
      { name: 'flavor', type: 'TEXT' },
      { name: 'count_morning', type: 'INTEGER' },
      { name: 'count_evening', type: 'INTEGER' },
      { name: 'date', type: 'TEXT' },
    ],
  },
]

/** Renders difficulty as filled/empty dots, e.g. 2 → '●●○'. */
export function difficultyDots(level: number, max = 3): string {
  return '●'.repeat(level) + '○'.repeat(Math.max(0, max - level))
}
