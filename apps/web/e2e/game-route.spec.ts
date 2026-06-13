import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);

test.describe('game route', () => {
  test.skip(!hasTestDb, 'DATABASE_URL_TEST is required for DB-backed e2e');

  test('creates a local game and keeps the game UI within the viewport', async ({
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
});

async function playFirstHighlightedMove(page: Page) {
  const cardButtons = page.locator(
    'section[aria-label="Your hand"] button[aria-label]:not([aria-label="Raise hand"]):not([aria-label="Lower hand"])',
  );
  const count = await cardButtons.count();
  for (let index = 0; index < count; index++) {
    await cardButtons.nth(index).click();
    const target = page.locator('[data-highlight="valid-target"]').first();
    if ((await target.count()) > 0) {
      await target.click();
      return;
    }
  }
  throw new Error('No highlighted move found in starting hand');
}

async function expectWithinViewport(page: Page, locator: Locator) {
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();
  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();
  if (!viewport || !box) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
}
