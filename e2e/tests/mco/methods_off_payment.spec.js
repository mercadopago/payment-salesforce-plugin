import { test, expect } from '@playwright/test';
import addProductToCart from "../../flows/add_mco_to_cart";
import goToCheckout from "../../flows/go_to_checkout_mco";
import fillGuestEmail from "../../flows/fill_guest_email";
import fillShippingForm from "../../flows/fill_shipping_form";
import { fillDocumentDataEs } from '../../flows/fill_off_document';
import { base, mco } from "../../data/stores";

test('test create payment with Efecty', async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, mco.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await page.getByRole('tab', { name: 'Efectivo Efectivo' }).click();
  await fillDocumentDataEs(page, process.env.DOC_OUTRO);
  await page.locator('li').filter({ hasText: 'Efecty' }).locator('#payment_methods_off').check();
  await page.getByRole('button', { name: 'Next: Place Order' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.locator('#maincontent')).toContainText('Dónde pagar: Efecty');
  await page.getByRole('button', { name: 'Abrir ticket' }).click();
  await expect(page.locator('#mercadopago-client')).toContainText('Paga $57.74')
});