import { expect } from "@playwright/test";
import productData from "../data/product";
import base from "../data/stores";

async function addToCart(page, storeUrl) {
  await page.goto(storeUrl);
  await page.getByRole("button", { name: "Yes" }).click();
  await page.getByText(productData.name).click();
  await page.getByLabel('Select Size').selectOption(productData.size);
  await expect(page.locator("h1.product-name").first()).toContainText(productData.name);
  await page.getByRole("button", { name: " Add to Cart" }).click();
}

export default addToCart;
