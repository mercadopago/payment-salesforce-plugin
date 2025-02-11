export const deleteOneSavedCard = async (page) => {
  await page.getByLabel('Delete Payment', { exact: true }).first().click();
  await page.waitForSelector('.modal-dialog', { timeout: 5000 } )
  await page.getByText('Yes').click();
};