import { test, expect } from '@playwright/test';
import addProductToCart from "../../flows/add_to_cart";
import goToCheckout from "../../flows/go_to_checkout";
import fillGuestEmail from "../../flows/fill_guest_email";
import fillShippingForm from "../../flows/fill_shipping_form";
import { fillDocumentDataPt } from '../../flows/fill_off_document';
import { base, mlb } from "../../data/stores";

test('test create payment with pagofacil', async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, mlb.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await fillDocumentDataPt(page, process.env.CPF);
  await page.locator('#payment_methods_off').first().check();
  await page.getByRole('button', { name: 'Next: Place Order' }).click();
  await expect(page.locator('#checkout-main')).toContainText('Via boleto em Boleto');
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.locator('#maincontent')).toContainText('Onde pagar: Boleto');
});

test('test create payment with rapipago', async ({ page }) => {
  await addProductToCart(page, base.storeUrl);
  await goToCheckout(page, mlb.storeUrl);
  await fillGuestEmail(page);
  await fillShippingForm(page);
  await fillDocumentDataEs(page, process.env.CPF);
  await page.locator('li').filter({ hasText: 'Pagamento na lotérica sem' }).locator('#payment_methods_off').check();
  await page.getByRole('button', { name: 'Next: Place Order' }).click();
  await expect(page.locator('#checkout-main')).toContainText('Via boleto em Pagamento na lotérica sem boleto');
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.locator('#maincontent')).toContainText('Onde pagar: Pagamento na lotérica sem boleto');
  await page.getByRole('button', { name: 'Abrir boleto' }).click();
  await expect(page.locator('#mercadopago-client')).toContainText('Pague R$ 44,09 na lotérica mais próxima.');

});