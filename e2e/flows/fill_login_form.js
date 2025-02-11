import { expect } from "@playwright/test";

async function fillLoginForm(page, storeUrl, user) {
  await page.goto(storeUrl);
  if(page.getByText('Tracking Consent').isVisible) {
    await page.getByRole('button', { name: 'Yes' }).click();
  }
  await createUser(page, user);
  
  const fail = await page.getByText('Username is invalid.').isVisible();
  if(fail === true) {
    await loginUser(page, user);
  }
  await expect(page.locator('#maincontent')).toContainText('First');
}
async function loginUser(page, user) {
  await page.getByRole('tab', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: '* Email' }).fill(user.email);
  await page.getByRole('textbox', { name: '* Password' }).fill(user.pass);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForTimeout(3000);
}

async function createUser(page, user) {
  await page.getByLabel('Login to your account').click();
  await page.getByRole('tab', { name: 'Create Account' }).click();
  await page.getByLabel('First Name').fill('Test');
  await page.getByLabel('Last Name').fill(user.lastName);
  await page.getByPlaceholder('Example:').fill(user.phone);
  await page.getByRole('textbox', { name: '* Email' }).fill(user.email);
  await page.getByLabel('Confirm Email').fill(user.email);
  await page.getByRole('textbox', { name: '* Password' }).fill(user.pass);
  await page.getByLabel('Confirm Password').fill(user.pass);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForTimeout(3000);
}

export { fillLoginForm };
