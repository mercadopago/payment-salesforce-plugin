const PaymentInstrument = require("dw/order/PaymentInstrument");
const Site = require("dw/system/Site");
const Resource = require("dw/web/Resource");
const URLUtils = require("dw/web/URLUtils");
const LocalServiceRegistry = require("dw/svc/LocalServiceRegistry");
const Logger = require("*/cartridge/scripts/util/Logger");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");
const collections = require("*/cartridge/scripts/util/collections");

function MercadopagoHelpers() {}

/**
 * Build a Local Services Framework service definition
 *
 * @returns {dw.svc.Service} - The created service definition.
 */
function getServiceDefinition() {
  const serviceID = Resource.msg("service.name", "mercadopagoPreferences", null);
  const platformId = Resource.msg("mercadopago.platformId", "mercadopagoPreferences", null);
  const productId = Resource.msg("mercadopago.productId", "mercadopagoPreferences", null);
  const apiVersion = Resource.msg("mercadopago.apiVersion", "mercadopagoPreferences", null);
  const pluginVersion = Resource.msg("int_mercadopago.version", "mercadopagoPreferences", null);

  return LocalServiceRegistry.createService(serviceID, {
    /**
     * Callbaks function responsible for setting up http requests
     * @param {dw.svc.Service} svc Service instance
     * @param {string} requestObject - Request object, containing the end point, payload etc.
     * @returns {string} - The body of HTTP request
     */
    createRequest: (svc, requestObject) => {
      const accessToken = Site.getCurrent().getCustomPreferenceValue(
        "mercadopagoAccessToken"
      );
      let integratorId = Site.getCurrent().getCustomPreferenceValue(
        "mercadopagoIntegratorId"
      );
      if (!integratorId) {
        integratorId = "";
      }

      svc.addHeader("Content-Type", "application/json");
      svc.addHeader("Authorization", "Bearer " + accessToken);
      svc.addHeader("x-platform-id", platformId);
      svc.addHeader("x-product-id", productId);
      svc.addHeader("x-integrator-id", integratorId);

      if (requestObject.payload) {
        if (!requestObject.payload.metadata) {
          requestObject.payload.metadata = {};
        }

        requestObject.payload.metadata.integrator_id = integratorId;
        requestObject.payload.metadata.plugin_version = pluginVersion;
      }

      let { URL } = svc.configuration.credential;
      URL += apiVersion;
      URL += requestObject.endpoint;

      svc.setURL(URL);

      if (requestObject.httpMethod) {
        svc.setRequestMethod(requestObject.httpMethod);
      }

      if (requestObject.payload) {
        return JSON.stringify(requestObject.payload);
      }

      return null;
    },

    /**
     * A callback function responsible to parse web service response
     *
     * @param {dw.svc.Service} svc - Service instance
     * @param {dw.net.HTTPClient} httpClient - HTTP client instance
     * @returns {string} - Response body in case of a successful request or null
     */
    parseResponse: (svc, httpClient) => JSON.parse(httpClient.text),
    filterLogMessage: (msg) => msg
  });
}

/**
 * Creates an Error and appends web service call result as callResult
 *
 * @param {dw.svc.Result} callResult - Web service call result
 * @return {Error} - Error created
 */
function MercadopagoServiceError(callResult) {
  let message = "Mercadopago web service call failed:";
  if (callResult && callResult.errorMessage) {
    message += callResult.errorMessage;
  }

  const err = new Error(message);
  err.callResult = callResult;
  err.name = "MercadopagoError";

  return err;
}

/**
 * Build the request and make its shipping
 * @param {Object} requestObject - An object having details for the request
 * @returns {dw.svc.Result} - Result returned by the call.
 */
function callService(requestObject) {
  if (!requestObject) {
    const msg = "Required requestObject parameter missing or incorrect.";
    Logger.error(msg);
    throw new Error(msg);
  }

  const callResult = getServiceDefinition().call(requestObject);

  if (!callResult.ok) {
    const err = new MercadopagoServiceError(callResult);
    Logger.error(JSON.stringify(err));
    throw err;
  }

  return callResult.object;
}

/**
 * Access the Mercadopago Rest Api
 */
MercadopagoHelpers.prototype.payments = {
  create: (createPaymentPayload) => {
    const requestObject = {
      endpoint: "/asgard/payments",
      httpMethod: "POST",
      payload: createPaymentPayload
    };

    return callService(requestObject);
  },
  retrieve: (paymentId) => {
    const requestObject = {
      endpoint: "/bifrost/notification/status/" + paymentId,
      httpMethod: "GET"
    };

    return callService(requestObject);
  }
};

/**
 * Access the Mercadopago Preference Rest Api
 */
MercadopagoHelpers.prototype.preference = {
  create: (createPreferencePayload) => {
    const requestObject = {
      endpoint: "/asgard/preferences",
      httpMethod: "POST",
      payload: createPreferencePayload
    };

    return callService(requestObject);
  }
};

