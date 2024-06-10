import { test, expect } from "@playwright/test";
import addProductToCart from "../../flows/add_to_cart";
import goToCheckout from "../../flows/go_to_checkout";
import fillGuestEmail from "../../flows/fill_guest_email";
import fillShippingForm from "../../flows/fill_shipping_form";
import { fillCardData, fillDocumentData } from "../../flows/fill_card_form";
import { amexApro, masterApro } from "../../data/credit_card";
import { base, mlb } from "../../data/stores";

test("test success pay as guest with amex", async ({ page }) => {
  const storeUrl = base.storeUrl;
  await addProductToCart(page, storeUrl);
  await goToCheckout(page, storeUrl);
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
  const storeUrl = base.storeUrl;
  await addProductToCart(page, storeUrl);
  await goToCheckout(page, storeUrl);
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
