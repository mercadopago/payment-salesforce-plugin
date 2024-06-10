import { expect } from "@playwright/test";
import productData from "../data/product_mco";

async function addToCart(page, storeUrl) {
  await page.goto(storeUrl);
  await page.getByRole("button", { name: "Yes" }).click();
  await page.getByText(productData.name).click();
  await page.getByLabel('Quantity').selectOption('10');
  await expect(page.locator("h1.product-name").first()).toContainText(productData.full_name);
  await page.getByRole("button", { name: " Add to Cart" }).click();
}

export default addToCart;
