import { test, expect } from "@playwright/test";
import { addProductToCart } from "../../flows/add_to_cart";
import goToCheckout from "../../flows/go_to_checkout";
import fillGuestEmail from "../../flows/fill_guest_email";
import fillShippingForm from "../../flows/fill_shipping_form";
import { base, mlm } from "../../data/stores";

test('test create payment with OXXO', async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, mlm.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await page.getByRole('tab', { name: 'Efectivo Efectivo' }).click();
  await page.locator('li').filter({ hasText: 'OXXO' }).locator('#payment_methods_off').check();
  await page.getByRole('button', { name: 'Next: Place Order' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.locator('#maincontent')).toContainText('Dónde pagar: OXXO');
  await page.getByRole('button', { name: 'Abrir ticket' }).click();
  await expect(page.locator('#mercadopago-client')).toContainText('en la tienda OXXO más cercana')
});

test('test create payment with Citibanamex', async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, mlm.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await page.getByRole('tab', { name: 'Efectivo Efectivo' }).click();
  await page.getByRole('button', { name: 'Más opciones' }).click();
  await page.locator('li').filter({ hasText: 'Citibanamex' }).locator('#payment_methods_off').check();
  await page.getByRole('button', { name: 'Next: Place Order' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.locator('#maincontent')).toContainText('Dónde pagar: Citibanamex');
  await page.getByRole('button', { name: 'Abrir ticket' }).click();
  await expect(page.locator('#mercadopago-client')).toContainText('en la sucursal Citibanamex más cercana')
});

test('test create payment with STP', async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, mlm.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await page.getByRole('tab', { name: 'Efectivo Efectivo' }).click();
  await page.getByRole('button', { name: 'Más opciones' }).click();
  await page.locator('li').filter({ hasText: 'STP' }).locator('#payment_methods_off').check();
  await page.getByRole('button', { name: 'Next: Place Order' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.locator('#maincontent')).toContainText('Dónde pagar: STP');
  await page.getByRole('button', { name: 'Abrir ticket' }).click();
  await expect(page.locator('#mercadopago-client')).toContainText('para finalizar tu compra')
});

test('test create payment with 7 Eleven', async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, mlm.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await page.getByRole('tab', { name: 'Efectivo Efectivo' }).click();
  await page.locator('li').filter({ hasText: 'Eleven' }).locator('#payment_methods_off').check();
  await page.getByRole('button', { name: 'Next: Place Order' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.locator('#maincontent')).toContainText('Dónde pagar: 7 Eleven');
  await page.getByRole('button', { name: 'Abrir ticket' }).click();
  await expect(page.locator('#mercadopago-client')).toContainText('Paga')
});