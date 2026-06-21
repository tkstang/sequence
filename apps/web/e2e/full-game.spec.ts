import { expect, test } from '@playwright/test';

import {
  closeTestDb,
  createRemoteGame,
  joinAsGuest,
  seedNearWin,
  trpcMutation,
} from './helpers.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);

test.describe('remote game critical path', () => {
  test.skip(!hasTestDb, 'DATABASE_URL_TEST is required for DB-backed e2e');

  test.afterAll(async () => {
    await closeTestDb();
  });

  test('guest joins, host plays the winning move, and both browsers finish', async ({
    browser,
  }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();
    const { host, gameId, inviteCode } = await createRemoteGame(
      hostContext,
      'Host',
    );

    await joinAsGuest(guestPage, inviteCode, 'Guest');
    await trpcMutation('game.start', { gameId }, host.cookie);
    await seedNearWin(gameId);

    await hostPage.goto(`/game/${gameId}`);
    await expect(
      hostPage.getByRole('grid', { name: /sequence board/i }),
    ).toBeVisible();
    await guestPage.goto(`/game/${gameId}`);
    await expect(
      guestPage.getByRole('grid', { name: /sequence board/i }),
    ).toBeVisible();

    await hostPage.getByRole('button', { name: /^TC$/ }).dispatchEvent('click');
    const winningCell = hostPage.locator('[data-position="1TC"]');
    await expect(winningCell).toHaveAttribute('data-highlight', 'valid-target');
    await winningCell.dispatchEvent('click');

    await expect(hostPage.getByText('Team 1 wins')).toBeVisible();
    await expect(guestPage.getByText('Team 1 wins')).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });
});
