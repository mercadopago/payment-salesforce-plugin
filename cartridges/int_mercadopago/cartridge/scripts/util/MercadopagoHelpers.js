const Site = require("dw/system/Site");
const Resource = require("dw/web/Resource");
const URLUtils = require("dw/web/URLUtils");
const LocalServiceRegistry = require("dw/svc/LocalServiceRegistry");
const Logger = require("dw/system/Logger");
const System = require("dw/system/System");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");
const collections = require("*/cartridge/scripts/util/collections");

const log = Logger.getLogger("int_mercadopago", "mercadopago");
const { getTotalAmount, validateAndReturnAttribute, sortMethodsOff } = MercadopagoUtil;

function MercadopagoHelpers() { }

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
      if (requestObject.hasApiVersion == null || requestObject.hasApiVersion) {
        URL += apiVersion;
      }
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
    log.error(msg);
    throw new Error(msg);
  }

  const callResult = getServiceDefinition().call(requestObject);

  if (!callResult.ok) {
    const err = new MercadopagoServiceError(callResult);
    log.error(JSON.stringify(err));
    throw err;
  }

  return callResult.object;
}

/**
 * Access the Mercadopago Rest Api
 */
MercadopagoHelpers.prototype.payments = {
  create: (createPaymentPayload) => {
    try {
      const requestObject = {
        endpoint: "/asgard/payments",
        httpMethod: "POST",
        payload: createPaymentPayload
      };

      return callService(requestObject);
    } catch (error) {
      if (error.message.includes("Invalid card_token_id")) {
        return {
          error: true,
          status_detail: "invalid_card_token_id",
          status: 400
        };
      }

      throw error;
    }
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
 * Access to MercadoPago Save Cards Api
 */
MercadopagoHelpers.prototype.customerCard = {
  create: (saveCardPayload) => {
    const requestObject = {
      endpoint: "/ppcore/prod/transaction-api/customer-cards/v1/cards",
      httpMethod: "POST",
      hasApiVersion: false,
      payload: saveCardPayload
    };

    return callService(requestObject);
  },
  delete: (paymentId, customerId) => {
    const requestObject = {
      endpoint: "/ppcore/prod/transaction-api/customer-cards/v1/cards/" + paymentId + "/customers/" + customerId,
      httpMethod: "DELETE",
      hasApiVersion: false
    };

    return callService(requestObject);
  }
};

/**
 * Create card payload
 */
MercadopagoHelpers.prototype.saveCardPayload = (token, email) => {
  const dataObj = {
    card_token: token,
    email: email
  };

  return dataObj;
};
/**
 * Access Mercadopago Rest Api to get payment methods availabe for a credential
 */
MercadopagoHelpers.prototype.paymentMethods = {
  retrieve: () => {
    const requestObject = {
      endpoint: "/asgard/payment-methods",
      httpMethod: "GET"
    };

    const call = callService(requestObject);

    return call;
  }
};

/**
 * Access Mercadopago Rest Api to get cardToken for a saved card
 */
MercadopagoHelpers.prototype.getCardTokenSavedCard = (cardTokenRequest) => {
  const requestObject = {
    endpoint: "/card_tokens?public_key=" + Site.getCurrent().getCustomPreferenceValue("mercadopagoPublicKey"),
    httpMethod: "POST",
    payload: cardTokenRequest
  };

  return callService(requestObject);
};

/**
 * Create Card Token payload
 */
MercadopagoHelpers.prototype.createTokenPayload = (cardId, securityCode) => {
  const dataObj = {
    card_id: cardId,
    security_code: securityCode
  };

  return dataObj;
};

/**
 * Verifies if a payment method exists among available payment methods
 */
MercadopagoHelpers.prototype.hasPaymentMethod = (paymentMethods, paymentId) => {
  let isValidMethod = false;
  collections.forEach(paymentMethods, (paymentMethod) => {
    if (paymentMethod.id === paymentId) {
      isValidMethod = true;
    }
  });
  return isValidMethod;
};

/**
 * Verifies if a payment method exists among available payment methods
 */
MercadopagoHelpers.prototype.hasPaymentMethodType = (paymentMethods, paymentTypeIds) => {
  let isValidMethod = false;
  collections.forEach(paymentMethods, (paymentMethod) => {
    if (paymentTypeIds.includes(paymentMethod.payment_type_id)) {
      isValidMethod = true;
    }
  });
  return isValidMethod;
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
  },
  createRedirectingToCredits: (createPreferencePayload) => {
    createPreferencePayload.purpose = "onboarding_credits";
    createPreferencePayload.paymentMethods = {};
    createPreferencePayload.paymentMethods.defaultPaymentMethodId = "consumer_credits";
    const requestObject = {
      endpoint: "/asgard/preferences",
      httpMethod: "POST",
      payload: createPreferencePayload
    };

    return callService(requestObject);
  }
};

function getMethodsOffExpiration() {
  const methodsOffExpirationTime = Site.getCurrent().getCustomPreferenceValue(
    "mercadopagoMethodsOffExpirationTime"
  );

  if (!methodsOffExpirationTime || !methodsOffExpirationTime.value) {
    return null;
  }

  const expirationTime = "" + methodsOffExpirationTime.value;

  const seconds = getSeconds(expirationTime);

  const result = new Date();
  result.setTime(result.getTime() + seconds * 1000);

  return result;
}

MercadopagoHelpers.prototype.getExpirationMethodsOff = () => getMethodsOffExpiration();

function getPixExpiration() {
  let pixExpirationTime = Site.getCurrent().getCustomPreferenceValue(
    "mercadopagoPixExpirationTime"
  );

  if (!pixExpirationTime || !pixExpirationTime.value) {
    return null;
  }
  pixExpirationTime = "" + pixExpirationTime.value;

  const seconds = getSeconds(pixExpirationTime);

  const result = new Date();
  result.setTime(result.getTime() + seconds * 1000);

  return result;
}

/**
 * Return Seconds to mount expiration date Coupoms Information
 * @returns {value} seconds
 */
function getSeconds(expirationTime) {
  const timeUnit = expirationTime.charAt(expirationTime.length - 1);

  const amount = expirationTime.substring(0, expirationTime.length - 1);
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

  return seconds;
}

/**
 * Retrieves Coupoms Information
 * @returns {value} Coupom value or null
 */
function getCoupomLineItemsAmount(order) {
  if (order.couponLineItems.length > 0 && order.couponLineItems[0].priceAdjustments.length > 0
    && order.couponLineItems[0].priceAdjustments[0].appliedDiscount != null
    && order.couponLineItems[0].priceAdjustments[0].appliedDiscount.amount != null) {
    return order.couponLineItems[0].priceAdjustments[0].appliedDiscount.amount;
  }
  return null;
}

/**
 * Retrieves Authentication Type Information
 * @returns {String} Authentication Type value or null
 */
function getAuthenticationType(customer) {
  if (customer.registered) {
    if (customer.getExternalProfiles().empty) {
      return "Web Nativa";
    }
    return customer.getExternalProfiles()[0].getAuthenticationProviderID();
  }
  return null;
}

/**
 * Retrieves the Date of the Last Purchase
 * @returns {String} Date value or null
 */
function getLastPurchase(customer) {
  if (customer.registered) {
    return (customer.getOrderHistory()
      .getOrders(null, "creationDate DESC")
      .first().creationDate).toString();
  }
  return null;
}

/**
 * Retrieves seller information from Mercado Pago
 * @returns {Object|Null} seller info
 */
function getUserMPData() {
  const requestObject = {
    endpoint: "/users/me",
    httpMethod: "GET",
    hasApiVersion: false
  };

  try {
    return callService(requestObject);
  } catch (error) {
    log.error(JSON.stringify(error));
    return null;
  }
}

MercadopagoHelpers.prototype.getSiteId = () => {
  const userData = getUserMPData();

  return userData.site_id;
};

/**
 * Retrieves seller information
 * @returns {Object} seller
 */
function getAdditionalInfoSellerInfo() {
  let seller = {};

  try {
    const sellerInfo = getUserMPData();
    if (sellerInfo) {
      seller = {
        id: sellerInfo.id,
        registration_date: sellerInfo.registration_date,
        business_type: null,
        identification: {
          type: validateAndReturnAttribute(sellerInfo.identification, "type"),
          number: validateAndReturnAttribute(sellerInfo.identification, "number")
        },
        status: validateAndReturnAttribute(sellerInfo.status, "site_status"),
        store_id: null,
        email: sellerInfo.email,
        phone: {
          area_code: validateAndReturnAttribute(sellerInfo.phone, "area_code"),
          number: validateAndReturnAttribute(sellerInfo.phone, "number")
        },
        collector: sellerInfo.id,
        website: Site.getCurrent().getName(),
        platform_url: Site.getCurrent().getHttpHostName(),
        referral_url: Site.getCurrent().getHttpHostName(),
        register_updated_at: null,
        document: validateAndReturnAttribute(sellerInfo.identification, "number"),
        name: sellerInfo.first_name + " " + sellerInfo.last_name,
        hired_plan: null,
        category: null,
        address: {
          zip_code: validateAndReturnAttribute(sellerInfo.address, "zip_code"),
          street_name: (validateAndReturnAttribute(sellerInfo.address, "address"))
            ? sellerInfo.address.address.replace(/[0-9]/g, "") : null,
          city: validateAndReturnAttribute(sellerInfo.address, "city"),
          country: sellerInfo.country_id,
          state: validateAndReturnAttribute(sellerInfo.address, "state"),
          number: (validateAndReturnAttribute(sellerInfo.address, "address"))
            ? sellerInfo.address.address.replace(/[^0-9]/g, "") : null,
          complement: null
        }
      };
    }
  } catch (error) {
    log.error(JSON.stringify(error));
    return null;
  }

  return seller;
}

/**
 * Retrieves shipments information
 * @returns {Object} shipments
 */
function getAdditionalInfoShipmentsInfo(order) {
  let streetName = null;
  let zipCode = null;
  let city = null;
  let country = null;
  let state = null;
  let streetNumber = null;
  let code = null;
  let status = null;

  if (validateAndReturnAttribute(order.defaultShipment, "shippingAddress")) {
    streetName = validateAndReturnAttribute(order.defaultShipment.shippingAddress, "address1");
    zipCode = validateAndReturnAttribute(order.defaultShipment.shippingAddress, "postalCode");
    city = validateAndReturnAttribute(order.defaultShipment.shippingAddress, "city");
    country = validateAndReturnAttribute(order.defaultShipment.shippingAddress, "countryCode")
      ? validateAndReturnAttribute(order.defaultShipment.shippingAddress.countryCode, "value") : country;
    state = validateAndReturnAttribute(order.defaultShipment.shippingAddress, "stateCode");
    streetNumber = validateAndReturnAttribute(order.defaultShipment.shippingAddress, "address2");
    code = validateAndReturnAttribute(order.defaultShipment, "shipmentNo");
    status = validateAndReturnAttribute(order.defaultShipment, "shippingStatus")
      ? validateAndReturnAttribute(order.defaultShipment.shippingStatus, "displayValue") : status;
  }

  return {
    receiver_address: {
      apartment: null,
      floor: null,
      street_name: streetName,
      zip_code: zipCode,
      city: city,
      country: country,
      state: state,
      street_number: streetNumber,
      complement: null
    },
    delivery_promise: null,
    drop_shipping: null,
    local_pickup: null,
    express_shipment: null,
    safety: null,
    withdrawn: null,
    tracking: {
      code: code,
      status: status
    }
  };
}

/**
 * Retrieves Billing information
 * @returns {Object} billing
 */
function getAdditionalInfoBillingInfo(order) {
  try {
    return {
      address: {
        zip_code: validateAndReturnAttribute(order.billingAddress, "postalCode"),
        federal_unit: validateAndReturnAttribute(order.billingAddress, "stateCode"),
        city: validateAndReturnAttribute(order.billingAddress, "city"),
        street_name: validateAndReturnAttribute(order.billingAddress, "address1"),
        street_number: validateAndReturnAttribute(order.billingAddress, "address2"),
        floor: null,
        apartment: null
      }
    };
  } catch (error) {
    log.error(JSON.stringify(error));
    return null;
  }
}

/**
 * Retrieves Payment information
 * @returns {Object} payment
 */
function getAdditionalInfoPaymentInfo(order) {
  try {
    return {
      capture: true,
      coupon_amount: getCoupomLineItemsAmount(order)
    };
  } catch (error) {
    log.error(JSON.stringify(error));
    return null;
  }
}

/**
 * Build the payer object
 * @param {Object} order - An object containing the order attributes
 * @returns {object} - Returns an object containing two other objects with payer data
 */
function getAdditionalInfoPayer(order, paymentMethodId) {
  let docType = null;
  let docNumber = null;
  let firstName = null;
  let lastName = null;
  let email = null;
  let registrationDate = null;
  let isFirstPurchaseOnline = null;

  collections.forEach(order.getPaymentInstruments(), (payInstrument) => {
    if (payInstrument.custom) {
      docType = validateAndReturnAttribute(payInstrument.custom, "payerDocType");
      docNumber = validateAndReturnAttribute(payInstrument.custom, "payerDocNumber");
      firstName = validateAndReturnAttribute(payInstrument.custom, "payerFirstName")
        ? payInstrument.custom.payerFirstName
        : validateAndReturnAttribute(order.billingAddress, "firstName");
      lastName = validateAndReturnAttribute(payInstrument.custom, "payerLastName")
        ? payInstrument.custom.payerLastName
        : validateAndReturnAttribute(order.billingAddress, "lastName");
      email = validateAndReturnAttribute(payInstrument.custom, "payerEmail")
        ? payInstrument.custom.payerEmail
        : order.customerEmail;
    }
  });

  const address = {
    city: validateAndReturnAttribute(order.billingAddress, "city"),
    country: validateAndReturnAttribute(order.billingAddress, "countryCode")
      ? order.billingAddress.countryCode.displayValue : null,
    state: validateAndReturnAttribute(order.billingAddress, "stateCode"),
    street_name: validateAndReturnAttribute(order.billingAddress, "address1"),
    number: validateAndReturnAttribute(order.billingAddress, "address2"),
    zip_code: validateAndReturnAttribute(order.billingAddress, "postalCode")
  };

  const phone = {
    area_code: "_",
    number: validateAndReturnAttribute(order.billingAddress, "phone")
  };

  if (validateAndReturnAttribute(order.customer, "profile")) {
    registrationDate = validateAndReturnAttribute(order.customer.profile, "creationDate")
      ? validateAndReturnAttribute(order.customer.profile, "creationDate").toString()
      : null;
  }
  if (validateAndReturnAttribute(order.customer, "orderHistory")) {
    isFirstPurchaseOnline = validateAndReturnAttribute(order.customer.orderHistory, "orderCount");
    isFirstPurchaseOnline = isFirstPurchaseOnline === 0;
  }
  const registeredUser = validateAndReturnAttribute(order.customer, "registered");
  const usedPassword = validateAndReturnAttribute(order.customer, "registered");
  const authenticationType = getAuthenticationType(order.customer);
  const lastPurchase = getLastPurchase(order.customer);

  const additionalInfoPayer = {
    identification: {
      type: docType,
      number: docNumber
    },
    address: address,
    first_name: firstName,
    last_name: lastName,
    email: email,
    phone: phone,
    registration_date: registrationDate,
    registered_user: registeredUser,
    user_email: order.customerEmail,
    autentication_type: authenticationType,
    last_purchase: lastPurchase,
    is_first_purchase_online: isFirstPurchaseOnline,
    used_password: usedPassword
  };

  const payer = {
    email: email,
    first_name: firstName,
    last_name: lastName,
    identification: additionalInfoPayer.identification
  };
  /**
   * Tratamento criado para adicionar o endereço do pagador no payload devido a
   * obrigatoriedade de envio do endereço para boleto no Brasil
   * Atualmente meios off (Boleto) nao e utilizada por Sellers no Brasil, mas foi adicionado para
   * evitar problemas futuros
   */
  if (paymentMethodId === "bolbradesco") {
    payer.address = {
      street_name: address.street_name,
      street_number: address.number,
      neighborhood: address.city,
      city: address.city,
      federal_unit: address.state,
      zip_code: address.zip_code
    };
  }

  return { additionalInfoPayer: additionalInfoPayer, payer: payer };
}

/**
 * Add info to payer object
 *
 * @param {dw.order.Order} order - the order to handle payments for
 * @param {payload} payload to add payer infos
 * @returns {Object}
 */
MercadopagoHelpers.prototype.addInfoPayerToSavedCreditCard = (order, payload) => {
  const paymentInstrument = order.customer.profile.wallet.paymentInstruments[0];
  payload.payer.type = "customer";
  payload.payer.id = paymentInstrument.custom.customerIdMercadoPago;

  return payload;
};

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
    item.title = validateAndReturnAttribute(prodLineItem.product, "name")
      ? prodLineItem.product.name : prodLineItem.productName;

    if (prodLineItem.product) {
      item.description = validateAndReturnAttribute(prodLineItem.product, "longDescription")
        ? validateAndReturnAttribute(prodLineItem.product.longDescription, "markup")
        : null;
      item.category_id = validateAndReturnAttribute(prodLineItem.product, "primaryCategory")
        ? validateAndReturnAttribute(prodLineItem.product.primaryCategory, "displayName") : null;
    }

    item.quantity = prodLineItem.quantityValue;
    item.unit_price = validateAndReturnAttribute(prodLineItem.adjustedGrossPrice, "value") / prodLineItem.quantityValue;

    return item;
  });

  let paymentMethodId;
  let token;
  let expirationDate;

  collections.forEach(order.getPaymentInstruments(), (payInstrument) => {
    if (payInstrument.paymentMethod === MercadopagoUtil.PAYMENT_METHOD.credit_card) {
      paymentMethodId = payInstrument.creditCardType;
      token = payInstrument.creditCardToken;
    } else if (payInstrument.paymentMethod === MercadopagoUtil.PAYMENT_METHOD.methods_off) {
      paymentMethodId = payInstrument.custom.paymentOffMethodId;
      expirationDate = getMethodsOffExpiration();
    } else {
      paymentMethodId = payInstrument.paymentMethod;
      expirationDate = getPixExpiration();
    }
  });

  const { additionalInfoPayer, payer } = getAdditionalInfoPayer(order, paymentMethodId);

  const threeDSecureMode = "optional";

  const transactionAmount = getTotalAmount(order);

  const payDataObj = {
    payer: payer,
    external_reference: order.orderNo,
    description: Resource.msgf("payload.description", "mercadopago", null, order.orderNo, Site.getCurrent().getHttpHostName()),
    additional_info: {
      ip_address: order.remoteHost,
      items: items,
      payer: additionalInfoPayer,
      seller: getAdditionalInfoSellerInfo(),
      shipments: getAdditionalInfoShipmentsInfo(order),
      billing: getAdditionalInfoBillingInfo(order),
      payment: getAdditionalInfoPaymentInfo(order)
    },
    payment_method_id: paymentMethodId.toLowerCase(),
    transaction_amount: transactionAmount.value,
    notification_url: URLUtils.https(
      "MercadopagoNotification-PaymentNotifications"
    ).toString(),
    point_of_interaction: {
      type: "CHECKOUT",
      sub_type: "INTER_PSP"
    },
    three_d_secure_mode: threeDSecureMode
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

    item.title = validateAndReturnAttribute(prodLineItem.product, "name")
      ? prodLineItem.product.name : prodLineItem.productName;

    item.description = validateAndReturnAttribute(prodLineItem.product, "longDescription")
      ? validateAndReturnAttribute(prodLineItem.product.longDescription, "markup") : null;

    if (prodLineItem.product.primaryCategory) {
      item.category_id = validateAndReturnAttribute(prodLineItem.product, "primaryCategory")
        ? validateAndReturnAttribute(prodLineItem.product.primaryCategory, "displayName") : null;
    }

    item.quantity = prodLineItem.quantityValue;
    item.unit_price = prodLineItem.basePrice.value;

    return item;
  });

  if (order.totalTax && order.totalTax.value) {
    items.push({ id: "salesTax", title: "Sales Tax", quantity: 1, unit_price: order.totalTax.value });
  }

  const merchandizeTotalPrice = order.getMerchandizeTotalPrice();
  const adjustedMerchandizeTotalPrice = order.getAdjustedMerchandizeTotalPrice();
  const orderDiscount = merchandizeTotalPrice.subtract(adjustedMerchandizeTotalPrice).value;

  if (orderDiscount) {
    items.push({ id: "orderDiscount", title: "Order Discount", quantity: 1, unit_price: -orderDiscount });
  }

  let paymentMethodId;
  let token;

  collections.forEach(order.getPaymentInstruments(), (payInstrument) => {
    paymentMethodId = payInstrument.paymentMethod;
  });
  const { additionalInfoPayer, payer } = getAdditionalInfoPayer(order, paymentMethodId);

  const transactionAmount = getTotalAmount(order);

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
      ip_address: order.remoteHost,
      payer: additionalInfoPayer,
      seller: getAdditionalInfoSellerInfo(),
      shipments: getAdditionalInfoShipmentsInfo(order),
      billing: getAdditionalInfoBillingInfo(order),
      payment: getAdditionalInfoPaymentInfo(order)
    },
    shipments: {
      cost: order.adjustedShippingTotalPrice.value,
      mode: "not_specified"
    },
    payment_method_id: paymentMethodId.toLowerCase(),
    transaction_amount: transactionAmount.value,
    auto_return: "all",
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

