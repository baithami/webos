import { test, expect, type Page, type Locator } from '@playwright/test'

// End-to-end click-through of the SQL Detective game loop (v3 Step 9). Drives
// the real OS: boot → PIN → dock → Inbox → solve Case 1 in the SQL Terminal →
// refresh → confirm persistence + Case 2 unlocked.
//
// Sessions are NOT persisted (every load re-boots and re-locks), but game state
// IS (localStorage 'sql-detective-game-state'). We clear it before the run so
// the test starts from a clean, deterministic slate.

/** Wait through the boot screen and enter the default PIN via the keyboard. */
async function bootAndLogin(page: Page) {
  // Boot auto-advances (~1.8s); the lock screen shows the PIN hint.
  await expect(page.getByText(/Hint: PIN is/)).toBeVisible({ timeout: 15_000 })
  for (const d of '0000') await page.keyboard.press(d)
  // Desktop is up once the dock renders the Inbox tile.
  await expect(page.getByRole('button', { name: 'Inbox' })).toBeVisible({
    timeout: 10_000,
  })
}

/** Replace the SQL editor contents and run with Ctrl+Enter. */
async function runSql(page: Page, terminal: Locator, sql: string) {
  const editor = terminal.locator('.cm-content')
  await editor.click()
  await page.keyboard.press('Control+a')
  await page.keyboard.type(sql)
  await page.keyboard.press('Control+Enter')
}

test.beforeEach(async ({ page }) => {
  // Start clean: wipe persisted game progress before the app boots — but ONLY on
  // the first load. addInitScript runs on every navigation (including reload),
  // and a mid-test reload must preserve the completion we just persisted. A
  // sessionStorage sentinel (which survives reload) gates the one-time wipe.
  await page.addInitScript(() => {
    try {
      if (!window.sessionStorage.getItem('e2e-cleared')) {
        window.localStorage.removeItem('sql-detective-game-state')
        window.sessionStorage.setItem('e2e-cleared', '1')
      }
    } catch {
      /* ignore */
    }
  })
})

test('SQL Detective: solve Case 1 end-to-end and unlock Case 2', async ({
  page,
}) => {
  await page.goto('/')
  await bootAndLogin(page)

  // 1. Open the Inbox — three cases, cases 2 & 3 locked.
  await page.getByRole('button', { name: 'Inbox' }).click()
  const inbox = page.getByRole('dialog', { name: 'Inbox' })
  await expect(inbox).toBeVisible()
  // Case titles appear in the sidebar rows (and, for the selected case, in the
  // detail header too) — target the rows by their button role to stay unique.
  await expect(inbox.getByRole('button', { name: /The Missing Muffin/ })).toBeVisible()
  await expect(inbox.getByRole('button', { name: /The Unauthorized Nap/ })).toBeVisible()
  await expect(inbox.getByRole('button', { name: /The Serial Jaywalker/ })).toBeVisible()
  // Two LOCKED badges (cases 2 & 3), one OPEN (case 1).
  await expect(inbox.getByText('LOCKED', { exact: true })).toHaveCount(2)
  await expect(inbox.getByText('OPEN', { exact: true })).toHaveCount(1)

  // 2. Open the SQL Terminal for Case 1.
  await inbox.getByRole('button', { name: 'OPEN TERMINAL' }).click()
  const terminal = page.getByRole('dialog', { name: 'SQL Terminal' })
  await expect(terminal).toBeVisible()
  await expect(terminal.getByText('THE MISSING MUFFIN')).toBeVisible()

  // Wait for the WASM engine to finish initializing the case DB.
  await expect(
    terminal.getByText('Ready. Run a query with Ctrl+Enter.')
  ).toBeVisible({ timeout: 20_000 })

  // 3. Keyword typo → friendly error.
  await runSql(page, terminal, 'SELCT * FROM employees')
  await expect(terminal.getByText(/Did you mean SELECT\?/)).toBeVisible()

  // 4. Table typo → "did you mean employees?" suggestion.
  await runSql(page, terminal, 'SELECT * FROM employes')
  await expect(
    terminal.getByText(/no table called 'employes'.*Did you mean 'employees'\?/)
  ).toBeVisible()

  // 5. Valid filter → results table with the three 4th-floor employees.
  // Use the cell role so we match the results table, not any echo of the
  // query text in the editor.
  await runSql(page, terminal, 'SELECT * FROM employees WHERE floor = 4')
  await expect(terminal.getByRole('cell', { name: 'Dave Kowalski' })).toBeVisible()
  await expect(terminal.getByRole('cell', { name: 'Tom Birch' })).toBeVisible()
  await expect(terminal.getByRole('cell', { name: 'Jim Foster' })).toBeVisible()
  await expect(terminal.getByText(/3 rows returned/)).toBeVisible()

  // 6. Hint button reveals the first progressive hint.
  await terminal.getByRole('button', { name: /HINT/ }).click()
  await expect(terminal.getByText(/HINT:/)).toBeVisible()

  // 7. Run the answer query, then Submit → CASE CLOSED.
  await runSql(page, terminal, "SELECT * FROM employees WHERE name = 'Dave Kowalski'")
  await expect(terminal.getByRole('cell', { name: 'Dave Kowalski' })).toBeVisible()
  const submit = terminal.getByRole('button', { name: /SUBMIT ANSWER/ })
  await expect(submit).toBeEnabled()
  await submit.click()
  await expect(terminal.getByText(/CASE CLOSED/)).toBeVisible()

  // 8. Refresh → re-login → Case 1 CLOSED, Case 2 now unlocked.
  await page.reload()
  await bootAndLogin(page)
  await page.getByRole('button', { name: 'Inbox' }).click()
  const inbox2 = page.getByRole('dialog', { name: 'Inbox' })
  await expect(inbox2).toBeVisible()
  await expect(inbox2.getByText('CLOSED', { exact: true })).toHaveCount(1)
  // Only Case 3 remains locked now that Case 2 is unlocked.
  await expect(inbox2.getByText('LOCKED', { exact: true })).toHaveCount(1)

  // The Case 2 row is now clickable (not disabled).
  const case2Row = inbox2.getByRole('button', { name: /The Unauthorized Nap/ })
  await expect(case2Row).toBeEnabled()
})

test('SQL Detective: wrong answer is rejected', async ({ page }) => {
  await page.goto('/')
  await bootAndLogin(page)

  await page.getByRole('button', { name: 'Inbox' }).click()
  const inbox = page.getByRole('dialog', { name: 'Inbox' })
  await inbox.getByRole('button', { name: 'OPEN TERMINAL' }).click()
  const terminal = page.getByRole('dialog', { name: 'SQL Terminal' })
  await expect(
    terminal.getByText('Ready. Run a query with Ctrl+Enter.')
  ).toBeVisible({ timeout: 20_000 })

  // An innocent employee is not the answer.
  await runSql(page, terminal, "SELECT * FROM employees WHERE name = 'Alice Chen'")
  await expect(terminal.getByRole('cell', { name: 'Alice Chen' })).toBeVisible()
  await terminal.getByRole('button', { name: /SUBMIT ANSWER/ }).click()
  await expect(terminal.getByText(/not the answer/i)).toBeVisible()
})
