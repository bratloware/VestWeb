/**
 * E2E tests — Authentication flows
 *
 * Prerequisites:
 *   - Frontend running on http://localhost:5173
 *   - Backend running on http://localhost:3001 (or MSW intercepts)
 *   - Seed data: student ANA001 / senha123, teacher PROF001 / senha123
 */
import { test, expect, Page } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fillLoginForm(page: Page, enrollment: string, password: string) {
  await page.fill('input#enrollment', enrollment);
  await page.fill('input#password', password);
  await page.click('button[type="submit"]');
}

// ── Tests ──────────────────────────────────────────────────────────────────────
test.describe('Student Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('login page should be accessible', async ({ page }) => {
    await expect(page).toHaveTitle(/VestWeb|the best/i);
    await expect(page.locator('input#enrollment')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('should navigate to /select-platform after successful student login', async ({ page }) => {
    await fillLoginForm(page, 'ANA001', 'senha123');
    await expect(page).toHaveURL(/select-platform/);
  });

  test('should display error message for invalid credentials', async ({ page }) => {
    await fillLoginForm(page, 'NONEXISTENT', 'wrongpass');
    await expect(page.locator('.login-error')).toBeVisible();
    await expect(page.locator('.login-error')).toContainText(/inválid/i);
  });

  test('should display error when fields are empty', async ({ page }) => {
    // HTML5 required validation — the form should not submit
    await page.click('button[type="submit"]');
    const enrollmentInput = page.locator('input#enrollment');
    await expect(enrollmentInput).toBeFocused();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.click('.password-toggle');
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await page.click('.password-toggle');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should persist token in localStorage after login', async ({ page }) => {
    await fillLoginForm(page, 'ANA001', 'senha123');
    await page.waitForURL(/select-platform/);
    const token = await page.evaluate(() => localStorage.getItem('VestWeb_token'));
    expect(token).not.toBeNull();
    expect(token).not.toBe('');
  });

  test('should redirect to /login when accessing a protected route unauthenticated', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect already-logged-in user away from /login', async ({ page }) => {
    // Seed localStorage
    await page.evaluate(() => {
      localStorage.setItem('VestWeb_token', 'fake_but_present_token');
      localStorage.setItem('VestWeb_student', JSON.stringify({
        id: 1, role: 'student', name: 'Ana', enrollment: 'ANA001',
      }));
    });
    await page.goto('/login');
    await expect(page).not.toHaveURL(/\/login$/);
  });
});

test.describe('Teacher Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher-login');
  });

  test('should navigate to /teacher/home after successful teacher login', async ({ page }) => {
    await fillLoginForm(page, 'PROF001', 'senha123');
    await expect(page).toHaveURL(/teacher\/home/);
  });

  test('should display error when a student uses the teacher login', async ({ page }) => {
    await fillLoginForm(page, 'ANA001', 'senha123');
    await expect(page.locator('.login-error')).toBeVisible();
  });
});

test.describe('Logout', () => {
  test('should clear token and redirect to / after logout', async ({ page }) => {
    // First login as a student
    await page.goto('/login');
    await fillLoginForm(page, 'ANA001', 'senha123');
    await page.waitForURL(/select-platform/);

    // Find and click the logout button (adjust selector to match actual UI)
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL(/\//);
    const token = await page.evaluate(() => localStorage.getItem('VestWeb_token'));
    expect(token).toBeNull();
  });
});
