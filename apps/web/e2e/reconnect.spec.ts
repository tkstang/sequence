import { expect, test } from '@playwright/test';

import {
  closeTestDb,
  createLocalGame,
  playFirstHighlightedMove,
} from './helpers.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);

test.describe('reconnect recovery', () => {
  test.skip(!hasTestDb, 'DATABASE_URL_TEST is required for DB-backed e2e');

  test.afterAll(async () => {
    await closeTestDb();
  });

  test('reload recovers the current active game snapshot', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const { gameId } = await createLocalGame(context, 'ReloadHost');

    await page.goto(`/game/${gameId}`);
    const board = page.getByRole('grid', { name: /sequence board/i });
    await expect(board).toBeVisible();
    await playFirstHighlightedMove(page);
    await expect(
      page.getByRole('button', { name: /show hand/i }),
    ).toBeVisible();

    await page.reload();
    await expect(board).toBeVisible();
    await expect(page.getByText(/\d\/2 connected/)).toBeVisible();

    await context.close();
  });
});
