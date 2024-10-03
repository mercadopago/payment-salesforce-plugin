const Logger = require("dw/system/Logger");
const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");

const log = Logger.getLogger("int_mercadopago", "mercadopago");

function find(array, matcher) {
  if (array == null || array.length == 0) {
    return undefined;
  }
  for (let i = 0, l = array.length; i < l; i++) {
    if (matcher(array[i], i)) {
      return array[i];
    }
  }

  return undefined;
}

function deletePayment(req, res, next) {
  const viewData = res.getViewData();
  const { UUID } = req.querystring;
  const { paymentInstruments } = req.currentCustomer.wallet;

  const paymentToDelete = find(paymentInstruments, (item) => UUID === item.UUID);

  if (!paymentToDelete) {
    log.info("No cards found");
    res.setViewData(viewData);
    return next();
  }

  try {
    MercadopagoHelpers.customerCard.delete(
      paymentToDelete.raw.creditCardToken, paymentToDelete.raw.custom.customerIdMercadoPago
    );
    log.info("Card deleted on Mercadopago");
  } catch (e) {
    log.error("Error when deleting card on Mercadopago: " + e.message);
  }

  res.setViewData(viewData);
  return next();
}

module.exports = deletePayment;