MercadopagoHelpers.prototype.getPaymentMethodFromPlace = (place) => {
  const methodList = MercadopagoHelpers.prototype.paymentMethods.retrieve();
  let result;

  collections.forEach(methodList, (method) => {
    if (method.payment_places) {
      const ind = Array.from(method.payment_places)
        .findIndex((paymentPlace2) => paymentPlace2.payment_option_id === place.value);
      if (ind > -1) {
        result = {
          id: method.id,
          place: method.payment_places[ind].name
        };
      }
    }
  });
  if (!result) {
    const ind = Array.from(methodList)
      .findIndex((method) => method.id === place.value);
    result = {
      id: methodList[ind].id,
      place: methodList[ind].name
    };
  }
  return result;
};

MercadopagoHelpers.prototype.getMethodsOffOptions = (
  isMethodsOffEnabled,
  paymentMethods,
  offTypes
) => {
  if (!isMethodsOffEnabled) {
    return null;
  }
  const methodsOffNotAllowed = ["pix", "pse", "fintoc"];
  const offOptions = [];

  collections.forEach(paymentMethods, (paymentMethod) => {
    if (offTypes.includes(paymentMethod.payment_type_id) && paymentMethod.status === "active") {
      if ("payment_places" in paymentMethod) {
        paymentMethod.payment_places.forEach((paymentPlace) => {
          if (paymentPlace.status === "active") {
            offOptions.push({
              id: paymentPlace.payment_option_id,
              name: paymentPlace.name,
              thumbnail: paymentPlace.thumbnail,
              sort: paymentPlace.sort
            });
          }
        });
      } else if (!methodsOffNotAllowed.includes(paymentMethod.id)) {
        offOptions.push(paymentMethod);
      }
    }
  });

  return sortMethodsOff(offOptions);
};

