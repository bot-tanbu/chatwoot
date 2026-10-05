import { test, expect } from '@playwright/test';

const allowedBaseURL = new URL(process.env.BASE_URL || 'http://localhost:3000');
if (!['localhost', '127.0.0.1', '[::1]'].includes(allowedBaseURL.hostname)) {
  throw new Error('Public landing tests must run against localhost.');
}

test.describe('Public disaster reporting landing', () => {
  test('opens WhatsApp reporting without requiring a website account', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'laporan Anda berarti.'
    );
    await expect(
      page.getByRole('img', { name: 'Tanah Bumbu BerAKSI', exact: true })
    ).toBeVisible();
    await page
      .getByRole('link', { name: 'Cara melapor', exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/#cara-melapor$/);
    await expect(
      page.getByRole('heading', { name: 'Melapor itu sederhana.' })
    ).toBeVisible();
    await page.route('https://wa.me/**', route =>
      route.fulfill({ status: 200, body: 'WhatsApp handoff verified' })
    );
    await page
      .getByRole('link', { name: 'Laporkan via WhatsApp', exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/^https:\/\/wa\.me\/[1-9]\d{7,14}\?text=/);
    const destination = new URL(page.url());
    expect(destination.searchParams.get('text')).toBe(
      'Halo BPBD Tanah Bumbu, saya ingin melaporkan kejadian bencana.'
    );
  });

  test('provides accessible guidance when WhatsApp cannot open', async ({
    page,
  }) => {
    await page.goto('/');
    const question = page.getByText('Bagaimana jika WhatsApp tidak terbuka?', {
      exact: true,
    });
    const answer = page.getByText('Pastikan WhatsApp terpasang', {
      exact: false,
    });
    await expect(answer).toBeHidden();
    await question.focus();
    await page.keyboard.press('Enter');
    await expect(answer).toBeVisible();
    await expect(answer).toContainText('memulai percakapan secara manual');
    await page.keyboard.press('Enter');
    await expect(answer).toBeHidden();
  });
});
