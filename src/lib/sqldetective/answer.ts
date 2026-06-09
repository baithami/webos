// Free-text accusation matching for SQL Detective. The player investigates with
// SQL, then types the suspect's name to accuse. We compare leniently — case- and
// whitespace-insensitive, surrounding punctuation stripped, and the suspect's
// last name alone is accepted — so a correct accusation isn't blocked by minor
// spelling/format differences. Aliases beyond the last name go in `solution.accept`.

import type { GameCase } from './types'

/** Lowercase, trim, collapse internal whitespace, strip surrounding punctuation. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,'"`!?;:()[\]{}\-_/\\]+/g, ' ') // punctuation → space
    .replace(/\s+/g, ' ')
    .trim()
}

/** True if `input` names the case's suspect. */
export function checkAnswer(
  input: string,
  solution: GameCase['solution']
): boolean {
  const got = normalize(input)
  if (!got) return false

  const canonical = normalize(solution.answer)
  if (got === canonical) return true

  // Last name alone (last word of the canonical answer).
  const lastName = canonical.split(' ').pop()
  if (lastName && got === lastName) return true

  return (solution.accept ?? []).some((a) => normalize(a) === got)
}
