export const fillDocumentDataEs = async (page, docNumber) => {
  await page.getByRole('tab', { name: 'Efectivo Efectivo' }).click();
  await page.locator('#docTypeMethodsOff').selectOption('Otro');
  await page.getByRole('textbox', { name: '*Número del documento de' }).click();
  await page.getByRole('textbox', { name: '*Número del documento de' }).fill(docNumber);
}

export const fillDocumentDataPt = async (page, docNumber) => {
  await page.getByRole('tab', { name: 'Boleto Boleto' }).click();
  await page.locator('#docTypeMethodsOff').selectOption('CPF');
  await page.getByRole('textbox', { name: '*Número do documento de' }).click();
  await page.getByRole('textbox', { name: '*Número do documento de' }).fill(docNumber);
}

export const fillDocumentDataUs = async (page, docNumber) => {
  await page.getByRole('tab', { name: 'Invoice Invoice' }).click();
  await page.locator('#docTypeMethodsOff').selectOption('Otro');
  await page.getByRole('textbox', { name: '*Number of ID' }).click();
  await page.getByRole('textbox', { name: '*Number of ID' }).fill(docNumber);
}
