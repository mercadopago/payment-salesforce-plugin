export const fillCardData = async (page, cardData) => {
  const addPayment = page.getByText('Add Payment');
  if( await addPayment.isVisible() ) {
    await addPayment.click();
  }
  await page.getByPlaceholder("Name of the buyer").fill(cardData.name);
  await page.getByPlaceholder("Card number").fill(cardData.number);
  await page.getByLabel("Expiration Month").selectOption(cardData.month);
  await page.getByLabel("Expiration Year").selectOption(cardData.year);
  await page.getByPlaceholder("Security code").fill(cardData.code);
  await fillCardDataLogged(page);
}

const fillCardDataLogged = async (page) => {
  const saveCard = page.getByRole('checkbox', { name: 'Save Card to Account' });
  if( await saveCard.isVisible() ) {
    if( ! await saveCard.isChecked() ) {
      await saveCard.click();
    }
  }
  await page.waitForTimeout(2000);
}

export const fillDocumentData = async (page, cardData) => {
  const documentROLA = page.locator('Otro').first();

  if( ! await documentROLA.isVisible() ) {
    await page.locator('#docType').selectOption('Otro');
  }

  await page.getByPlaceholder("Number of ID").fill(cardData.document);
}

export const fillDocumentDataBr = async (page, cardData) => {
  await page.getByPlaceholder("Number of ID").fill(cardData.document);
}

export const selectSavedCard = async (page, cardData) => {
  await page.getByText('Credit ' + cardData.cardName).first().click();
  await page
    .locator('div.row.saved-payment-instrument.selected-payment')
    .getByRole('textbox', { name: 'Security code' })
    .fill(cardData.code);
}