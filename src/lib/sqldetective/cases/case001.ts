import type { GameCase } from '../types'

export const case001: GameCase = {
  id: 'case-001',
  title: 'The Missing Muffin',
  classification: 'PETTY THEFT (BAKED GOODS)',
  difficulty: 1,
  sqlConcepts: ['SELECT', 'WHERE'],
  briefing: `CASE FILE #0001
CLASSIFICATION: PETTY THEFT (BAKED GOODS)

Detective,

We have a situation on the 4th floor. At approximately 9:07 AM this morning, one (1) blueberry muffin went missing from the communal break room. Surveillance cameras were offline for maintenance. We have no leads except the building access logs.

Your job is to query the evidence database and identify who was on the 4th floor during the theft window (9:00–9:20 AM). Cross-reference the break room log with the employee registry.

The evidence database contains three tables:
  employees         — everyone who works in this building
  break_room_log    — entry/exit records for break room access
  muffin_inventory  — morning and evening muffin counts

This may seem trivial, Detective. But Director Zoran has declared all minor infractions Priority Alpha.

— Dispatch`,
  schema: {
    tables: {
      employees: { columns: ['id INTEGER', 'name TEXT', 'department TEXT', 'floor INTEGER', 'badge_color TEXT'] },
      break_room_log: { columns: ['id INTEGER', 'employee_id INTEGER', 'entry_time TEXT', 'exit_time TEXT', 'date TEXT'] },
      muffin_inventory: { columns: ['id INTEGER', 'flavor TEXT', 'count_morning INTEGER', 'count_evening INTEGER', 'date TEXT'] },
    },
  },
  dbSetupSQL: `
    CREATE TABLE employees (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT,
      floor INTEGER,
      badge_color TEXT
    );
    INSERT INTO employees VALUES
      (1,'Alice Chen','Finance',3,'blue'),
      (2,'Dave Kowalski','IT',4,'green'),
      (3,'Maria Santos','HR',2,'red'),
      (4,'Tom Birch','Finance',4,'blue'),
      (5,'Priya Nair','Legal',5,'yellow'),
      (6,'Jim Foster','IT',4,'green'),
      (7,'Sandra Lee','Facilities',1,'orange');

    CREATE TABLE break_room_log (
      id INTEGER PRIMARY KEY,
      employee_id INTEGER,
      entry_time TEXT,
      exit_time TEXT,
      date TEXT
    );
    INSERT INTO break_room_log VALUES
      (1,1,'08:45','08:52','2026-05-20'),
      (2,2,'09:03','09:18','2026-05-20'),
      (3,4,'09:30','09:45','2026-05-20'),
      (4,6,'08:30','08:40','2026-05-20'),
      (5,3,'09:05','09:12','2026-05-20'),
      (6,2,'14:00','14:10','2026-05-20');

    CREATE TABLE muffin_inventory (
      id INTEGER PRIMARY KEY,
      flavor TEXT,
      count_morning INTEGER,
      count_evening INTEGER,
      date TEXT
    );
    INSERT INTO muffin_inventory VALUES
      (1,'blueberry',6,5,'2026-05-20'),
      (2,'chocolate',6,6,'2026-05-20'),
      (3,'plain',4,4,'2026-05-20');
  `,
  solution: {
    validate: (rows) =>
      rows.some(
        (r) => r['name'] === 'Dave Kowalski' || r['employee_id'] === 2
      ),
    hints: [
      "The break room is on the 4th floor. Start by looking at who was logged into the break room between 09:00 and 09:20.",
      "You've narrowed down the time window. Now check the employees table — only someone assigned to the 4th floor is a realistic suspect.",
      "Use WHERE with two conditions joined by AND. You'll need to look at both tables: break_room_log for timing, employees for the floor.",
    ],
  },
}