function getPixExpiration() {
  let pixExpirationTime = Site.getCurrent().getCustomPreferenceValue(
    "mercadopagoPixExpirationTime"
  );

  if (!pixExpirationTime || !pixExpirationTime.value) {
    return null;
  }
  pixExpirationTime = "" + pixExpirationTime.value;

  const timeUnit = pixExpirationTime.charAt(pixExpirationTime.length - 1);

  const amount = pixExpirationTime.substring(0, pixExpirationTime.length - 1);
  let seconds;

  switch (timeUnit) {
    case "m":
      seconds = amount * 60;
      break;
    case "h":
      seconds = amount * 60 * 60;
      break;
    case "d":
      seconds = amount * 24 * 60 * 60;
      break;
    default:
  }

  const result = new Date();
  result.setTime(result.getTime() + seconds * 1000);

  return result;
}

/**
 * Converts order objects into a json payload
 *
 * @param {dw.order.Order} order - the order to handle payments for
 * @param {Integer} installments - installments of payment
 * @param {Integer} issuerId
 * @returns {Object}
 */
MercadopagoHelpers.prototype.createPaymentPayload = (
  order,
  installments,
  issuer
) => {
  const items = collections.map(order.allProductLineItems, (prodLineItem) => {
    const item = {};

    item.id = prodLineItem.productID;

    if (prodLineItem.product) {
      item.title = prodLineItem.product.name;

      if (prodLineItem.product.longDescription) {
        item.description = prodLineItem.product.longDescription.markup;
      }

      if (prodLineItem.product.primaryCategory) {
        item.category_id = prodLineItem.product.primaryCategory.displayName;
      }
    } else {
      item.title = prodLineItem.productName;
    }

    item.quantity = prodLineItem.quantityValue;
    item.unit_price = prodLineItem.adjustedGrossPrice.value;

    return item;
  });

  let paymentMethodId;
  let token;
  let docType;
  let docNumber;
  let firstName;
  let lastName;
  let email;
  let expirationDate;

  collections.forEach(order.getPaymentInstruments(), (payInstrument) => {
    if (payInstrument.paymentMethod === PaymentInstrument.METHOD_CREDIT_CARD) {
      paymentMethodId = payInstrument.creditCardType;
      token = payInstrument.creditCardToken;
    } else {
      paymentMethodId = payInstrument.paymentMethod;
      expirationDate = getPixExpiration();
    }

    docType = payInstrument.custom.payerDocType;
    docNumber = payInstrument.custom.payerDocNumber;
    firstName = payInstrument.custom.payerFirstName
      ? payInstrument.custom.payerFirstName
      : order.billingAddress.firstName;
    lastName = payInstrument.custom.payerLastName
      ? payInstrument.custom.payerLastName
      : order.billingAddress.lastName;
    email = payInstrument.custom.payerEmail
      ? payInstrument.custom.payerEmail
      : order.customerEmail;
  });

  const bayer = {
    address: {
      street_name:
        order.billingAddress.address1 +
        "-" +
        order.billingAddress.city +
        "-" +
        order.billingAddress.countryCode,
      street_number: "0",
      zip_code: order.billingAddress.postalCode
    },
    first_name: order.billingAddress.firstName,
    last_name: order.billingAddress.lastName,
    phone: {
      area_code: "-",
      number: order.billingAddress.phone
    }
  };

  const payer = {
    email: email,
    first_name: firstName,
    last_name: lastName,
    identification: {
      type: docType,
      number: docNumber
    }
  };

  const transactionAmount = MercadopagoUtil.getTotalAmount(order);

  const payDataObj = {
    payer: payer,
    external_reference: order.orderNo,
    additional_info: {
      items: items,
      payer: bayer,
      shipments: {
        receiver_address: {
          apartment: "-",
          floor: "-",
          street_name:
            order.defaultShipment.shippingAddress.address1 +
            "-" +
            order.defaultShipment.shippingAddress.city +
            "-" +
            order.defaultShipment.shippingAddress.countryCode,
          street_number: "0",
          zip_code: order.defaultShipment.shippingAddress.postalCode
        }
      }
    },
    payment_method_id: paymentMethodId.toLowerCase(),
    transaction_amount: transactionAmount.value,
    notification_url: URLUtils.https(
      "MercadopagoNotification-PaymentNotifications"
    ).toString(),
    point_of_interaction: {
      type: "CHECKOUT"
    }
  };

  if (token) {
    payDataObj.token = token;
  }

  if (installments) {
    payDataObj.installments = installments;
  }

  if (issuer) {
    payDataObj.issuer_id = issuer;
  }

  if (expirationDate) {
    payDataObj.date_of_expiration = expirationDate.toISOString();
  }

  return payDataObj;
};

