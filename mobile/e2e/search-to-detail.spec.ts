import { Locator, Page, test, expect } from '@playwright/test';

// React Navigation's native-stack keeps previous screens mounted-but-hidden in the DOM
// (for back-swipe/animation), so a plain text locator can match a stale, hidden instance
// from a screen underneath. This picks out the one actual visible match.
async function visible(page: Page, text: string | RegExp): Promise<Locator> {
  let found: Locator | undefined;
  await expect
    .poll(
      async () => {
        for (const candidate of await page.getByText(text).all()) {
          if (await candidate.isVisible()) {
            found = candidate;
            return true;
          }
        }
        return false;
      },
      { timeout: 10_000 }
    )
    .toBe(true);
  return found!;
}

test('searching for a dish and opening its detail page', async ({ page }) => {
  await page.goto('/');

  // Deliberately not a Popular Dishes entry (e.g. "Chicken Biryani") - it would also appear
  // in the Home screen's Popular Dishes grid, adding another match to disambiguate.
  const searchInput = page.getByPlaceholder('Search for a dish, e.g. Paneer Butter Masala');
  await searchInput.fill('malabar paratha');
  await searchInput.press('Enter');

  const result = await visible(page, 'Malabar Paratha');
  await result.click();

  await visible(page, /kcal/i);
});

test('searching for a nonsense dish shows an empty state', async ({ page }) => {
  await page.goto('/');

  const searchInput = page.getByPlaceholder('Search for a dish, e.g. Paneer Butter Masala');
  await searchInput.fill('zzxxqqnotarealdish');
  await searchInput.press('Enter');

  await expect(page.getByText(/couldn't confidently identify/i)).toBeVisible({ timeout: 10_000 });
});
