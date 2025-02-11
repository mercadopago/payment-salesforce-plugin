import { expect } from "@playwright/test";

export const validateSavedCard = async (page, cardData) => {
  await page.getByLabel('My Account', { exact: true }).click();
  await page.getByLabel('My account navigation').getByText('My Account').click();
  await page.waitForTimeout(3000);
  await expect(page.locator('#maincontent')).toContainText('Credit ' + cardData.cardType);
  await page.getByLabel('View saved payment methods').click();
  await page.waitForTimeout(1500);
  await expect(page.locator('#maincontent')).toContainText('Credit ' + cardData.cardType);
}