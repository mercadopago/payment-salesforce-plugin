const checkoutHelpers = require("./objects/checkoutHelpers");
const collections = require("./objects/collections");
const logger = require("./objects/logger");
const mercadopagoHelpers = require("./objects/mercadopagoHelpers");
const mercadopagoUtil = require("./objects/mercadopagoUtil");
const order = require("./objects/order");
const orderMgr = require("./objects/orderMgr");
const paymentInstrument = require("./objects/paymentInstrument");
const resource = require("./objects/resource");
const site = require("./objects/site");
const transaction = require("./objects/transaction");
const urlUtils = require("./objects/urlUtils");
const formErrors = require("./objects/formErrors");
const savePaymentInformation = require("./objects/savePaymentInformation");
const localServiceRegistry = require("./objects/localServiceRegistry");
const system = require("./objects/system");

const array =
  "../../../../../cartridges/app_storefront_base/cartridge/scripts/util/array.js";

module.exports = {
  array: array,
  Resource: resource,
  MercadopagoUtil: mercadopagoUtil,
  Transaction: transaction,
  collections: collections,
  checkoutHelpers: checkoutHelpers,
  OrderMgr: orderMgr,
  Order: order,
  PaymentInstrument: paymentInstrument,
  Logger: logger,
  MercadopagoHelpers: mercadopagoHelpers,
  Site: site,
  URLUtils: urlUtils,
  FormErrors: formErrors,
  SavePaymentInformation: savePaymentInformation,
  LocalServiceRegistry: localServiceRegistry,
  System: system
};
