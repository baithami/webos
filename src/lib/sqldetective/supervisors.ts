// Supervisor Console dialogue registry — the ONLY place supervisor content
// lives. Deliberately SEPARATE from the case data model: it does not modify the
// GameCase type or any case file, so the verified game core stays untouched.
// Keyed by case id; a case with no entry simply gets an "AWAITING ASSIGNMENT"
// idle screen (hints still work, pulled live from useCaseStore).
//
// HINTS ARE NOT STORED HERE. The console pulls each hint from
// useCaseStore.nextHint() / useHint() at request time, so the console and the
// SQL Terminal share one hint counter.

export type Expression = string // open set; 'neutral' is the default fallback

export interface SupervisorLine {
  text: string
  expr?: Expression // defaults to 'neutral'
}

export interface Supervisor {
  name: string // e.g. "Sgt. Dolores Vane"
  portraitId: string // asset key → public/supervisors/<portraitId>/...
  channel: string // CRT channel label, e.g. "PRECINCT CH-04"
  intro: SupervisorLine[] // scripted, plays on first case open
  signoff?: SupervisorLine // optional last line after the intro
}

// One recurring precinct supervisor across all cases (same identity + portrait).
const VANE = { name: 'Sgt. Dolores Vane', portraitId: 'vane', channel: 'PRECINCT CH-04' }

export const SUPERVISORS: Record<string, Supervisor> = {
  'case-001': {
    ...VANE,
    intro: [
      { text: 'Detective. One blueberry muffin. Fourth-floor break room. Gone.', expr: 'stern' },
      { text: 'Director Zoran has flagged it Priority Alpha. I am not paid to question the Director.', expr: 'neutral' },
      { text: 'Cameras were down for maintenance. All you have is the building access log. Cross-reference it. Give me a name.', expr: 'stern' },
    ],
    signoff: { text: 'Do not make me escalate a pastry, Detective.', expr: 'suspicious' },
  },
  'case-002': {
    ...VANE,
    intro: [
      { text: 'A civilian filed a complaint. Gray uniform, asleep on Bench Seven, fourteen-fourteen hours.', expr: 'suspicious' },
      { text: 'Uniform number ends in four-four-seven. No single table holds the name — you will have to connect them.', expr: 'neutral' },
      { text: 'Nobody sleeps on city time. Find me the employee.', expr: 'stern' },
    ],
    signoff: { text: 'The Director is watching this one. So am I.', expr: 'suspicious' },
  },
  'case-003': {
    ...VANE,
    intro: [
      { text: 'The Municipal Decency Initiative is in full effect. More than three citations in thirty days, and a civilian meets the Tribunal.', expr: 'pleased' },
      { text: 'Count the citations per person. This is a tally, Detective, not a search. Group them.', expr: 'neutral' },
      { text: 'And name the worst offender first. The Director will want a headline for the bulletin.', expr: 'suspicious' },
    ],
    signoff: { text: 'Compliance is its own reward. Allegedly.', expr: 'pleased' },
  },
}
