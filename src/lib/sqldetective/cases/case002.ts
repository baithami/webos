import type { GameCase } from '../types'

export const case002: GameCase = {
  id: 'case-002',
  title: 'The Unauthorized Nap',
  classification: 'UNAUTHORIZED REST (PUBLIC SPACE)',
  difficulty: 2,
  sqlConcepts: ['SELECT', 'WHERE', 'INNER JOIN'],
  briefing: `CASE FILE #0002
CLASSIFICATION: UNAUTHORIZED REST (PUBLIC SPACE)

Detective,

A civilian complaint was filed this morning. At 2:14 PM yesterday, a city employee in a gray uniform was observed sleeping on Bench #7 in Millbrook Park. The uniform number is partially visible: it ends in "...447".

City records track employee work schedules and uniform assignments separately. Neither table alone will give you the employee's name — you will need to connect them.

The evidence database contains:
  city_employees       — staff registry with names and departments
  uniform_assignments  — which uniform number belongs to which employee
  work_schedules       — clocked-in/out records for yesterday

Director Zoran has made it clear: nobody sleeps on city time.

— Dispatch`,
  schema: {
    tables: {
      city_employees: { columns: ['id INTEGER', 'name TEXT', 'department TEXT', 'hire_year INTEGER'] },
      uniform_assignments: { columns: ['uniform_id TEXT', 'employee_id INTEGER', 'department TEXT'] },
      work_schedules: { columns: ['id INTEGER', 'employee_id INTEGER', 'clock_in TEXT', 'clock_out TEXT', 'date TEXT', 'status TEXT'] },
    },
  },
  dbSetupSQL: `
    CREATE TABLE city_employees (
      id INTEGER PRIMARY KEY,
      name TEXT,
      department TEXT,
      hire_year INTEGER
    );
    INSERT INTO city_employees VALUES
      (1,'Ronaldo Perez','Parks',2018),
      (2,'Yuki Tanaka','Sanitation',2020),
      (3,'Beth Okafor','Parks',2015),
      (4,'Craig Muller','Parks',2022),
      (5,'Diane Frost','Roads',2019),
      (6,'Henry Lam','Sanitation',2021);

    CREATE TABLE uniform_assignments (
      uniform_id TEXT PRIMARY KEY,
      employee_id INTEGER,
      department TEXT
    );
    INSERT INTO uniform_assignments VALUES
      ('PRK-1102',1,'Parks'),
      ('PRK-2447',4,'Parks'),
      ('PRK-3891',3,'Parks'),
      ('SAN-0447',2,'Sanitation'),
      ('SAN-1203',6,'Sanitation'),
      ('RDS-0019',5,'Roads');

    CREATE TABLE work_schedules (
      id INTEGER PRIMARY KEY,
      employee_id INTEGER,
      clock_in TEXT,
      clock_out TEXT,
      date TEXT,
      status TEXT
    );
    INSERT INTO work_schedules VALUES
      (1,1,'08:00','16:00','2026-05-19','present'),
      (2,2,'07:00','15:00','2026-05-19','present'),
      (3,3,'09:00','17:00','2026-05-19','present'),
      (4,4,'08:00','16:00','2026-05-19','present'),
      (5,5,'08:30','16:30','2026-05-19','present'),
      (6,6,'06:00','14:00','2026-05-19','present');
  `,
  solution: {
    prompt: 'Who was sleeping on the bench?',
    answer: 'Craig Muller',
    hints: [
      "Two uniform numbers end in '447'. Find both employees and figure out which one's uniform belongs to the Parks department.",
      "The uniform_assignments table links uniform IDs to employee IDs. The city_employees table has names. These tables share a common column.",
      "Use INNER JOIN to connect the tables: SELECT ... FROM uniform_assignments JOIN city_employees ON uniform_assignments.employee_id = city_employees.id WHERE uniform_id LIKE '%447'",
    ],
  },
}