/**
 * Retrived the custom Mercadopago preferences
 * @returns {Object} custom preferences
 */
MercadopagoHelpers.prototype.getPreferences = () => ({
  mercadopagoPublicKey: Site.getCurrent().getCustomPreferenceValue(
    "mercadopagoPublicKey"
  ),
  pluginVersion: Resource.msg("int_mercadopago.version", "mercadopagoPreferences", null),
  platformVersion: System.getCompatibilityMode()
});

/**
 * Access Mercadopago Rest Api to get payment methods availabe for a credential
 */
MercadopagoHelpers.prototype.getInstallments = function (bin, amount) {
  const requestObject = {
    endpoint: "/payment_methods/installments"
    + "?public_key=" + Site.getCurrent().getCustomPreferenceValue("mercadopagoPublicKey")
    + "&bin=" + bin
    + "&amount=" + Number(amount.replace(/[^0-9-]+/g, "")) / 100,
    httpMethod: "GET"
  };

  const installmentsResponse = this.doCallService(requestObject);

  return installmentsResponse;
};

MercadopagoHelpers.prototype.doCallService = (requestObject) => callService(requestObject);

MercadopagoHelpers.prototype.getSavedCardsInstallments = (
  customerPaymentInstruments,
  amount
) => {
  const savedCardsInstallments = [];
  let installmentsResponse;
  let installments;
  if (customerPaymentInstruments) {
    for (let index = 0; index < customerPaymentInstruments.length; index++) {
      if (
        customerPaymentInstruments[index].custom &&
      customerPaymentInstruments[index].custom.cardBin
      ) {
        installmentsResponse = MercadopagoHelpers.prototype.getInstallments(
          customerPaymentInstruments[index].custom.cardBin,
          amount
        );
        installments = MercadopagoUtil.extractInstallments(installmentsResponse);
        savedCardsInstallments.push({
          id: customerPaymentInstruments[index].UUID,
          installments: installments
        });
      }
    }
  }
  return savedCardsInstallments;
};

