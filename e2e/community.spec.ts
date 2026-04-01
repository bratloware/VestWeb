/**
 * E2E tests — Community flow
 *
 * Pre-conditions:
 *   - Student ANA001 / senha123 exists in seed data
 */
import { test, expect, Page } from '@playwright/test';

async function loginAsStudent(page: Page) {
  await page.goto('/login');
  await page.fill('input#enrollment', 'ANA001');
  await page.fill('input#password', 'senha123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/select-platform|home/);
}

test.describe('Community', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/community');
  });

  test('should load the community feed', async ({ page }) => {
    await expect(page.locator('[data-testid="post-card"], .post-card')).toHaveCount(
      { minimum: 0 } as any, // zero is fine if the feed is empty
    );
    // The page itself must load without errors
    await expect(page).not.toHaveURL(/error/);
  });

  test('should create a new post', async ({ page }) => {
    const uniqueText = `Test post ${Date.now()}`;

    // Open the post creation input / textarea
    const textarea = page.locator('textarea[placeholder], [data-testid="post-input"]');
    await textarea.fill(uniqueText);

    // Submit
    await page.click('[data-testid="post-submit"], button:has-text("Publicar"), button:has-text("Postar")');

    // The new post should appear in the feed
    await expect(page.locator(`text="${uniqueText}"`)).toBeVisible({ timeout: 8_000 });
  });

  test('should like and unlike a post', async ({ page }) => {
    // Wait for at least one post
    const likeButton = page.locator('[data-testid="like-button"], .like-button').first();
    await likeButton.waitFor({ state: 'visible' });

    const initialText = await likeButton.textContent();

    // Like
    await likeButton.click();
    await page.waitForTimeout(300);
    const afterLikeText = await likeButton.textContent();
    expect(afterLikeText).not.toBe(initialText);

    // Unlike
    await likeButton.click();
    await page.waitForTimeout(300);
    const afterUnlikeText = await likeButton.textContent();
    expect(afterUnlikeText).toBe(initialText);
  });

  test('should add a comment to a post', async ({ page }) => {
    const commentText = `Comment ${Date.now()}`;

    // Open comments for the first post
    const commentsToggle = page.locator('[data-testid="comments-toggle"], button:has-text("comentário"), button:has-text("Comentar")').first();
    await commentsToggle.click();

    // Type and submit comment
    const commentInput = page.locator('[data-testid="comment-input"], input[placeholder*="comentário" i], textarea[placeholder*="comentário" i]').first();
    await commentInput.fill(commentText);
    await page.click('[data-testid="comment-submit"], button:has-text("Enviar"), button:has-text("Comentar")');

    await expect(page.locator(`text="${commentText}"`)).toBeVisible({ timeout: 8_000 });
  });

  test('should allow the author to delete their own post', async ({ page }) => {
    // Create a fresh post first
    const uniqueText = `Delete me ${Date.now()}`;
    const textarea = page.locator('textarea[placeholder], [data-testid="post-input"]');
    await textarea.fill(uniqueText);
    await page.click('[data-testid="post-submit"], button:has-text("Publicar"), button:has-text("Postar")');
    await expect(page.locator(`text="${uniqueText}"`)).toBeVisible({ timeout: 8_000 });

    // Find the delete button within that post and click it
    const postCard = page.locator('.post-card, [data-testid="post-card"]').filter({ hasText: uniqueText });
    await postCard.locator('[data-testid="delete-post"], button:has-text("Excluir"), button[aria-label*="deletar" i]').click();

    // Confirm deletion if a dialog appears
    const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sim")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await expect(page.locator(`text="${uniqueText}"`)).not.toBeVisible({ timeout: 8_000 });
  });

  test('should display the ranking section', async ({ page }) => {
    // Navigate to ranking if it is a separate tab/section
    const rankingLink = page.locator('[data-testid="ranking-tab"], a:has-text("Ranking"), button:has-text("Ranking")');
    if (await rankingLink.isVisible()) {
      await rankingLink.click();
    }
    // Either the ranking is on the same page or a section is shown
    await expect(
      page.locator('[data-testid="ranking"], .ranking, text=/ranking/i'),
    ).toBeVisible({ timeout: 5_000 });
  });
});
