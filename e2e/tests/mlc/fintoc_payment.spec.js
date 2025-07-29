import { test, expect } from "@playwright/test";
import { addProductToCart } from "../../flows/add_mco_to_cart";
import goToCheckout from "../../flows/go_to_checkout_mco";
import fillGuestEmail from "../../flows/fill_guest_email";
import fillShippingForm from "../../flows/fill_shipping_form";
import { base, mlc } from "../../data/stores";

test("test success with fintoc", async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, base.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await page.getByRole('tab', { name: 'Pay quickly and securely with' }).click();
  await page.getByRole("button", { name: "Next: Place Order" }).click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Place Order" }).click();
  await page.waitForTimeout(10000);
  await expect(page.frameLocator('iframe[title="Fintoc Widget"]').getByText('Selecciona tu banco')).toBeVisible();
});