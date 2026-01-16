
export const fillDocumentData = async (page, docNumber) => {
  await page.locator('li[data-method-id="CASH"] a').click();
  await page.locator('#docTypeMethodsOff').selectOption('CPF');
  await page.locator('#docNumberMethodsOff').fill(docNumber);
  await page.locator('.methods-off-places input[type="radio"]').first().check();
}
