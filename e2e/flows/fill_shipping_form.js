import { guestUser } from "../data/user";

async function fillShippingForm(page) {
  const addNew = page.getByRole('button', { name: 'Add New' });
  if( await addNew.isVisible() ) {
    await page.getByRole("button", { name: "Next: Payment" }).click();
  } else {
    await page.getByRole("textbox", { name: "* First Name" }).fill(guestUser.firstName);
    await page.getByRole("textbox", { name: "* Last Name" }).fill(guestUser.lastName);
    await page.getByRole("textbox", { name: "* Address" }).fill(guestUser.address.street);
    await page.locator("#shippingCountrydefault").selectOption(guestUser.address.country);
    await page.locator("#shippingStatedefault").selectOption(guestUser.address.state);
    await page.waitForTimeout(1000);
    await page.getByRole("textbox", { name: "* City" }).fill(guestUser.address.city);
    await page.getByRole("textbox", { name: "* ZIP Code" }).fill(guestUser.address.zipcode);
    await page.waitForTimeout(3000);
    await page.getByRole("textbox", { name: "* Phone Number" }).fill(guestUser.phone);
    await page.getByRole("button", { name: "Next: Payment" }).click();
    await page.waitForTimeout(3000);
  }
}

export default fillShippingForm;
