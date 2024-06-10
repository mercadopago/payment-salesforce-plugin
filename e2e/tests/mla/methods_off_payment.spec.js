import { test, expect } from '@playwright/test';
import addProductToCart from "../../flows/add_to_cart";
import goToCheckout from "../../flows/go_to_checkout";
import fillGuestEmail from "../../flows/fill_guest_email";
import fillShippingForm from "../../flows/fill_shipping_form";
import { fillDocumentDataEs } from '../../flows/fill_off_document';
import { base, mla } from "../../data/stores";

test('test create payment with pagofacil', async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, mla.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await fillDocumentDataEs(page, process.env.DOC_OUTRO);
  await page.locator('li').filter({ hasText: 'Pago Fácil' }).locator('#payment_methods_off').check();
  await page.getByRole('button', { name: 'Next: Place Order' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.locator('#maincontent')).toContainText('Dónde pagar: Pago Fácil');
  await page.getByRole('button', { name: 'Abrir ticket' }).click();
  await expect(page.locator('#mercadopago-client')).toContainText('Pagá $ 57,74 en una sucursal de Pago Fácil')
});

test('test create payment with rapipago', async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, mla.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await fillDocumentDataEs(page, process.env.DOC_OUTRO);
  await page.locator('li').filter({ hasText: 'Rapipago' }).locator('#payment_methods_off').check();
  await page.getByRole('button', { name: 'Next: Place Order' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.locator('#maincontent')).toContainText('Dónde pagar: Rapipago');
  await page.getByRole('button', { name: 'Abrir ticket' }).click();
  await expect(page.locator('#mercadopago-client')).toContainText('Pagá $ 57,74 en tu sucursal de Rapipago más cercana');
});