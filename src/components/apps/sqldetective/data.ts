// Shared presentational helpers for the SQL Detective apps. The actual case
// content (briefings, schemas, seed SQL, solutions) now lives in
// src/lib/sqldetective/cases — this file only holds small UI helpers.

/** Renders difficulty as filled/empty dots, e.g. 2 → '●●○'. */
export function difficultyDots(level: number, max = 3): string {
  return '●'.repeat(level) + '○'.repeat(Math.max(0, max - level))
}