/**
 * Converts order objects into a preference json payload
 *
 * @param {dw.order.Order} order - the order to handle payments for
 * @returns {Object}
 */
MercadopagoHelpers.prototype.createPreferencePayload = (
  order
) => {
  const items = collections.map(order.allProductLineItems, (prodLineItem) => {
    const item = {};

    item.id = prodLineItem.productID;

    if (prodLineItem.product) {
      item.title = prodLineItem.product.name;

      if (prodLineItem.product.longDescription) {
        item.description = prodLineItem.product.longDescription.markup;
      }

      if (prodLineItem.product.primaryCategory) {
        item.category_id = prodLineItem.product.primaryCategory.displayName;
      }
    } else {
      item.title = prodLineItem.productName;
    }

    const unitPrice = prodLineItem.adjustedPrice.value / prodLineItem.quantityValue;
    item.quantity = prodLineItem.quantityValue;
    item.unit_price = Number(unitPrice.toFixed(5));

    return item;
  });

  if (order.totalTax && order.totalTax.value) {
    items.push({ id: "salesTax", title: "Sales Tax", quantity: 1, unit_price: order.totalTax.value });
  }

  let orderDiscount = 0;
  for (let i = 0; i < order.priceAdjustments.length; i++) {
    orderDiscount += order.priceAdjustments[i].priceValue;
  }

  orderDiscount = Number(orderDiscount.toFixed(5));

  if (orderDiscount) {
    items.push({ id: "orderDiscount", title: "Order Discount", quantity: 1, unit_price: orderDiscount });
  }

  let paymentMethodId;
  let token;
  let docType;
  let docNumber;
  let firstName;
  let lastName;
  let email;

  collections.forEach(order.getPaymentInstruments(), (payInstrument) => {
    paymentMethodId = payInstrument.paymentMethod;

    docType = payInstrument.custom.payerDocType;
    docNumber = payInstrument.custom.payerDocNumber;
    firstName = payInstrument.custom.payerFirstName
      ? payInstrument.custom.payerFirstName
      : order.billingAddress.firstName;
    lastName = payInstrument.custom.payerLastName
      ? payInstrument.custom.payerLastName
      : order.billingAddress.lastName;
    email = payInstrument.custom.payerEmail
      ? payInstrument.custom.payerEmail
      : order.customerEmail;
  });

  const buyer = {
    address: {
      street_name:
        order.billingAddress.address1 +
        "-" +
        order.billingAddress.city +
        "-" +
        order.billingAddress.countryCode,
      street_number: "0",
      zip_code: order.billingAddress.postalCode
    },
    first_name: order.billingAddress.firstName,
    last_name: order.billingAddress.lastName,
    phone: {
      area_code: "-",
      number: order.billingAddress.phone
    }
  };

  const payer = {
    email: email,
    name: firstName,
    surname: lastName,
    identification: {
      type: docType,
      number: docNumber
    }
  };

  const transactionAmount = MercadopagoUtil.getTotalAmount(order);

  const thankYouUrl = URLUtils.https("CheckoutServices-ThankYou", "orderID", order.orderNo, "orderToken", order.orderToken).toString();
  const thankYouWithTryAgainUrl = URLUtils.https("CheckoutServices-ThankYou", "orderID", order.orderNo, "orderToken", order.orderToken, "tryAgain", true).toString();
  const backUrls = {
    success: thankYouUrl,
    pending: thankYouUrl,
    failure: thankYouWithTryAgainUrl
  };

  const payDataObj = {
    payer: payer,
    external_reference: order.orderNo,
    items: items,
    additional_info: {
      payer: buyer,
      shipments: {
        receiver_address: {
          apartment: "-",
          floor: "-",
          street_name:
            order.defaultShipment.shippingAddress.address1 +
            "-" +
            order.defaultShipment.shippingAddress.city +
            "-" +
            order.defaultShipment.shippingAddress.countryCode,
          street_number: "0",
          zip_code: order.defaultShipment.shippingAddress.postalCode
        }
      }
    },
    shipments: {
      cost: order.adjustedShippingTotalPrice.value,
      mode: "not_specified"
    },
    payment_method_id: paymentMethodId.toLowerCase(),
    transaction_amount: transactionAmount.value,
    notification_url: URLUtils.https(
      "MercadopagoNotification-PaymentNotifications"
    ).toString(),
    back_urls: backUrls
  };

  if (token) {
    payDataObj.token = token;
  }

  return payDataObj;
};

/**
 * Retrived the custom Mercadopago preferences
 * @returns {Object} custom preferences
 */
MercadopagoHelpers.prototype.getPreferences = () => ({
  mercadopagoPublicKey: Site.getCurrent().getCustomPreferenceValue(
    "mercadopagoPublicKey"
  )
});

module.exports = new MercadopagoHelpers();
