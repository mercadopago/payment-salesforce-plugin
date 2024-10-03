const base = module.superModule;
const URLUtils = require("dw/web/URLUtils");
const Customer = require("dw/customer/Customer");
const AddressModel = require("*/cartridge/models/address");

/**
 * Creates a plain object that contains profile information
 * @param {Object} profile - current customer's profile
 * @returns {Object} an object that contains information about the current customer's profile
 */
function getProfile(profile) {
  let result;
  if (profile) {
    result = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: Object.prototype.hasOwnProperty.call(profile, "phone") ? profile.phone : profile.phoneHome,
      password: "********"
    };
  } else {
    result = null;
  }
  return result;
}

/**
 * Creates an array of plain object that contains address book addresses, if any exist
 * @param {Object} addressBook - target customer
 * @returns {Array<Object>} an array of customer addresses
 */
function getAddresses(addressBook) {
  const result = [];
  if (addressBook) {
    for (let i = 0, ii = addressBook.addresses.length; i < ii; i++) {
      result.push(new AddressModel(addressBook.addresses[i]).address);
    }
  }

  return result;
}

/**
 * Creates a plain object that contains the customer's preferred address
 * @param {Object} addressBook - target customer
 * @returns {Object} an object that contains information about current customer's preferred address
 */
function getPreferredAddress(addressBook) {
  let result = null;
  if (addressBook && addressBook.preferredAddress) {
    result = new AddressModel(addressBook.preferredAddress).address;
  }

  return result;
}

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} wallet - current customer's wallet
 * @returns {Object} object that contains info about the current customer's payment instrument
 */
function getPayment(wallet) {
  if (wallet) {
    const { paymentInstruments } = wallet;
    if (paymentInstruments && paymentInstruments.length > 0) {
      const paymentInstrument = paymentInstruments[0];
      return {
        maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
        creditCardType: paymentInstrument.creditCardType,
        creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
        creditCardExpirationYear: paymentInstrument.creditCardExpirationYear
      };
    }
  }
  return null;
}

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} userPaymentInstruments - current customer's paymentInstruments
 * @returns {Object} object that contains info about the current customer's payment instruments
 */
function getCustomerPaymentInstruments(userPaymentInstruments) {
  const paymentInstruments = userPaymentInstruments.map((paymentInstrument) => {
    const result = {
      creditCardHolder: paymentInstrument.creditCardHolder,
      maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
      creditCardType: paymentInstrument.creditCardType,
      creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
      creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
      UUID: paymentInstrument.UUID,
      creditCardToken: paymentInstrument.creditCardToken,
      custom: {
        cardBin: paymentInstrument.raw.custom.cardBin ? paymentInstrument.raw.custom.cardBin : "",
        customerIdMercadoPago: paymentInstrument.raw.custom.customerIdMercadoPago ? paymentInstrument.raw.custom.customerIdMercadoPago : "",
        creditCardName: paymentInstrument.raw.custom.creditCardName ? paymentInstrument.raw.custom.creditCardName : ""
      }
    };

    result.cardTypeImage = {
      src: URLUtils.staticURL("/images/"
                + paymentInstrument.creditCardType.toLowerCase().replace(/\s/g, "")
                + "-dark.svg"),
      alt: paymentInstrument.creditCardType
    };

    return result;
  });

  return paymentInstruments;
}

/**
 * Account class that represents the current customer's profile dashboard
 * @param {Object} currentCustomer - Current customer
 * @param {Object} addressModel - The current customer's preferred address
 * @param {Object} orderModel - The current customer's order history
 * @constructor
 */
function account(currentCustomer, addressModel, orderModel) {
  this.profile = getProfile(currentCustomer.profile);
  this.addresses = getAddresses(currentCustomer.addressBook);
  this.preferredAddress = addressModel || getPreferredAddress(currentCustomer.addressBook);
  this.orderHistory = orderModel;
  this.payment = getPayment(currentCustomer instanceof Customer ? currentCustomer.profile.wallet : currentCustomer.wallet);
  this.registeredUser = currentCustomer instanceof Customer ? (currentCustomer.authenticated && currentCustomer.registered) : (currentCustomer.raw.authenticated && currentCustomer.raw.registered);
  this.isExternallyAuthenticated = currentCustomer instanceof Customer ? currentCustomer.externallyAuthenticated : currentCustomer.raw.externallyAuthenticated;

  if (currentCustomer instanceof Customer) {
    this.customerPaymentInstruments = currentCustomer.profile.wallet
        && currentCustomer.profile.wallet.paymentInstruments
      ? getCustomerPaymentInstruments(currentCustomer.profile.wallet.paymentInstruments.toArray())
      : null;
  } else {
    this.customerPaymentInstruments = currentCustomer.wallet
        && currentCustomer.wallet.paymentInstruments
      ? getCustomerPaymentInstruments(currentCustomer.wallet.paymentInstruments)
      : null;
  }
}

account.getCustomerPaymentInstruments = getCustomerPaymentInstruments;

module.exports = account;
