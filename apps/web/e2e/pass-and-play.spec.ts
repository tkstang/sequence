import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import {
  closeTestDb,
  createLocalGame,
  playFirstHighlightedMove,
  seedOpeningHand,
} from './helpers.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);

test.describe('pass-and-play and hard mode', () => {
  test.skip(!hasTestDb, 'DATABASE_URL_TEST is required for DB-backed e2e');

  test.afterAll(async () => {
    await closeTestDb();
  });

  test('local handoff hides the outgoing hand at desktop and 375px', async ({
    page,
  }) => {
    const suffix = `${Date.now()}-${test.info().project.name}`;
    await page.goto('/signup');
    await page.getByLabel('Name').fill('Host');
    await page.getByLabel('Email').fill(`host-${suffix}@example.com`);
    await page.getByLabel('Password').fill('supersecret123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/create?local=1');
    await page.getByLabel('Opponent name').fill('Guest');
    await page.getByRole('button', { name: 'Start local game' }).click();
    await expect(page).toHaveURL(/\/game\/[0-9a-f-]+$/);

    const board = page.getByRole('grid', { name: /sequence board/i });
    await expect(board).toBeVisible();
    await expect(page.getByLabel('Your hand')).toBeVisible();
    await expect(page.getByText(/\d\/2 connected/)).toBeVisible();

    await expectWithinViewport(page, board);
    await expectWithinViewport(page, page.getByLabel('Your hand'));

    await playFirstHighlightedMove(page);
    await expect(
      page.getByRole('button', { name: /show hand/i }),
    ).toBeVisible();
    await expect(page.getByLabel('Your hand')).toHaveCount(0);
    await page.getByRole('button', { name: /show hand/i }).click();
    await expect(page.getByLabel('Your hand')).toBeVisible();
  });

  test('hard-mode chip drag plays through the browser', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const { gameId } = await createLocalGame(context, 'DragHost', 'drag');
    await seedOpeningHand(gameId, [{ rank: 'T', suit: 'C' }]);

    await page.goto(`/game/${gameId}`);
    await expect(
      page.getByRole('grid', { name: /sequence board/i }),
    ).toBeVisible();
    await expect(page.locator('[data-highlight="valid-target"]')).toHaveCount(
      0,
    );

    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    await page
      .getByRole('button', { name: /drag chip to board/i })
      .dispatchEvent('dragstart', { dataTransfer });
    await page.locator('[data-position="1TC"]').dispatchEvent('dragover', {
      dataTransfer,
    });
    await page.locator('[data-position="1TC"]').dispatchEvent('drop', {
      dataTransfer,
    });
    await page
      .getByRole('button', { name: /drag chip to board/i })
      .dispatchEvent('dragend', { dataTransfer });

    await expect(
      page.locator('[data-position="1TC"] [aria-label="Team 1 chip"]'),
    ).toBeVisible();

    await context.close();
  });
});

async function expectWithinViewport(page: Page, locator: Locator) {
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();
  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();
  if (!viewport || !box) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
}
