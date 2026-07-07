// Detective rank ladder — the thing XP buys. 100 XP per solved case, so with
// six cases the full ladder is reachable exactly at launch content. Displayed
// in the Inbox header and on the Supervisor Console; purely cosmetic,
// no gameplay gating.

export interface Rank {
  xp: number // minimum XP for this rank
  title: string
}

export const RANKS: Rank[] = [
  { xp: 0, title: 'CADET' },
  { xp: 100, title: 'OFFICER' },
  { xp: 200, title: 'JUNIOR DETECTIVE' },
  { xp: 300, title: 'DETECTIVE' },
  { xp: 400, title: 'SENIOR DETECTIVE' },
  { xp: 500, title: 'SERGEANT' },
  { xp: 600, title: 'CHIEF INSPECTOR' },
]

/** The highest rank whose threshold the given XP meets. */
export function rankForXp(xp: number): Rank {
  let current = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.xp) current = r
  }
  return current
}

/** The next rank above the given XP, or null at the top of the ladder. */
export function nextRank(xp: number): Rank | null {
  return RANKS.find((r) => r.xp > xp) ?? null
}
