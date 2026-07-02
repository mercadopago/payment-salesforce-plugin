
export const fillDocumentDataWithType = async (page, docType, docNumber) => {
  await page.locator('li[data-method-id="CASH"] a').click();
  await page.locator('#docTypeMethodsOff').selectOption(docType);
  await page.locator('#docNumberMethodsOff').fill(docNumber);
  await page.locator('.methods-off-places input[type="radio"]').first().check();
};

export const fillDocumentData = async (page, docNumber) =>
  fillDocumentDataWithType(page, 'CPF', docNumber);
