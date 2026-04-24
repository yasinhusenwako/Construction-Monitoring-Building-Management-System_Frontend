import { test, expect, Page } from '@playwright/test';

const CREDENTIALS: Record<string, { email: string; password: string }> = {
  admin: { email: 'admin@csbms.com', password: 'password123' },
  user: { email: 'user@csbms.com', password: 'password123' },
  supervisor: { email: 'supervisor@csbms.com', password: 'password123' },
  professional: { email: 'professional@csbms.com', password: 'password123' },
};

/**
 * Logs in via the backend API directly, then injects the session into the browser.
 * This is far more reliable than clicking through the UI for workflow automation tests.
 */
async function loginAs(page: Page, role: string) {
  const creds = CREDENTIALS[role];
  // 1. Call the backend API directly to get a JWT token
  const response = await page.request.post('http://127.0.0.1:8080/api/auth/login', {
    data: { email: creds.email, password: creds.password },
  });
  expect(response.ok(), `Login API failed for ${role}: ${response.status()}`).toBeTruthy();
  const payload = await response.json();

  // 2. Inject the token and user data into sessionStorage/localStorage
  await page.goto('/login'); // Need a page context to run JS
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

  // 3. Navigate to dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
}

test.describe('Project Workflow: Admin -> Professional -> Admin', () => {
  test.describe.configure({ mode: 'serial' });

  test('Step 1: Admin assigns a Submitted project to Professional', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard/projects');
    await page.waitForLoadState('networkidle');

    // Find project with UNDER_REVIEW or Submitted status
    const row = page.locator('tr').filter({ hasText: /Submitted|Under Review|SUBMITTED|UNDER_REVIEW/ }).first();
    
    if (await row.count() === 0) {
      console.log('No actionable projects found — skipping.');
      test.skip();
    }
    
    await expect(row).toBeVisible({ timeout: 15000 });
    
    // Get the project ID from the first cell
    const projectId = await row.locator('td').first().innerText();
    console.log(`Acting on project: ${projectId}`);
    
    // Click the row to view the project detail page
    await row.click();
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/project-step1-detail.png' });
    
    // Look for action buttons
    const pageContent = await page.content();
    console.log('Page has Professional Actions:', pageContent.includes('Professional'));
    console.log('Page has Start Review:', pageContent.includes('Start Review'));
    console.log('Page has Assign:', pageContent.includes('Assign'));
  });
});
