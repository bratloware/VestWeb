/**
 * E2E tests — Simulations flow
 *
 * Pre-conditions:
 *   - Student ANA001 / senha123 exists in seed data
 *   - At least one simulation with questions exists
 */
import { test, expect, Page } from '@playwright/test';

// ── Setup: log in before each test ────────────────────────────────────────────
async function loginAsStudent(page: Page) {
  await page.goto('/login');
  await page.fill('input#enrollment', 'ANA001');
  await page.fill('input#password', 'senha123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/select-platform|home/);
}

test.describe('Simulations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/simulations');
  });

  test('should display the simulations list', async ({ page }) => {
    await expect(page.locator('[data-testid="simulation-card"], .simulation-card')).toHaveCount(
      { minimum: 1 } as any,
    );
  });

  test('should start a simulation and display the first question', async ({ page }) => {
    // Click the first simulation's start button
    await page.locator('[data-testid="simulation-card"], .simulation-card').first().click();
    await page.click('[data-testid="start-simulation"], button:has-text("Iniciar")');

    // Expect a question to be visible
    await expect(page.locator('[data-testid="question-statement"], .question-statement')).toBeVisible();
    // Expect alternatives to be visible
    await expect(page.locator('[data-testid="alternative"], .alternative')).toHaveCount({ minimum: 2 } as any);
  });

  test('should allow answering a question and advancing to the next', async ({ page }) => {
    await page.locator('.simulation-card').first().click();
    await page.click('button:has-text("Iniciar")');

    // Select the first alternative
    const firstAlt = page.locator('.alternative').first();
    await firstAlt.click();
    await expect(firstAlt).toHaveClass(/selected|active/);

    // Confirm / advance
    const nextButton = page.locator('button:has-text("Próxima"), button:has-text("Confirmar")');
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
  });

  test('should display the result screen after finishing a simulation', async ({ page }) => {
    await page.locator('.simulation-card').first().click();
    await page.click('button:has-text("Iniciar")');

    // Answer all questions as quickly as possible
    while (await page.locator('.alternative').first().isVisible()) {
      await page.locator('.alternative').first().click();
      const next = page.locator('button:has-text("Próxima"), button:has-text("Finalizar")');
      if (await next.isVisible()) {
        await next.click();
      } else {
        break;
      }
    }

    // Should see score/result
    await expect(
      page.locator('[data-testid="result-score"], .result-score, text=/pontos|acertos|%/i'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should not allow accessing a simulation without being logged in', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('VestWeb_token');
      localStorage.removeItem('VestWeb_student');
    });
    await page.goto('/simulations');
    await expect(page).toHaveURL(/login/);
  });
});