MercadopagoHelpers.prototype.mountMetricData = (paymentInfo) => {
  const data = {
    id: paymentInfo.payments_details[0].id,
    status: paymentInfo.status,
    status_detail: paymentInfo.payments_details[0].status_detail,
    metadata: {
      plugin_version: paymentInfo.payments_metadata.plugin_version
    }
  };

  return data;
};

MercadopagoHelpers.prototype.sendMetric = (value, message, data, target) => {
  const location = Site.getCurrent().httpsHostName;
  const siteId = MercadopagoHelpers.prototype.getSiteId();
  const version = data.metadata ? data.metadata.plugin_version : "";
  const sellerInfo = getUserMPData();
  try {
    const payload = {
      value: value,
      message: message,
      target: target,
      plugin: version,
      platform: {
        name: "salesforce",
        uri: location,
        version: version,
        location: location
      },
      details: {
        site_id: siteId,
        payment_id: data.id ? data.id.toString() : "",
        payment_status: data.status ? data.status : "",
        payment_status_detail: data.status_detail ? data.status_detail : "",
        cust_id: sellerInfo.id.toString()
      }
    };

    callService(
      {
        endpoint: "/ppcore/prod/monitor/v1/event/datadog/big/" + target,
        httpMethod: "POST",
        payload: payload,
        hasApiVersion: false
      }
    );
  } catch (error) {
    log.error(JSON.stringify(error));
  }
};

module.exports = new MercadopagoHelpers();
