export const fillCardData = async (page, cardData) => {
  await page.getByPlaceholder("Name of the buyer").fill(cardData.name);
  await page.getByPlaceholder("Card number").fill(cardData.number);
  await page.getByLabel("Expiration Month").selectOption(cardData.month);
  await page.getByLabel("Expiration Year").selectOption(cardData.year);
  await page.getByPlaceholder("Security code").fill(cardData.code);
  await page.waitForTimeout(2000);
}

export const fillDocumentData = async (page, cardData) => {
  await page.getByPlaceholder("Number of ID").fill(cardData.document);
}
