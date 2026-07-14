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
  'case-004': {
    ...VANE,
    intro: [
      { text: 'Someone is parking in the Director’s spot. Spot One. He has been walking an additional four meters, Detective. Four.', expr: 'stern' },
      { text: 'A witness saw a beige sedan. The garage log knows plates, the registry knows owners, the staff table knows names. None of them talk to each other.', expr: 'neutral' },
      { text: 'So you will make them talk. Chain the joins. Walk the whole trail from asphalt to name.', expr: 'stern' },
    ],
    signoff: { text: 'The Director described his morale as "fragile". I need this closed.', expr: 'suspicious' },
  },
  'case-005': {
    ...VANE,
    intro: [
      { text: 'The Coffee Fund is short one hundred twenty-three dollars and twenty-five cents. Finance has stopped smiling. Finance never smiled.', expr: 'stern' },
      { text: 'Claims live in one table, actual deliveries in another. A claim with no matching delivery is fiction with a dollar sign.', expr: 'neutral' },
      { text: 'Ask one table a question INSIDE another. A subquery, Detective. The fabricated run codes will fall right out.', expr: 'pleased' },
    ],
    signoff: { text: 'Whoever it is has been drinking imaginary coffee at real prices.', expr: 'suspicious' },
  },
  'case-006': {
    ...VANE,
    intro: [
      { text: 'Three nights this month, the Records Hall shredder ran while the city slept. The archive index went into its own shredder. Poetic. Infuriating.', expr: 'stern' },
      { text: 'Day badge-ins are noise. Set your window after twenty-three hundred and see who keeps appearing.', expr: 'neutral' },
      { text: 'One bad night is coincidence. Three is a pattern. Group the nights, count them, and keep only whoever hits all three.', expr: 'suspicious' },
      { text: 'This is the one they will remember, Detective. Do not miss.', expr: 'stern' },
    ],
    signoff: { text: 'Whoever it is knew exactly which files to feed the machine.', expr: 'suspicious' },
  },
}
