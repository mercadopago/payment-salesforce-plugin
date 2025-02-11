import { test, expect } from '@playwright/test';
import { addProductToCart } from "../../flows/add_to_cart";
import goToCheckout from "../../flows/go_to_checkout";
import fillGuestEmail from "../../flows/fill_guest_email";
import fillShippingForm from "../../flows/fill_shipping_form";
import { fillDocumentDataEs } from '../../flows/fill_off_document';
import { base, mlu } from "../../data/stores";

test('test create payment with Abitab', async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, mlu.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await fillDocumentDataEs(page, process.env.DOC_OUTRO);
  await page.locator('li').filter({ hasText: 'Abitab' }).locator('#payment_methods_off').check();
  await page.getByRole('button', { name: 'Next: Place Order' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.locator('#maincontent')).toContainText('Dónde pagar: Abitab');
  await page.getByRole('button', { name: 'Abrir ticket' }).click();
  await expect(page.locator('#mercadopago-client')).toContainText('Paga S/ 57.74 de la forma que prefieras')
});

test('test create payment with Redpagos', async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, mlu.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await fillDocumentDataEs(page, process.env.DOC_OUTRO);
  await page.locator('li').filter({ hasText: 'Redpagos' }).locator('#payment_methods_off').check();
  await page.getByRole('button', { name: 'Next: Place Order' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.locator('#maincontent')).toContainText('Dónde pagar: Redpagos');
  await page.getByRole('button', { name: 'Abrir ticket' }).click();
  await expect(page.locator('#mercadopago-client')).toContainText('Paga S/ 57.74 de la forma que prefieras')
});