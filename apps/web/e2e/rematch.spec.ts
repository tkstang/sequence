import { expect, test } from '@playwright/test';

import { closeTestDb, seedFinishedGame, signUpAccount } from './helpers.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);

test.describe('rematch route', () => {
  test.skip(!hasTestDb, 'DATABASE_URL_TEST is required for DB-backed e2e');

  test.afterAll(async () => {
    await closeTestDb();
  });

  test('rematch routes to a new game with the same roster retained', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const host = await signUpAccount(context, 'Host');
    const joinerContext = await browser.newContext();
    const joiner = await signUpAccount(joinerContext, 'Joiner');
    const { gameId } = await seedFinishedGame({
      hostUserId: host.userId,
      joinerUserId: joiner.userId,
    });
    const page = await context.newPage();

    await page.goto(`/game/${gameId}`);
    await expect(page.getByText('Team 1 wins')).toBeVisible();
    await page.getByRole('button', { name: /rematch/i }).click();
    await expect(page).toHaveURL(/\/game\/[0-9a-f-]+$/);
    await expect(page.locator('main')).toContainText('Host');
    await expect(page.locator('main')).toContainText('Joiner');

    await context.close();
    await joinerContext.close();
  });
});
