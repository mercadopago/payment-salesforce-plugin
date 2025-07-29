const server = require("server");
const OrderMgr = require("dw/order/OrderMgr");
const Resource = require("dw/web/Resource");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");

function addResetCardToken(res, viewData) {
  const paymentForm = server.forms.getForm("billing");
  if (
    paymentForm.paymentMethod.htmlValue ===
    MercadopagoUtil.PAYMENT_METHOD.credit_card
  ) {
    viewData.resetCardToken = "true";
    res.setViewData(viewData);
  }
}

function addParamsViewData(viewData) {
  const paymentForm = server.forms.getForm("billing");
  const order = OrderMgr.getOrder(viewData.orderID, viewData.orderToken);
  const { paymentInstruments } = order;
  const [paymentInstrument] = paymentInstruments;
  const { transactionID } = paymentInstrument.paymentTransaction;

  if (isCheckoutProOrMercadoCredito(paymentForm)) {
    handleCheckoutProOrMercadoCredito(viewData, paymentForm, paymentInstrument, transactionID);
  }

  if (isCreditCardPendingChallenge(paymentForm, paymentInstrument)) {
    handleCreditCardPendingChallenge(viewData, paymentInstrument, transactionID);
  }

  if (isFintocPendingWaitingTransfer(paymentForm, paymentInstrument)) {
    handleFintocPendingWaitingTransfer(viewData, paymentInstrument, transactionID);
  }
}

function isCheckoutProOrMercadoCredito(paymentForm) {
  return (
    paymentForm.paymentMethod.htmlValue === MercadopagoUtil.PAYMENT_METHOD.checkout_pro ||
    paymentForm.paymentMethod.htmlValue === MercadopagoUtil.PAYMENT_METHOD.mercado_credito
  );
}

function handleCheckoutProOrMercadoCredito(viewData, paymentForm, paymentInstrument, transactionID) {
  viewData.transactionID = transactionID;
  if (paymentForm.paymentMethod.htmlValue === MercadopagoUtil.PAYMENT_METHOD.checkout_pro) {
    viewData.checkoutProLink = paymentInstrument.custom.checkoutProLink;
  } else {
    viewData.mercadoCreditoLink = paymentInstrument.custom.mercadoCreditoLink;
  }
}

function isCreditCardPendingChallenge(paymentForm, paymentInstrument) {
  return (
    paymentForm.paymentMethod.htmlValue === MercadopagoUtil.PAYMENT_METHOD.credit_card &&
    paymentInstrument.custom.statusDetail === "pending_challenge"
  );
}

function handleCreditCardPendingChallenge(viewData, paymentInstrument, transactionID) {
  viewData.transactionID = transactionID;
  viewData.creq = paymentInstrument.custom.creq;
  viewData.external_resource_url = paymentInstrument.custom.externalResourceUrl;
  viewData.status = paymentInstrument.custom.status;
  viewData.status_detail = paymentInstrument.custom.statusDetail;
  viewData.credit_card_type = paymentInstrument.custom.cardTypeName;
  viewData.masked_credit_card_number = paymentInstrument.maskedCreditCardNumber;
  viewData.plugin_version = Resource.msg("int_mercadopago.version", "mercadopagoPreferences", null);
  viewData.platform_id = Resource.msg("mercadopago.platformId", "mercadopagoPreferences", null);
  viewData.mpErrorMessage = Resource.msg("challenge.rejected", "mercadopago", null);
  viewData.error = "true";
}

function isFintocPendingWaitingTransfer(paymentForm, paymentInstrument) {
  return (
    paymentForm.paymentMethod.htmlValue === MercadopagoUtil.PAYMENT_METHOD.fintoc &&
    paymentInstrument.custom.statusDetail === "pending_waiting_transfer"
  );
}

function handleFintocPendingWaitingTransfer(viewData, paymentInstrument, transactionID) {
  viewData.transactionID = transactionID;
  viewData.external_reference_id = paymentInstrument.custom.fintocExternalReferenceId;
  viewData.external_resource_url = paymentInstrument.custom.fintocExternalUrl;
  viewData.status = paymentInstrument.custom.status;
  viewData.status_detail = paymentInstrument.custom.statusDetail;
  viewData.plugin_version = Resource.msg("int_mercadopago.version", "mercadopagoPreferences", null);
  viewData.platform_id = Resource.msg("mercadopago.platformId", "mercadopagoPreferences", null);
  viewData.mpErrorMessage = Resource.msg("fintoc.rejected", "mercadopago", null);
  viewData.error = "true";
}

function placeOrder(req, res, next) {
  const viewData = res.getViewData();

  if (viewData.error) {
    addResetCardToken(res, viewData);
  } else {
    addParamsViewData(viewData);
  }

  return next();
}

module.exports = placeOrder;
