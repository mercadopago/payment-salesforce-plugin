const assert = require("assert");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();

describe("Credits browser payment summary", () => {
  it("should use the Credits image and localized title when Checkout Pro is absent", () => {
    // Given Credits has a localized title and its own image, with no Checkout Pro element.
    const created = [];
    const summary = { empty: sinon.stub().returnsThis(), append: sinon.spy() };
    const previousJQuery = global.$;
    global.$ = (selector, attributes) => {
      if (selector === ".payment-details") return summary;
      if (selector === ".checkout-credits-option") return { attr: () => "/credits.svg" };
      if (selector === ".checkout-credits-tab-text") return [{ innerText: "Mercado Parcelado" }];
      if (selector === ".mp-text-messages") {
        return { data: () => ({ "field.mercadocredito.billing.message": "Vamos te levar ao Mercado Pago" }) };
      }
      assert.ok(selector.startsWith("<"), `Unexpected dependency on ${selector}`);
      const element = {
        tag: selector,
        attributes: attributes,
        append: sinon.stub().returnsThis(),
        text: sinon.stub().returnsThis(),
        prop: () => "<div></div>"
      };
      created.push(element);
      return element;
    };
    try {
      const billing = proxyquire("../../../../../cartridges/int_mercadopago/cartridge/client/default/js/checkout/billing", {
        "BaseCartridge/checkout/billing": { methods: {} }
      });
      const order = {
        billing: { payment: { selectedPaymentInstruments: [{ paymentMethod: "MERCADO_CREDITO" }] } }
      };

      // When the payment summary is updated with Credits selected.
      billing.methods.updatePaymentInformation(order);

      // Then it uses the Credits image, localized name and redirect message.
      assert.deepStrictEqual(created.find((element) => element.tag === "<img>").attributes, {
        src: "/credits.svg",
        height: 32,
        alt: "Mercado Parcelado",
        title: "Mercado Parcelado"
      });
      assert.ok(created.find((element) => element.tag === "<span>").text.calledWith("Mercado Parcelado"));
      assert.ok(created.find((element) => element.tag === "<p>").text.calledWith("Vamos te levar ao Mercado Pago"));
      assert.ok(summary.empty.calledOnce);
      assert.ok(summary.append.calledOnce);
    } finally {
      if (previousJQuery === undefined) delete global.$;
      else global.$ = previousJQuery;
    }
  });
});
