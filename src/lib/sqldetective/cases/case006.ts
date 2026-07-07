import type { GameCase } from '../types'

export const case006: GameCase = {
  id: 'case-006',
  title: 'The Midnight Shredder',
  classification: 'DESTRUCTION OF MUNICIPAL RECORDS (NOCTURNAL)',
  difficulty: 5,
  sqlConcepts: ['SELECT', 'WHERE', 'BETWEEN', 'INNER JOIN', 'GROUP BY', 'HAVING'],
  briefing: `CASE FILE #0006
CLASSIFICATION: DESTRUCTION OF MUNICIPAL RECORDS (NOCTURNAL)

Detective,

Three times this month, the Records Hall shredder has run in the middle of the night. Each morning after, files were missing from the archive. Which files? The index that would tell us was, naturally, in the shredder.

This is the big one. Handle it cleanly.

The evidence database contains three tables:
  shredder_log   — every shredder activation: date, time, sheets destroyed
  records_access — every badge-in to the Records Hall: badge, date, time
  personnel      — badge registry: badge number, name, title

The shredding happens late — after 23:00. Plenty of people badge in during the day; they are not your concern. Find who was inside the Records Hall in the shredder's time window, and be careful: being there ONE bad night is coincidence. Being there on EVERY shredder night is a pattern.

Name the person whose nights line up with all three activations.

— Dispatch`,
  schema: {
    tables: {
      shredder_log: {
        columns: ['id INTEGER', 'used_date TEXT', 'used_time TEXT', 'sheets INTEGER'],
      },
      records_access: {
        columns: ['id INTEGER', 'badge INTEGER', 'entry_date TEXT', 'entry_time TEXT'],
      },
      personnel: {
        columns: ['badge INTEGER', 'name TEXT', 'title TEXT'],
      },
    },
  },
  dbSetupSQL: `
    CREATE TABLE shredder_log (
      id INTEGER PRIMARY KEY,
      used_date TEXT,
      used_time TEXT,
      sheets INTEGER
    );
    CREATE TABLE records_access (
      id INTEGER PRIMARY KEY,
      badge INTEGER,
      entry_date TEXT,
      entry_time TEXT
    );
    CREATE TABLE personnel (
      badge INTEGER PRIMARY KEY,
      name TEXT,
      title TEXT
    );
    INSERT INTO personnel VALUES
      (205,'Dora Quill','Filing Clerk'),
      (206,'Ivan Petrov','Archivist'),
      (207,'Sylvia Marsh','Records Supervisor'),
      (210,'Wes Okada','Custodian'),
      (212,'Fay Ngata','Intern');
    INSERT INTO shredder_log VALUES
      (1,'2026-06-03','23:41',214),
      (2,'2026-06-10','23:37',188),
      (3,'2026-06-17','23:52',301);
    INSERT INTO records_access VALUES
      (1,205,'2026-06-03','08:58'),
      (2,206,'2026-06-03','09:12'),
      (3,207,'2026-06-03','09:01'),
      (4,212,'2026-06-03','13:45'),
      (5,207,'2026-06-03','23:22'),
      (6,210,'2026-06-03','23:15'),
      (7,205,'2026-06-10','08:55'),
      (8,206,'2026-06-10','10:03'),
      (9,207,'2026-06-10','23:29'),
      (10,212,'2026-06-10','14:20'),
      (11,210,'2026-06-05','23:05'),
      (12,206,'2026-06-17','09:44'),
      (13,205,'2026-06-17','09:02'),
      (14,207,'2026-06-17','23:31'),
      (15,210,'2026-06-17','06:10'),
      (16,212,'2026-06-17','15:30');
  `,
  solution: {
    prompt: 'Who was in the Records Hall for all three midnight shreddings?',
    answer: 'Sylvia Marsh',
    hints: [
      "Establish the window first: the shredder runs after 23:00. Filter records_access with WHERE entry_time BETWEEN '23:00' AND '23:59' and look at which entry_date values remain.",
      'Badges are not names. INNER JOIN personnel ON personnel.badge = records_access.badge to see WHO was badging in at night. One person was there one night — one person keeps coming back.',
      "Make the pattern prove itself: GROUP BY name and keep only whoever hits all three nights — HAVING COUNT(DISTINCT entry_date) = 3 (with the entry_date filter limited to the three shredder dates).",
    ],
  },
}
