const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");

function begin(req, res, next) {
  const viewData = res.getViewData();

  viewData.mercadopago = {
    errorMessages: MercadopagoUtil.getErrorMessages(),
    textMessages: MercadopagoUtil.getTextMessages(),
    preferences: MercadopagoHelpers.getPreferences()
  };

  res.setViewData(viewData);
  return next();
}

module.exports = begin;
