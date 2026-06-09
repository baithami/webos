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

/** Replace the SQL editor contents (without running). */
async function typeSql(page: Page, terminal: Locator, sql: string) {
  const editor = terminal.locator('.cm-content')
  await editor.click()
  await page.keyboard.press('Control+a')
  await page.keyboard.type(sql)
}

/** Replace the SQL editor contents and run with Ctrl+Enter. */
async function runSql(page: Page, terminal: Locator, sql: string) {
  await typeSql(page, terminal, sql)
  await page.keyboard.press('Control+Enter')
}

/**
 * From an open Inbox, open a case email and launch its SQL Terminal. The Inbox
 * is now an email client: clicking the case email opens the reader, which has
 * the "Open SQL Terminal" action.
 */
async function openTerminalForCase(
  page: Page,
  inbox: Locator,
  titleRe: RegExp
) {
  await inbox.getByRole('button', { name: titleRe }).click()
  await inbox.getByRole('button', { name: 'Open SQL Terminal' }).click()
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

  // Dock badge: one unread case (Case 1) on first boot.
  await expect(page.getByTestId('dock-badge-inbox')).toHaveText('1')

  // 1. Open the Inbox — three case emails, cases 2 & 3 locked.
  await page.getByRole('button', { name: 'Inbox' }).click()
  const inbox = page.getByRole('dialog', { name: 'Inbox' })
  await expect(inbox).toBeVisible()
  // Each case is an email row labeled by its subject "Case #000X — Title".
  await expect(inbox.getByRole('button', { name: /The Missing Muffin/ })).toBeVisible()
  await expect(inbox.getByRole('button', { name: /The Unauthorized Nap/ })).toBeVisible()
  await expect(inbox.getByRole('button', { name: /The Serial Jaywalker/ })).toBeVisible()

  // A locked case email opens the reader's "locked" notice, not the briefing.
  await inbox.getByRole('button', { name: /The Unauthorized Nap/ }).click()
  await expect(inbox.getByText(/This case is locked/)).toBeVisible()

  // 2. Open Case 1's email → reader shows the briefing; launch its SQL Terminal.
  await inbox.getByRole('button', { name: /The Missing Muffin/ }).click()
  await expect(inbox.getByText(/dispatch@citypd\.gov/)).toBeVisible()
  // Opening the unread email clears the dock badge.
  await expect(page.getByTestId('dock-badge-inbox')).toHaveCount(0)
  // …and drops a case folder onto the desktop (scope to the desktop icon, since
  // the same text also appears as the email subject).
  await expect(
    page
      .locator('[data-desktop-icon]')
      .filter({ hasText: 'Case #0001 — The Missing Muffin' })
  ).toBeVisible()

  await inbox.getByRole('button', { name: 'Open SQL Terminal' }).click()
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

  // 7. Run the answer query, then accuse the suspect by name → CASE CLOSED.
  await runSql(page, terminal, "SELECT * FROM employees WHERE name = 'Dave Kowalski'")
  await expect(terminal.getByRole('cell', { name: 'Dave Kowalski' })).toBeVisible()
  const submit = terminal.getByRole('button', { name: /SUBMIT ANSWER/ })
  await expect(submit).toBeEnabled()
  await submit.click()
  // Accusation bar appears — type the suspect's name and confirm.
  await terminal.getByPlaceholder(/Name the suspect/).fill('Dave Kowalski')
  await terminal.getByRole('button', { name: 'CONFIRM' }).click()
  await expect(terminal.getByText(/CASE CLOSED/)).toBeVisible()

  // 8. Refresh → re-login → Case 1 CLOSED, Case 2 now unlocked and unread.
  await page.reload()
  await bootAndLogin(page)
  // Case 2 became unlocked-but-unopened → the badge returns to 1.
  await expect(page.getByTestId('dock-badge-inbox')).toHaveText('1')
  // The Case 1 desktop folder persisted across the reload.
  await expect(
    page
      .locator('[data-desktop-icon]')
      .filter({ hasText: 'Case #0001 — The Missing Muffin' })
  ).toBeVisible()

  await page.getByRole('button', { name: 'Inbox' }).click()
  const inbox2 = page.getByRole('dialog', { name: 'Inbox' })
  await expect(inbox2).toBeVisible()
  // Case 1's email carries the CLOSED badge.
  await expect(inbox2.getByText(/CLOSED/)).toHaveCount(1)

  // Case 2 now opens its briefing (no longer locked).
  await inbox2.getByRole('button', { name: /The Unauthorized Nap/ }).click()
  await expect(inbox2.getByText(/dispatch@citypd\.gov/)).toBeVisible()
  await expect(inbox2.getByText(/This case is locked/)).toHaveCount(0)
})

test('SQL Detective: RUN button executes queries and surfaces errors', async ({
  page,
}) => {
  await page.goto('/')
  await bootAndLogin(page)

  await page.getByRole('button', { name: 'Inbox' }).click()
  const inbox = page.getByRole('dialog', { name: 'Inbox' })
  await openTerminalForCase(page, inbox, /The Missing Muffin/)
  const terminal = page.getByRole('dialog', { name: 'SQL Terminal' })
  await expect(
    terminal.getByText('Ready. Run a query with Ctrl+Enter.')
  ).toBeVisible({ timeout: 20_000 })

  const runBtn = terminal.getByRole('button', { name: /RUN/ })
  await expect(runBtn).toBeEnabled()

  // Valid query via the RUN button → results table.
  await typeSql(page, terminal, 'SELECT * FROM employees WHERE floor = 4')
  await runBtn.click()
  await expect(terminal.getByRole('cell', { name: 'Dave Kowalski' })).toBeVisible()
  await expect(terminal.getByText(/3 rows returned/)).toBeVisible()

  // Invalid query via the RUN button → error message.
  await typeSql(page, terminal, 'SELECT * FROM nonexistent_table')
  await runBtn.click()
  await expect(
    terminal.getByText(/no table called 'nonexistent_table'/)
  ).toBeVisible()
})

test('SQL Detective: wrong answer is rejected', async ({ page }) => {
  await page.goto('/')
  await bootAndLogin(page)

  await page.getByRole('button', { name: 'Inbox' }).click()
  const inbox = page.getByRole('dialog', { name: 'Inbox' })
  await openTerminalForCase(page, inbox, /The Missing Muffin/)
  const terminal = page.getByRole('dialog', { name: 'SQL Terminal' })
  await expect(
    terminal.getByText('Ready. Run a query with Ctrl+Enter.')
  ).toBeVisible({ timeout: 20_000 })

  // Investigate, then accuse the wrong (innocent) employee.
  await runSql(page, terminal, "SELECT * FROM employees WHERE name = 'Alice Chen'")
  await expect(terminal.getByRole('cell', { name: 'Alice Chen' })).toBeVisible()
  await terminal.getByRole('button', { name: /SUBMIT ANSWER/ }).click()
  await terminal.getByPlaceholder(/Name the suspect/).fill('Tom Birch')
  await terminal.getByRole('button', { name: 'CONFIRM' }).click()
  await expect(terminal.getByText(/not the answer/i)).toBeVisible()
})
