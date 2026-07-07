import type { GameCase } from '../types'

export const case004: GameCase = {
  id: 'case-004',
  title: 'The Phantom Parking Spot',
  classification: 'UNAUTHORIZED OCCUPANCY (RESERVED ASPHALT)',
  difficulty: 4,
  sqlConcepts: ['SELECT', 'WHERE', 'INNER JOIN'],
  briefing: `CASE FILE #0004
CLASSIFICATION: UNAUTHORIZED OCCUPANCY (RESERVED ASPHALT)

Detective,

Director Zoran's reserved parking spot — Spot #1, Municipal Garage, Level 1 — has been repeatedly occupied by an unauthorized vehicle. The Director has been forced to park in Spot #2. Morale in the executive corridor is described as "fragile."

A witness on the Tuesday shuttle recalls a BEIGE SEDAN in the spot. Nothing else.

The evidence database contains three tables:
  garage_log  — every recorded parking event: which plate, which spot, what date
  vehicles    — the city vehicle registry: plate, model, color, owner badge
  city_staff  — staff registry: badge number, name, department

No single table names the offender. The garage log knows plates, the registry knows owners' badge numbers, and only the staff table knows names. You will need to walk the whole chain.

Identify the owner of the vehicle squatting in Spot #1.

— Dispatch`,
  schema: {
    tables: {
      garage_log: {
        columns: ['id INTEGER', 'plate TEXT', 'spot_number INTEGER', 'parked_date TEXT'],
      },
      vehicles: {
        columns: ['plate TEXT', 'model TEXT', 'color TEXT', 'owner_badge INTEGER'],
      },
      city_staff: {
        columns: ['badge INTEGER', 'name TEXT', 'department TEXT'],
      },
    },
  },
  dbSetupSQL: `
    CREATE TABLE garage_log (
      id INTEGER PRIMARY KEY,
      plate TEXT,
      spot_number INTEGER,
      parked_date TEXT
    );
    CREATE TABLE vehicles (
      plate TEXT PRIMARY KEY,
      model TEXT,
      color TEXT,
      owner_badge INTEGER
    );
    CREATE TABLE city_staff (
      badge INTEGER PRIMARY KEY,
      name TEXT,
      department TEXT
    );
    INSERT INTO city_staff VALUES
      (101,'Rita Song','Permits'),
      (102,'Gerald Whitmore','Records'),
      (103,'Vance Holloway','Sanitation'),
      (104,'Omar Bailey','Parks'),
      (105,'Petra Lindqvist','Finance');
    INSERT INTO vehicles VALUES
      ('KLM-482','sedan','beige',102),
      ('RRT-119','hatchback','gray',103),
      ('BGE-771','sedan','beige',104),
      ('QWE-303','van','white',101),
      ('ZXC-555','coupe','red',105);
    INSERT INTO garage_log VALUES
      (1,'KLM-482',1,'2026-06-02'),
      (2,'RRT-119',1,'2026-06-09'),
      (3,'BGE-771',7,'2026-06-02'),
      (4,'QWE-303',4,'2026-06-02'),
      (5,'ZXC-555',2,'2026-06-03'),
      (6,'KLM-482',1,'2026-06-16'),
      (7,'BGE-771',7,'2026-06-09'),
      (8,'QWE-303',4,'2026-06-10');
  `,
  solution: {
    prompt: "Who owns the vehicle squatting in the Director's spot?",
    answer: 'Gerald Whitmore',
    hints: [
      'Start at the scene: filter garage_log with WHERE spot_number = 1. Two different plates have parked there — but the witness saw a beige sedan.',
      'Plates are just strings until you join them. Try: garage_log INNER JOIN vehicles ON vehicles.plate = garage_log.plate — now you can see each parked car’s model and color.',
      "Chain a second join: INNER JOIN city_staff ON city_staff.badge = vehicles.owner_badge. Filter spot_number = 1 AND color = 'beige' and read off the name.",
    ],
  },
}
