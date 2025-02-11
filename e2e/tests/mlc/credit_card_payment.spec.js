import { test, expect } from "@playwright/test";
import { addProductToCart } from "../../flows/add_to_cart";
import goToCheckout from "../../flows/go_to_checkout";
import fillGuestEmail from "../../flows/fill_guest_email";
import fillShippingForm from "../../flows/fill_shipping_form";
import { fillCardData } from "../../flows/fill_card_form";
import { amexApro, masterApro } from "../../data/credit_card";
import { base, mlc } from "../../data/stores";
import { cleanUser } from "../../data/user";
import filShippingForm from "../../flows/fill_shipping_form";
import { fillLoginForm } from "../../flows/fill_login_form";
import { addProductToLoggedCart } from "../../flows/add_to_cart";
import { deleteOneSavedCard } from "../../flows/delete_one_saved_card";
import { fillDocumentData } from "../../flows/fill_card_form";

test("test success pay as guest with amex", async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, base.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await fillCardData(page, amexApro);
  await fillDocumentData(page, amexApro);
  await page.getByRole("button", { name: "Next: Place Order" }).click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Place Order" }).click();
  await expect(page.locator("h1")).toContainText("Thank You");
  await expect(page.locator("#maincontent")).toContainText("Credit American Express");
});
test("test success pay as guest with master", async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, base.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await fillCardData(page, masterApro);
  await fillDocumentData(page, masterApro);
  await page.getByRole("button", { name: "Next: Place Order" }).click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Place Order" }).click();
  await expect(page.locator("h1")).toContainText("Thank You");
  await expect(page.locator("#maincontent")).toContainText("Credit Master");
});
test('test creates or logs into an account and then saves a new card deleting it right after checkout is finished', async ({ page }) => {
  await fillLoginForm(page, base.storeUrl , cleanUser)
  await addProductToLoggedCart(page, base.storeUrl);
  await goToCheckout(page, base.storeUrl);
  await page.waitForTimeout(3000);
  await filShippingForm(page);
  const addPayment = page.getByText('Add Payment');
  if( await addPayment.isVisible() ) {
    await addPayment.click();
  }
  await fillDocumentData(page, masterApro);
  await fillCardData(page, masterApro);
  await page.waitForTimeout(1000);
  await page.getByText('Next: Place Order').first().click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Place Order' }).click();
  await page.getByLabel('My Account', { exact: true }).click();
  await page.getByLabel('My account navigation').getByText('My Account').click();
  await page.getByLabel('View saved payment methods').click();
  await deleteOneSavedCard(page);
  await expect(page.getByText('No saved payment instruments')).toBeVisible();
  }
);