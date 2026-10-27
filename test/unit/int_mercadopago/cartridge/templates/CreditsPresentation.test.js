const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../../..");
const cartridge = path.join(root, "cartridges/int_mercadopago/cartridge");

// These catalogs use literal UTF-8 values; read their files rather than the Resource mock.
function readCatalog(locale) {
  const suffix = locale ? `_${locale}` : "";
  const contents = fs.readFileSync(path.join(cartridge, `templates/resources/mercadopago${suffix}.properties`), "utf8");
  return Object.fromEntries(contents.split(/\r?\n/).filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).trim()]));
}

describe("Credits presentation approved wording", () => {
  // Literal Salesforce handoff expectations; English naming comes from the cross-platform thread.
  const cases = [
    ["", "Buy now, pay later", "Buy in up to 12 installments without a credit card", "choose the number of installments.", "Access Buy now, pay later", "MLM"],
    ["es", "Mercado Crédito", "Compra ahora y paga después en hasta 12 cuotas", "elige la cantidad de cuotas.", "Accedes a Mercado Crédito", "MLM"],
    ["es_AR", "Mercado Crédito", "Comprá ahora y pagá después en hasta 12 cuotas", "elegí la cantidad de cuotas.", "Accedé a Mercado Crédito", "MLA"],
    ["es_MX", "Mercado Crédito", "Compra ahora y paga después en hasta 12 meses", "elige la cantidad de meses.", "Accedes a Mercado Crédito", "MLM"],
    ["pt_BR", "Mercado Parcelado", "Compre agora e pague depois em até 12 meses", "escolha a quantidade de parcelas.", "Você tem o Mercado Parcelado", "MLB"]
  ];

  cases.forEach(([locale, name, title, installments, benefit, site]) => {
    it(`should use the approved product name and checkout copy in ${locale || "English fallback"}`, () => {
      const catalog = readCatalog(locale);
      assert.strictEqual(catalog["mercadocredito.tab"], name);
      assert.strictEqual(catalog["mercadocredito.mercadocredito"], name);
      assert.strictEqual(catalog["mercadocredito.title"], title);
      assert.strictEqual(catalog["mercadocredito.firststep.partthree"], installments);
      assert.strictEqual(catalog[`mercadopago.chopro.credit.${site}.bold`], benefit);
    });
  });

  it("should preserve the approved credit-line, payment and activation wording in Portuguese", () => {
    const catalog = readCatalog("pt_BR");
    assert.deepStrictEqual([
      catalog["mercadocredito.firststep.partone"],
      catalog["mercadocredito.firststep.parttwo"],
      catalog["mercadocredito.secondstep.partone"],
      catalog["mercadocredito.secondstep.parttwo"],
      catalog["mercadocredito.thirdstep.partone"],
      catalog["mercadocredito.thirdstep.parttwo"],
      catalog["mercadocredito.info"],
      catalog["mercadocredito.footerinfo"]
    ], [
      "Conheça o limite disponível",
      "da sua Linha de Crédito e",
      "Confirme seu pagamento,",
      "ele é creditado na hora e está 100% protegido.",
      "Pague mês a mês",
      "pelo app do Mercado Pago com o meio que preferir.",
      "Vamos te levar ao Mercado Pago",
      "Se você ainda não tem a Linha de Crédito, ative-a na hora de pagar."
    ]);
  });

  it("should not retain a legacy product name in regional aliases or Checkout Pro benefits", () => {
    ["", "es", "es_AR", "es_CL", "es_CO", "es_MX", "es_PE", "es_UY", "pt_BR"].forEach((locale) => {
      const catalog = readCatalog(locale);
      let name = locale ? "Mercado Crédito" : "Buy now, pay later";
      if (locale === "pt_BR") name = "Mercado Parcelado";
      assert.strictEqual(catalog["mercadocredito.tab"], name, locale);
      Object.entries(catalog).forEach(([key, value]) => {
        if (key.startsWith("mercadocredito.tab.")) assert.strictEqual(value, name, `${locale}: ${key}`);
        if (/^mercadopago\.chopro\.credit\.ML[ABM]\.bold$/.test(key)) {
          assert.ok(value.includes(name), `${locale}: ${key} must use the localized product name`);
        }
      });
    });
  });

  it("should use locale-based names in both server templates, including image attributes", () => {
    ["mercadoCreditoTab.isml", "mercadoCreditoSummary.isml"].forEach((file) => {
      const template = fs.readFileSync(path.join(cartridge, "templates/default/checkout/billing/paymentOptions", file), "utf8");
      assert.ok(template.includes("Resource.msg('mercadocredito.tab', 'mercadopago', null)"), file);
      assert.match(template, /alt="\$\{creditsTitle\}"/, file);
      assert.match(template, /title="\$\{creditsTitle\}"/, file);
      assert.ok(!template.includes("'mercadocredito.tab.' + siteId"), file);
    });
  });

  it("should rename seller labels without changing the payment method state or processor", () => {
    const metadata = fs.readFileSync(path.join(root, "metadata/sites/RefArch/payment-methods.xml"), "utf8");
    const credits = metadata.split('<payment-method method-id="MERCADO_CREDITO">')[1].split("</payment-method>")[0];
    assert.ok(credits.includes('<name xml:lang="pt-BR">Mercado Parcelado</name>'));
    assert.ok(credits.includes('<name xml:lang="es">Mercado Crédito</name>'));
    assert.ok(credits.includes('<name xml:lang="en">Buy now, pay later</name>'));
    assert.ok(credits.includes("<enabled-flag>false</enabled-flag>"));
    assert.ok(credits.includes("<processor-id>MERCADOPAGO_MERCADO_CREDITO</processor-id>"));
  });
});
