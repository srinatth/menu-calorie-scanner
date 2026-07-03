import { test, expect } from '@playwright/test';

test('home screen loads with search bar and title', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Menu Calorie Scanner')).toBeVisible();
  await expect(page.getByPlaceholder('Search for a dish, e.g. Paneer Butter Masala')).toBeVisible();
  await expect(page.getByText('Scan Menu')).toBeVisible();
});
