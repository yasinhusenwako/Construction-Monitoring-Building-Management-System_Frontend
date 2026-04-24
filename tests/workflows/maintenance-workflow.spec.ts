import { test, expect, Page } from '@playwright/test';

const CREDENTIALS: Record<string, { email: string; password: string }> = {
  admin: { email: 'admin@csbms.com', password: 'password123' },
  user: { email: 'user@csbms.com', password: 'password123' },
  supervisor: { email: 'supervisor@csbms.com', password: 'password123' },
  professional: { email: 'professional@csbms.com', password: 'password123' },
};

async function loginAs(page: Page, role: string) {
  const creds = CREDENTIALS[role];
  const response = await page.request.post('http://127.0.0.1:8080/api/auth/login', {
    data: { email: creds.email, password: creds.password },
  });
  expect(response.ok(), `Login API failed for ${role}: ${response.status()}`).toBeTruthy();
  const payload = await response.json();

  await page.goto('/login');
  await page.evaluate((data) => {
    const sessionUser = {
      id: `USR-${String(data.id).padStart(3, '0')}`,
      userId: data.id,
      name: data.name || data.fullName,
      email: data.email,
      password: '',
      role: data.role.toLowerCase(),
      department: '',
      divisionId: data.divisionId ? `DIV-${String(data.divisionId).padStart(3, '0')}` : undefined,
      backendDivisionId: data.divisionId,
      phone: '',
      avatar: (data.name || data.fullName).split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    sessionStorage.setItem('insa_user', JSON.stringify(sessionUser));
    sessionStorage.setItem('insa_token', data.token);
    localStorage.setItem('insa_token', data.token);
    document.cookie = `insa_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
  }, payload);

  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
}

test.describe('Maintenance Workflow: Admin -> Supervisor -> Professional -> Supervisor -> Admin', () => {
  test.describe.configure({ mode: 'serial' });

  test('Step 1: Admin identifies a Submitted maintenance request', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard/maintenance');
    await page.waitForLoadState('networkidle');

    // Find a maintenance row with actionable status
    const row = page.locator('tr').filter({ hasText: /Submitted|SUBMITTED/ }).first();

    if (await row.count() === 0) {
      console.log('No Submitted maintenance requests found — skipping.');
      test.skip();
    }

    await expect(row).toBeVisible({ timeout: 15000 });

    const mntId = await row.locator('td').first().innerText();
    console.log(`Acting on maintenance: ${mntId}`);

    await row.click();
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/maintenance-step1-detail.png' });

    const pageContent = await page.content();
    console.log('Page has Assign:', pageContent.includes('Assign'));
    console.log('Page has Start Review:', pageContent.includes('Start Review'));
    console.log('Page has Supervisor:', pageContent.includes('Supervisor'));
  });
});
