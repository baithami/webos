import type { GameCase } from '../types'

export const case003: GameCase = {
  id: 'case-003',
  title: 'The Serial Jaywalker',
  classification: 'SERIAL JAYWALKING (HABITUAL)',
  difficulty: 3,
  sqlConcepts: ['SELECT', 'GROUP BY', 'COUNT', 'ORDER BY'],
  briefing: `CASE FILE #0003
CLASSIFICATION: SERIAL JAYWALKING (HABITUAL)

Detective,

Under Director Zoran's Municipal Decency Initiative, any civilian accumulating more than 3 jaywalking citations in a 30-day period must appear before the Minor Infractions Tribunal.

Our citation database for this month is attached. Identify all civilians who have crossed this threshold — and in particular, who leads the list.

The evidence database contains one table:
  jaywalking_citations — every citation issued this month, one row per citation

Your job is to count citations per person. This is a counting problem, not a search problem.

Tip from your supervisor: GROUP BY is how SQL counts things by category.

— Dispatch`,
  schema: {
    tables: {
      jaywalking_citations: {
        columns: ['id INTEGER', 'civilian_name TEXT', 'location TEXT', 'citation_date TEXT', 'officer_id INTEGER'],
      },
    },
  },
  dbSetupSQL: `
    CREATE TABLE jaywalking_citations (
      id INTEGER PRIMARY KEY,
      civilian_name TEXT,
      location TEXT,
      citation_date TEXT,
      officer_id INTEGER
    );
    INSERT INTO jaywalking_citations VALUES
      (1,'Brenda Watts','Oak & 5th','2026-05-01',101),
      (2,'Terry Glass','Main & 2nd','2026-05-02',102),
      (3,'Brenda Watts','Park Ave','2026-05-03',101),
      (4,'Sam Obi','Oak & 5th','2026-05-04',103),
      (5,'Terry Glass','Elm & 7th','2026-05-05',101),
      (6,'Brenda Watts','Main & 2nd','2026-05-07',102),
      (7,'Nina Vasquez','Park Ave','2026-05-08',103),
      (8,'Terry Glass','Oak & 5th','2026-05-09',101),
      (9,'Brenda Watts','Elm & 7th','2026-05-10',102),
      (10,'Sam Obi','Main & 2nd','2026-05-11',103),
      (11,'Terry Glass','Park Ave','2026-05-12',101),
      (12,'Nina Vasquez','Oak & 5th','2026-05-14',102),
      (13,'Brenda Watts','Main & 2nd','2026-05-15',103),
      (14,'Terry Glass','Elm & 7th','2026-05-16',101),
      (15,'Sam Obi','Park Ave','2026-05-17',102),
      (16,'Brenda Watts','Oak & 5th','2026-05-18',103);
  `,
  solution: {
    prompt: 'Who is the most habitual jaywalker?',
    answer: 'Brenda Watts',
    hints: [
      "This problem is about counting — how many times does each person appear in the table?",
      "GROUP BY lets you organize rows into groups. Try: SELECT civilian_name, COUNT(*) FROM jaywalking_citations GROUP BY civilian_name",
      "Add ORDER BY COUNT(*) DESC to sort by count descending. The person at the top is your answer.",
    ],
  },
}
