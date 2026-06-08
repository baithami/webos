// Type contracts for the SQL Detective game engine. A GameCase is a fully
// self-contained, browser-buildable SQLite database (dbSetupSQL) plus the
// briefing, schema description, and answer validation for one case.

export interface CaseSchema {
  tables: Record<string, { columns: string[] }>
}

export interface GameCase {
  id: string
  title: string
  classification: string // e.g. "PETTY THEFT (BAKED GOODS)"
  difficulty: 1 | 2 | 3
  sqlConcepts: string[]
  briefing: string // full text shown in CaseFile
  schema: CaseSchema
  dbSetupSQL: string // CREATE TABLE + INSERT statements
  solution: {
    validate: (rows: Record<string, unknown>[]) => boolean
    hints: [string, string, string]
  }
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
}

export type QueryOutcome =
  | { type: 'success'; result: QueryResult }
  | { type: 'empty'; message: string }
  | {
      type: 'error'
      message: string
      rawError?: string
      errorKind: 'syntax' | 'semantic' | 'runtime'
    }
