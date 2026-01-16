import { test, expect } from '@playwright/test';
import { addProductToCart } from "../../flows/add_to_cart";
import goToCheckout from "../../flows/go_to_checkout";
import fillGuestEmail from "../../flows/fill_guest_email";
import fillShippingForm from "../../flows/fill_shipping_form";
import { fillDocumentData } from '../../flows/fill_off_document';
import { base, mlb } from "../../data/stores";

test('test create payment with Boleto', async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, mlb.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await fillDocumentData(page, process.env.CPF);
  await page.locator('#payment_methods_off').first().check();
  await page.getByRole('button', { name: 'Next: Place Order' }).click();
  await expect(page.locator('#checkout-main')).toContainText('Via invoice at Boleto');
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.locator('#maincontent')).toContainText('Where to pay: Boleto');
});