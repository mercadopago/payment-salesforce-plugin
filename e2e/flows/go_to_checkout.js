import { expect } from "@playwright/test";
import productData from "../data/product";

async function goToCheckout(page, storeUrl) {
  await page.goto(storeUrl);
  await page.locator("div.minicart").click();
  expect(page.locator("div.line-item-name").first()).toContainText(productData.name);
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.waitForTimeout(2000);

}

export default goToCheckout;
