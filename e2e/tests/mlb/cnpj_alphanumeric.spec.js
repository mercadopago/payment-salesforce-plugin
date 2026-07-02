import { test, expect } from "@playwright/test";
import { addProductToCart } from "../../flows/add_to_cart";
import goToCheckout from "../../flows/go_to_checkout";
import fillGuestEmail from "../../flows/fill_guest_email";
import fillShippingForm from "../../flows/fill_shipping_form";
import { fillDocumentDataWithType } from "../../flows/fill_off_document";
import { base, mlb } from "../../data/stores";

// SERPRO/RFB Nota Técnica nº 49 test values — loaded from env, not real company CNPJs.
// CNPJ_ALPHANUM: valid alphanumeric CNPJ (e.g. the SERPRO reference example, DV 35).
// CNPJ_NUMERIC:  valid numeric CNPJ for legacy regression (e.g. 11222333000181, DV 81).
const CNPJ_ALPHANUM_MASKED = process.env.CNPJ_ALPHANUM;
const CNPJ_ALPHANUM_RAW = process.env.CNPJ_ALPHANUM
  ? process.env.CNPJ_ALPHANUM.replace(/[^A-Z0-9]/gi, "").toUpperCase()
  : undefined;
const CNPJ_NUMERIC_MASKED = process.env.CNPJ_NUMERIC;

// Derive an invalid-DV variant from CNPJ_ALPHANUM by replacing the last two digits with "99".
// Works for any 14-char alphanumeric CNPJ whose real DV is not 99.
const CNPJ_INVALID_DV = process.env.CNPJ_ALPHANUM
  ? process.env.CNPJ_ALPHANUM.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 12) + "99"
  : undefined;

test.describe("MLB — Alphanumeric CNPJ in boleto (ticket) checkout", () => {
  // Note: AC-4 (payload identification.type=CNPJ, number raw 14 chars) is verified at unit-test
  // level by processFormPix.test.js, processFormCreditCard.test.js and processFormMethodsOff.test.js,
  // which assert validateDocument() returns the unmasked uppercase value. The E2E tests here cover
  // the UI layer (AC-1, AC-2, AC-3, AC-5, AC-6).

  test.beforeAll(() => {
    if (!process.env.CNPJ_ALPHANUM || !process.env.CNPJ_NUMERIC) {
      throw new Error(
        "Required env vars CNPJ_ALPHANUM and CNPJ_NUMERIC are not set. " +
        "Copy .env.sample to .env and fill in the values before running this suite."
      );
    }
    // CNPJ_INVALID_DV is derived by replacing the real check digits with "99". If the
    // configured CNPJ_ALPHANUM already ends in "99", that derivation would yield a VALID
    // CNPJ and silently break the invalid-DV assertion below.
    if (CNPJ_ALPHANUM_RAW && CNPJ_ALPHANUM_RAW.endsWith("99")) {
      throw new Error(
        "CNPJ_ALPHANUM ending in '99' would invalidate the invalid-DV test. " +
        "Use a CNPJ_ALPHANUM whose check digits are not '99'."
      );
    }
  });

  test("alphanumeric CNPJ (masked) accepted — proceeds to order confirmation", async ({
    page
  }) => {
    await addProductToCart(page, base.storeUrl);
    await goToCheckout(page, mlb.storeUrl);
    await fillGuestEmail(page);
    await fillShippingForm(page);
    await fillDocumentDataWithType(page, "CNPJ", CNPJ_ALPHANUM_MASKED);
    await page.locator("#payment_methods_off").first().check();
    await page.getByRole("button", { name: "Next: Place Order" }).click();
    await expect(page.locator("#checkout-main")).toContainText(
      "Via invoice at Boleto"
    );
    await page.getByRole("button", { name: "Place Order" }).click();
    await expect(page.locator("#maincontent")).toContainText(
      "Where to pay: Boleto"
    );
  });

  test("alphanumeric CNPJ (raw, no mask) accepted — AC-1 field accepts letters without rejection", async ({
    page
  }) => {
    await addProductToCart(page, base.storeUrl);
    await goToCheckout(page, mlb.storeUrl);
    await fillGuestEmail(page);
    await fillShippingForm(page);
    await fillDocumentDataWithType(page, "CNPJ", CNPJ_ALPHANUM_RAW);
    await page.locator("#payment_methods_off").first().check();
    await page.getByRole("button", { name: "Next: Place Order" }).click();
    await expect(page.locator("#checkout-main")).toContainText(
      "Via invoice at Boleto"
    );
    await page.getByRole("button", { name: "Place Order" }).click();
    await expect(page.locator("#maincontent")).toContainText(
      "Where to pay: Boleto"
    );
  });

  test("numeric CNPJ legacy still accepted — AC-5 no regression", async ({
    page
  }) => {
    await addProductToCart(page, base.storeUrl);
    await goToCheckout(page, mlb.storeUrl);
    await fillGuestEmail(page);
    await fillShippingForm(page);
    await fillDocumentDataWithType(page, "CNPJ", CNPJ_NUMERIC_MASKED);
    await page.locator("#payment_methods_off").first().check();
    await page.getByRole("button", { name: "Next: Place Order" }).click();
    await expect(page.locator("#checkout-main")).toContainText(
      "Via invoice at Boleto"
    );
    await page.getByRole("button", { name: "Place Order" }).click();
    await expect(page.locator("#maincontent")).toContainText(
      "Where to pay: Boleto"
    );
  });

  test("invalid CNPJ check digits rejected with visible field error — AC-6", async ({
    page
  }) => {
    await addProductToCart(page, base.storeUrl);
    await goToCheckout(page, mlb.storeUrl);
    await fillGuestEmail(page);
    await fillShippingForm(page);
    await fillDocumentDataWithType(page, "CNPJ", CNPJ_INVALID_DV);
    await page.locator("#payment_methods_off").first().check();
    await page.getByRole("button", { name: "Next: Place Order" }).click();
    // Plugin middleware rejects the wrong DV before reaching the payment API — field becomes is-invalid; checkout does not advance.
    await expect(page.locator("#docNumberMethodsOff")).toHaveClass(/is-invalid/, { timeout: 5000 });
    await expect(page.locator("#checkout-main")).not.toContainText(
      "Via invoice at Boleto"
    );
  });
});
