import type { GameCase } from '../types'

export const case005: GameCase = {
  id: 'case-005',
  title: 'The Coffee Fund Discrepancy',
  classification: 'MISAPPROPRIATION (HOT BEVERAGE RESERVES)',
  difficulty: 4,
  sqlConcepts: ['SELECT', 'WHERE', 'NOT IN', 'SUBQUERY'],
  briefing: `CASE FILE #0005
CLASSIFICATION: MISAPPROPRIATION (HOT BEVERAGE RESERVES)

Detective,

The Departmental Coffee Fund is short $123.25 this quarter. Finance is, in their words, "prepared to escalate."

How the fund works: an employee makes a supply run, files a reimbursement with a run code, and the storeroom logs the delivery under that same run code when the goods actually arrive. Claims and deliveries are recorded by DIFFERENT offices, in different tables, and the offices do not speak.

The evidence database contains two tables:
  reimbursements — every claim filed: who claimed, which run code, how much
  deliveries     — every delivery the storeroom actually received, by run code

Somebody has been filing claims for supply runs that never delivered so much as a stirrer. A claim whose run code has no matching delivery is a fabrication.

Find who has been billing the city for imaginary coffee.

— Dispatch`,
  schema: {
    tables: {
      reimbursements: {
        columns: ['id INTEGER', 'claimant TEXT', 'run_code TEXT', 'amount REAL'],
      },
      deliveries: {
        columns: ['run_code TEXT', 'items TEXT', 'received_by TEXT'],
      },
    },
  },
  dbSetupSQL: `
    CREATE TABLE reimbursements (
      id INTEGER PRIMARY KEY,
      claimant TEXT,
      run_code TEXT,
      amount REAL
    );
    CREATE TABLE deliveries (
      run_code TEXT PRIMARY KEY,
      items TEXT,
      received_by TEXT
    );
    INSERT INTO reimbursements VALUES
      (1,'Hugo Reyes','RUN-11',18.50),
      (2,'Marcy Dillon','RUN-12',42.00),
      (3,'Alma Fontaine','RUN-13',12.75),
      (4,'Marcy Dillon','RUN-17',65.00),
      (5,'Stan Beck','RUN-14',22.10),
      (6,'Marcy Dillon','RUN-19',58.25),
      (7,'Hugo Reyes','RUN-15',31.40);
    INSERT INTO deliveries VALUES
      ('RUN-11','coffee, filters','Petra Voss'),
      ('RUN-12','coffee, sugar','Leon Vasko'),
      ('RUN-13','cups','Petra Voss'),
      ('RUN-14','coffee','Leon Vasko'),
      ('RUN-15','creamer, stirrers','Petra Voss');
  `,
  solution: {
    prompt: 'Who has been claiming reimbursements for phantom supply runs?',
    answer: 'Marcy Dillon',
    hints: [
      'Two tables, two versions of the truth: reimbursements is what people CLAIMED, deliveries is what actually ARRIVED. The run_code column is the thread between them.',
      'A subquery hands you the list of real runs: (SELECT run_code FROM deliveries). You can use that whole list inside another query’s WHERE.',
      'SELECT claimant FROM reimbursements WHERE run_code NOT IN (SELECT run_code FROM deliveries) — anyone that returns claimed money for a run that never happened.',
    ],
  },
}
