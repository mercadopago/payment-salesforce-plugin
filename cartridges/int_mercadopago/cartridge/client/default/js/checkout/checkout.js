'use strict';

var customerHelpers = require('BaseCartridge/checkout/customer');
var addressHelpers = require('BaseCartridge/checkout/address');
var shippingHelpers = require('BaseCartridge/checkout/shipping');
var billingHelpers = require('./billing');
var summaryHelpers = require('BaseCartridge/checkout/summary');
var formHelpers = require('BaseCartridge/checkout/formErrors');
var scrollAnimate = require('BaseCartridge/components/scrollAnimate');

var pixFormHelper = require('./mercadopagoPixForm');
var cardFormHelper = require('./mercadopagoCardForm');
var cardFormFields = require('./mercadopagoCardFormFields');
var methodsOffHelper = require('./mercadopagoMethodsOffForm');
var savedCardFormHelper = require('./mercadopagoSavedCardForm');

const publicKey = $(".js-mp-form").data("mpPreferences").mercadopagoPublicKey;
const mp = new MercadoPago(publicKey);
const fintoc = mp.fintoc();
const pluginVersion = $(".js-mp-form").data("mpPreferences").pluginVersion;
const platformVersion = $(".js-mp-form").data("mpPreferences").platformVersion;

function submitPayment(paymentMethodId, mpToken, defer) {
    var billingAddressForm = $('#dwfrm_billing .billing-address-block :input').serialize();

    $('body').trigger('checkout:serializeBilling', {
        form: $('#dwfrm_billing .billing-address-block'),
        data: billingAddressForm,
        callback: function (data) {
            if (data) {
                billingAddressForm = data;
            }
        }
    });

    var contactInfoForm = $('#dwfrm_billing .contact-info-block :input').serialize();

    $('body').trigger('checkout:serializeBilling', {
        form: $('#dwfrm_billing .contact-info-block'),
        data: contactInfoForm,
        callback: function (data) {
            if (data) {
                contactInfoForm = data;
            }
        }
    });

    if (paymentMethodId === 'CREDIT_CARD') {
        $("#cardToken").val(mpToken.token);
    }

    var activeTabId = $('.tab-pane.active').attr('id');
    var paymentInfoSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields :input';
    var paymentInfoForm = $(paymentInfoSelector).serialize();

    $('body').trigger('checkout:serializeBilling', {
        form: $(paymentInfoSelector),
        data: paymentInfoForm,
        callback: function (data) {
            if (data) {
                paymentInfoForm = data;
            }
        }
    });

    var paymentForm = billingAddressForm + '&' + contactInfoForm + '&' + paymentInfoForm;

    if ($('.data-checkout-stage').data('customer-type') === 'registered') {
        // if payment method is credit card
        if (paymentMethodId === 'CREDIT_CARD') {
            if (!($('.payment-information').data('is-new-payment'))) {
                var cvvCode = $('.saved-payment-instrument.' +
                    'selected-payment .saved-payment-security-code').val();

                if (cvvCode === '') {
                    var cvvElement = $('.saved-payment-instrument.' +
                        'selected-payment ' +
                        '.form-control');
                    cvvElement.addClass('is-invalid');
                    scrollAnimate(cvvElement);
                    defer.reject();
                    return defer;
                }

                var installments = $('.saved-payment-installments').val();

                if(installments === '') {
                    var installmentsElement = $('.saved-payment-instrument.' +
                        'saved-payment-installments');
                    installmentsElement.addClass('is-invalid');

                    defer.reject();
                    return defer;
                }

                var $savedPaymentInstrument = $('.saved-payment-instrument' +
                    '.selected-payment'
                );

                paymentForm += '&storedPaymentUUID=' +
                    $savedPaymentInstrument.data('uuid');
                                       
                paymentForm += '&dwfrm_billing_savedCreditFields_savedSecurityCode=' + cvvCode;
                                 
                paymentForm += '&dwfrm_billing_savedCreditFields_savedInstallments=' + installments;
            }
        }
    }

    // disable the next:Place Order button here
    $('body').trigger('checkout:disableButton', '.next-step-button button');

    $.ajax({
        url: $('#dwfrm_billing').attr('action'),
        method: 'POST',
        data: paymentForm,
        success: function (data) {
            // enable the next:Place Order button here
            $('body').trigger('checkout:enableButton', '.next-step-button button');
            // look for field validation errors
            if (data.error) {
                if (data.fieldErrors.length) {
                    data.fieldErrors.forEach(function (error) {
                        if (Object.keys(error).length) {
                            formHelpers.loadFormErrors('.payment-form', error);
                        }
                    });
                }

                if (data.serverErrors.length) {
                    data.serverErrors.forEach(function (error) {
                        $('.error-message').show();
                        $('.error-message-text').text(error);
                        scrollAnimate($('.error-message'));
                    });
                }

                if (data.cartError) {
                    window.location.href = data.redirectUrl;
                }

                defer.reject();
            } else {
                //
                // Populate the Address Summary
                //
                $('body').trigger('checkout:updateCheckoutView',
                    { order: data.order, customer: data.customer, options: data.options });

                if (data.renderedPaymentInstruments) {
                    $('.stored-payments').empty().html(
                        data.renderedPaymentInstruments
                    );
                }

                if (data.customer.registeredUser
                    && data.customer.customerPaymentInstruments.length
                ) {
                    $('.cancel-new-payment').removeClass('checkout-hidden');
                }

                scrollAnimate();
                defer.resolve(data);
            }
        },
        error: function (err) {
            // enable the next:Place Order button here
            $('body').trigger('checkout:enableButton', '.next-step-button button');
            if (err.responseJSON && err.responseJSON.redirectUrl) {
                window.location.href = err.responseJSON.redirectUrl;
            }
        }
    });

    return defer;
}

/**
 * Create the jQuery Checkout Plugin.
 *
 * This jQuery plugin will be registered on the dom element in checkout.isml with the
 * id of "checkout-main".
 *
 * The checkout plugin will handle the different state the user interface is in as the user
 * progresses through the varying forms such as shipping and payment.
 *
 * Billing info and payment info are used a bit synonymously in this code.
 *
 */
(function ($) {
    $.fn.checkout = function () { // eslint-disable-line
        var plugin = this;

        //
        // Collect form data from user input
        //
        var formData = {
            // Customer Data
            customer: {},

            // Shipping Address
            shipping: {},

            // Billing Address
            billing: {},

            // Payment
            payment: {},

            // Gift Codes
            giftCode: {}
        };

        //
        // The different states/stages of checkout
        //
        var checkoutStages = [
            'customer',
            'shipping',
            'payment',
            'placeOrder',
            'submitted'
        ];

        /**
         * Updates the URL to determine stage
         * @param {number} currentStage - The current stage the user is currently on in the checkout
         */
        function updateUrl(currentStage) {
            history.pushState(
                checkoutStages[currentStage],
                document.title,
                location.pathname
                + '?stage='
                + checkoutStages[currentStage]
                + '#'
                + checkoutStages[currentStage]
            );
        }

        function getMethodsOffSelected(){
            var radios = document.getElementsByName("payment_methods_off");
            for(var i = 0; i < radios.length; i++){
                if(radios[i].checked){
                    document.getElementById("paymentMethodsOffChecked").value = radios[i].value;
                    break;
                }
            }
        }

        var amount = "";
        var savedMethods;
        var savedCardsInstallments;
        //
        // Local member methods of the Checkout plugin
        //
        var members = {

            // initialize the currentStage variable for the first time
            currentStage: 0,

            /**
             * Set or update the checkout stage (AKA the shipping, billing, payment, etc... steps)
             * @returns {Object} a promise
             */
            updateStage: function () {
                var stage = checkoutStages[members.currentStage];
                var defer = $.Deferred(); // eslint-disable-line

                if (stage === 'customer') {
                    //
                    // Clear Previous Errors
                    //
                    customerHelpers.methods.clearErrors();
                    //
                    // Submit the Customer Form
                    //
                    var customerFormSelector = customerHelpers.methods.isGuestFormActive() ? customerHelpers.vars.GUEST_FORM : customerHelpers.vars.REGISTERED_FORM;
                    var customerForm = $(customerFormSelector);
                    $.ajax({
                        url: customerForm.attr('action'),
                        type: 'post',
                        data: customerForm.serialize(),
                        success: function (data) {
                            if (data.redirectUrl) {
                                window.location.href = data.redirectUrl;
                            } else {
                                customerHelpers.methods.customerFormResponse(defer, data);
                            }
                        },
                        error: function (err) {
                            if (err.responseJSON && err.responseJSON.redirectUrl) {
                                window.location.href = err.responseJSON.redirectUrl;
                            }
                            // Server error submitting form
                            defer.reject(err.responseJSON);
                        }
                    });
                    return defer;
                } else if (stage === 'shipping') {
                    cardFormHelper.unmountedCardForm();
                    savedCardFormHelper.unmountedCardForm();
                    //
                    // Clear Previous Errors
                    //
                    formHelpers.clearPreviousErrors('.shipping-form');

                    //
                    // Submit the Shipping Address Form
                    //
                    var isMultiShip = $('#checkout-main').hasClass('multi-ship');
                    var formSelector = isMultiShip ?
                        '.multi-shipping .active form' : '.single-shipping .shipping-form';
                    var form = $(formSelector);

                    if (isMultiShip && form.length === 0) {
                        // disable the next:Payment button here
                        $('body').trigger('checkout:disableButton', '.next-step-button button');
                        // in case the multi ship form is already submitted
                        var url = $('#checkout-main').attr('data-checkout-get-url');
                        $.ajax({
                            url: url,
                            method: 'GET',
                            success: function (data) {
                                // enable the next:Payment button here
                                $('body').trigger('checkout:enableButton', '.next-step-button button');
                                if (!data.error) {
                                    $('body').trigger('checkout:updateCheckoutView',
                                        { order: data.order, customer: data.customer });
                                    defer.resolve();
                                } else if (data.message && $('.shipping-error .alert-danger').length < 1) {
                                    var errorMsg = data.message;
                                    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
                                        'fade show" role="alert">' +
                                        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                                        '<span aria-hidden="true">&times;</span>' +
                                        '</button>' + errorMsg + '</div>';
                                    $('.shipping-error').append(errorHtml);
                                    scrollAnimate($('.shipping-error'));
                                    defer.reject();
                                } else if (data.redirectUrl) {
                                    window.location.href = data.redirectUrl;
                                }
                            },
                            error: function () {
                                // enable the next:Payment button here
                                $('body').trigger('checkout:enableButton', '.next-step-button button');
                                // Server error submitting form
                                defer.reject();
                            }
                        });
                    } else {
                        var shippingFormData = form.serialize();

                        $('body').trigger('checkout:serializeShipping', {
                            form: form,
                            data: shippingFormData,
                            callback: function (data) {
                                shippingFormData = data;
                            }
                        });
                        // disable the next:Payment button here
                        $('body').trigger('checkout:disableButton', '.next-step-button button');
                        $.ajax({
                            url: form.attr('action'),
                            type: 'post',
                            data: shippingFormData,
                            success: function (data) {
                                // enable the next:Payment button here
                                $('body').trigger('checkout:enableButton', '.next-step-button button');
                                shippingHelpers.methods.shippingFormResponse(defer, data);

                                amount = "" + data.paymentAmount;
                                savedMethods = data.customer.customerPaymentInstruments;
                                // validate if there is a valid saved card
                                if (savedMethods != null && savedMethods.some((method) => method.custom.customerIdMercadoPago !== '')) {
                                    savedCardFormHelper.createCardForm(amount).mount();
                                    $('body').trigger('checkout:updateSavedCardInstallments');
                                } else {
                                    cardFormHelper.createCardForm(amount).mount();
                                }
                                pixFormHelper.prepareForm();
                                methodsOffHelper.prepareMethodsOffForm();
                            },
                            error: function (err) {
                                // enable the next:Payment button here
                                $('body').trigger('checkout:enableButton', '.next-step-button button');
                                if (err.responseJSON && err.responseJSON.redirectUrl) {
                                    window.location.href = err.responseJSON.redirectUrl;
                                }
                                // Server error submitting form
                                defer.reject(err.responseJSON);
                            }
                        });
                    }

                    return defer;
                } else if (stage === 'payment') {
                    //
                    // Submit the Billing Address Form
                    //
                    formHelpers.clearPreviousErrors('.payment-form');

                    let paymentMethodId = $('.payment-information').data('payment-method-id');

                    if (paymentMethodId === 'CREDIT_CARD') {
                        var $savedPaymentInstrument = $('.saved-payment-instrument' +
                            '.selected-payment'
                        );

                        const usingSavedPayment =  $savedPaymentInstrument && $savedPaymentInstrument.length > 0 && $savedPaymentInstrument.is(':visible');
                        if(usingSavedPayment){
                            defer = submitPayment(paymentMethodId, "", defer);
                        } else {
                            cardFormHelper.getCardForm().createCardToken().then(mpToken => {
                                defer = submitPayment(paymentMethodId, mpToken, defer);
                            }).catch(error => {

                                var errors = {};
                                var codes = [];

                                if (Array.isArray(error)) {
                                    error.forEach(item => {
                                        codes.push(item.code);
                                    })
                                } else if (error.cause && Array.isArray(error.cause)) {
                                    error.cause.forEach(item => {
                                        codes.push(item.code);
                                    })
                                }

                                codes.forEach(code => {
                                    var fields = cardFormFields.getFieldByFieldCode(code);
                                    fields.forEach(field => {
                                        var key = $('#' + field.fieldId).prop('name');
                                        var value = $(".mp-error-messages").data("mpErrorMessages")[code];
                                        errors[key] = value;
                                    });
                                })

                                formHelpers.loadFormErrors('.payment-form', errors);
                                defer.reject();
                            });
                        }
                    } else if (paymentMethodId === 'PIX') {
                        defer = submitPayment(paymentMethodId, "", defer);
                    } else if (paymentMethodId === 'CASH') {
                        getMethodsOffSelected();
                        defer = submitPayment(paymentMethodId, "", defer);
                    } else if (paymentMethodId === 'CHECKOUT_PRO') {
                        defer = submitPayment(paymentMethodId, "", defer);
                    } else if (paymentMethodId === 'MERCADO_CREDITO') {
                        defer = submitPayment(paymentMethodId, "", defer);
                    } else if (paymentMethodId === 'FINTOC') {
                        defer = submitPayment(paymentMethodId, "", defer);
                    }
                    return defer;
                } else if (stage === 'placeOrder') {
                    // disable the placeOrder button here
                    $('body').trigger('checkout:disableButton', '.next-step-button button');

                    $.ajax({
                        url: $('.place-order').data('action'),
                        method: 'POST',
                        success: function (data) {
                            // enable the placeOrder button here
                            $('body').trigger('checkout:enableButton', '.next-step-button button');

                            if (data.error) {
                                if (data.status_detail) {
                                    if (data.status_detail === "pending_challenge") {
                                        members.openModalChallenge(data);
                                    }

                                    if(data.status_detail === "pending_waiting_transfer") {
                                        members.callFintocService(data);
                                    }

                                }
                                if (data.cartError) {
                                    window.location.href = data.redirectUrl;
                                    defer.reject();
                                } else {
                                    // go to appropriate stage and display error message
                                    defer.reject(data);
                                }
                            } else {
                                let currentPaymentMethod = $('.payment-information').data('payment-method-id');

                                if (currentPaymentMethod === 'CHECKOUT_PRO') {
                                    window.location.replace(data.checkoutProLink);
                                } else if (currentPaymentMethod === 'MERCADO_CREDITO') {
                                    window.location.replace(data.mercadoCreditoLink);
                                } else {
                                    var redirect = $('<form>')
                                        .appendTo(document.body)
                                        .attr({
                                            method: 'POST',
                                            action: data.continueUrl
                                        });

                                    $('<input>')
                                        .appendTo(redirect)
                                        .attr({
                                            name: 'orderID',
                                            value: data.orderID
                                        });

                                    $('<input>')
                                        .appendTo(redirect)
                                        .attr({
                                            name: 'orderToken',
                                            value: data.orderToken
                                        });

                                    redirect.submit();
                                }

                                defer.resolve(data);
                            }
                        },
                        error: function () {
                            // enable the placeOrder button here
                            $('body').trigger('checkout:enableButton', $('.next-step-button button'));
                        }
                    });

                    return defer;
                }
                var p = $('<div>').promise(); // eslint-disable-line
                setTimeout(function () {
                    p.done(); // eslint-disable-line
                }, 500);
                return p; // eslint-disable-line
            },

            /**
             * Challenge service call.
             *
             */
            loadChallengeInfo: function (threeDsData) {
                setTimeout(function () {

                    try {
                        members.modalVisibilityMode('.loading-area', true);
                        members.modalVisibilityMode('.validation-area', false);
                        var iframe = document.createElement("iframe");
                        iframe.name = "myframe";
                        iframe.id = "myframe";
                        iframe.height = "500px";
                        iframe.width = "600px";
                        iframe.style = "border:none;";

                        document.getElementById("iframe-challenge").appendChild(iframe);

                        var idocument = iframe.contentWindow.document;

                        var myform = idocument.createElement("form");
                        myform.name = "myform";
                        myform.setAttribute("target", "myframe");
                        myform.setAttribute("method", "post");
                        myform.setAttribute("action", threeDsData.external_resource_url);

                        var hiddenField = idocument.createElement("input");
                        hiddenField.setAttribute("type", "hidden");
                        hiddenField.setAttribute("name", "creq");
                        hiddenField.setAttribute("value", threeDsData.creq);
                        myform.appendChild(hiddenField);
                        iframe.appendChild(myform);

                        myform.submit();

                    } catch (error) {
                        const message = error.message || error;
                        members.sendMetric('mp_3ds_sales_load_challenge_info', 'error', message, threeDsData);
                    }
                }, 3000)
            },

            /**
             * Start the challenge stages.
             *
             */
            openModalChallenge: function (threeDsData) {
                try {
                    members.modalVisibilityMode('.validation-area', true);
                    $('body').trigger('checkout:open3dsModal', $('.three-ds-modal-box'));
                    $('body').on('click', '.three-ds-modal-box .modal-button-close', function () {
                        $('body').trigger('checkout:close3dsModal', $('.three-ds-modal-box'));
                        members.showErrorMessage(threeDsData.mpErrorMessage);
                    });

                    members.loadCardInformations(threeDsData);
                    members.loadChallengeInfo(threeDsData);
                    members.addListenerResponseChallenge(threeDsData);
                    members.sendMetric('mp_3ds_sales_modal', 'success', '3ds modal challenge opened sales', threeDsData);
                } catch (error) {
                    const message = error.message || error;
                    members.sendMetric('mp_3ds_sales_modal', 'error', message, threeDsData);

                }
            },

            /**
             * Load card information
             *
             */
            loadCardInformations: function (threeDsData) {
                try {
                    let card_information = "(" + threeDsData.credit_card_type + " **** " + threeDsData.masked_credit_card_number.replaceAll("*", "").trim() + ")"
                    $('#card-information').text(card_information);
                } catch (error) {
                    error.message || error;
                }
            },

            /**
            * Listening to challenge status.
            *
            */
            addListenerResponseChallenge: function (threeDsData) {
                window.addEventListener('message', function (e) {
                    const statusChallenge = e.data.status;
                    if (statusChallenge === 'COMPLETE') {
                        members.modalVisibilityMode('.validation-area', true);
                        members.modalVisibilityMode('.confirmation-area', false);
                        members.loadPooling(threeDsData);
                    }
                });
            },

            /**
             * Controls the visibility of modal steps.
             *
             */
            modalVisibilityMode: function (attribute, value) {
                $(attribute).prop('hidden', value);
            },

            /**
             * Pooling in payments to get payment status.
             *
             */
            loadPooling: function (threeDsData) {
                try {
                    const interval = 2000;
                    let elapsedTime = 0;

                    const intervalId = setInterval(() => {
                        members.getPaymentStatus(threeDsData);
                        const paymentStatus = threeDsData.paymentStatus;
                        if (elapsedTime >= 10000 || paymentStatus === 'approved' || paymentStatus === 'rejected') {
                            members.modalVisibilityMode('.confirmation-area', true);
                            $('body').trigger('checkout:close3dsModal', $('.three-ds-modal-box'));
                            clearInterval(intervalId);
                            members.authorizePayment(threeDsData);
                            members.sendMetric('mp_3ds_sales_pooling_time', 'success', 'Pooling time: ' + elapsedTime.toString() + ' ms', threeDsData);
                        }
                        elapsedTime += interval;
                    }, interval);
                } catch (error) {
                    const message = error.message || error;
                        members.sendMetric('mp_3ds_sales_pooling_time', 'error', message, threeDsData);
                }
            },

            /**
             * Retrieves the payment status.
             * @param {*} threeDsData 
             */
            getPaymentStatus: function (threeDsData) {

                const payload = {
                    transactionID: threeDsData.transactionID
                };

                $.ajax({
                    url: 'CheckoutServices-GetPaymentInfo',
                    method: 'GET',
                    data: payload,
                    async: false,
                    success: function (data) {
                        threeDsData.paymentStatus = data.poolingStatus;
                    },
                    error: function (error) {
                        error.message || error;
                    }
                });
            },

            /**
            * Send metrics to Datadog.
            * @param {string} event_type
            * @param {string} value
            * @param {string} message
            * @param {object} data
            */
            sendMetric(event_type, value, message, data) {
                const url = "https://api.mercadopago.com/ppcore/prod/monitor/v1/event/datadog/big/" + event_type;
                const payload = {
                    value: value,
                    message: message,
                    plugin_version: data.plugin_version ? data.plugin_version : pluginVersion,
                    platform: {
                        name: "salesforce",
                        version: platformVersion,
                        uri: window.location.pathname,
                        url: window.location.origin,
                    },
                    details: {
                        order_id: data.orderID ? data.orderID : "",
                        payment_status: data.status ? data.status : "",
                        payment_status_detail: data.status_detail ? data.status_detail : "",
                        transaction_id: data.transactionID ? data.transactionID : ""
                    }
                };

                navigator.sendBeacon(url, JSON.stringify(payload));
            },

            /**
            * Updates order status.
            * @param {*} paymentData
            */
            authorizePayment: function (paymentData) {
                const params = new URLSearchParams({
                    orderID: paymentData.orderID,
                    orderToken: paymentData.orderToken,
                    transactionID: paymentData.transactionID,
                  });

                $.ajax({
                    url: 'CheckoutServices-AuthorizePayment?' + params.toString(),
                    type: "POST",
                    dataType: "html",
                    async: false,
                    success: function (data) {
                        const dataParse = JSON.parse(data);

                        if (dataParse.status === 'rejected' || 
                            dataParse.statusDetail === 'pending_challenge' || 
                            dataParse.statusDetail === 'pending_waiting_transfer') {
                            members.showErrorMessage(dataParse.errorMessage);
                        } else {
                            $('.error-message').remove();
                            window.location = dataParse.continueURL;
                        }
                    },
                    error: function (error) {
                        error.message || error;
                    }
                });
            },

            callFintocService: function (fintocData){
                try {
                    fintoc.open({
                        institutionId: "",
                        username: "",
                        widgetToken: fintocData.external_reference_id,
                        onSuccess,
                        onExit,
                        onEvent,
                    });
                    this.sendMetric('PAY_FINTOC', 'success_open_fintoc_modal', 'success open modal', fintocData);
                } catch (error) {
                    members.sendMetric('PAY_FINTOC', 'fail_open_fintoc_modal', error.message, fintocData);
                }

                function onSuccess() {
                    members.authorizePayment(fintocData);
                    members.sendMetric('PAY_FINTOC', 'payment_success_fintoc_modal', 'finished payment', fintocData);
                }

                function onExit() {
                    members.showErrorMessage(fintocData.mpErrorMessage);
                    members.sendMetric('PAY_FINTOC', 'closed_fintoc_modal', 'closed fintoc modal', fintocData);
                }

                function onEvent(event) { 
                    console.log("onEvent", event);
                }
            },
            /**
            * Show error message.
            * @param {string} message
            */
            showErrorMessage: function (message) {
                $('.error-message').show();
                $('.error-message-text').text(message);
                scrollAnimate($('.error-message'));
            },

            /**
            * Create new iframe and remove the previous one
            */
            createIframe: function () {
                $('#iframe-challenge').remove();
                $(".iframe-container").append('<iframe id="iframe-challenge" src="about:blank" title="Challenge" width="600px" height="500px" overflow-x="scroll" overflow-y="scroll" scrolling="yes" frameborder="0"> </iframe>');
            },

            /**
             * Initialize the checkout stage.
             *
             */
            initialize: function () {
                // set the initial state of checkout
                members.currentStage = checkoutStages
                    .indexOf($('.data-checkout-stage').data('checkout-stage'));
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);

                $('body').on('click', '.submit-customer-login', function (e) {
                    e.preventDefault();
                    members.nextStage();
                });

                $('body').on('click', '.submit-customer', function (e) {
                    e.preventDefault();
                    members.nextStage();
                });

                //
                // Handle Payment option selection
                //
                $('input[name$="paymentMethod"]', plugin).on('change', function () {
                    $('.credit-card-form').toggle($(this).val() === 'CREDIT_CARD');
                });

                //
                // Handle Next State button click
                //
                $(plugin).on('click', '.next-step-button button', function () {
                    members.nextStage();
                });

                $('body').on('click', '.methods-off-options-more', function () {
                    $('body').trigger('checkout:toggleMoreOptionsButtonText', $('.methods-off-options'));
                    var options = $('.methods-off-places-more-options');
                    for (let index = 0; index < options.length; index++) {
                        $('body').trigger('checkout:toggleMoreOptions', options[index]);
                    };
                });

                //
                // Handle Edit buttons on shipping and payment summary cards
                //
                $('.customer-summary .edit-button', plugin).on('click', function () {
                    members.gotoStage('customer');
                });

                $('.shipping-summary .edit-button', plugin).on('click', function () {
                    if (!$('#checkout-main').hasClass('multi-ship')) {
                        $('body').trigger('shipping:selectSingleShipping');
                    }

                    members.gotoStage('shipping');
                });

                $('.payment-summary .edit-button', plugin).on('click', function () {
                    $('body').trigger('checkout:updateSavedCardInstallments');
                    members.gotoStage('payment');
                });

                $('body').on('click', '.three-ds-modal-box .modal-button-close', function () {
                    $('body').trigger('checkout:close3dsModal', $('.three-ds-modal-box'));
                });

                $('#savedInstallments').on('change', function() {
                    $('body').trigger('checkout:addInstallmentsTaxes', {
                        installments: this.value, 
                        tax: this.options[this.selectedIndex].getAttribute('data-tax')
                    });
                });

                // 
                // Handle saved and new card forms
                // 
                $('body').on('click', '.add-payment', function () {
                    $('.saved-payment-instrument').removeClass('selected-payment');
                    $('body').trigger('checkout:addPaymentMethod', amount);
                    $('body').trigger('checkout:updateSavedCardInstallments');
                });
                
                $('body').on('click', '.cancel-new-payment', function () {
                    $('body').trigger('checkout:cancelAddPaymentMethod', amount);
                    $('body').trigger('checkout:updateSavedCardInstallments');
                });

                $('body').on("click", ".saved-payment-instrument", function () {
                    if (!$(this).hasClass("selected-payment")) {
                        $('.saved-payment-instrument').removeClass('selected-payment');
                        $(this).addClass("selected-payment");
                        $('body').trigger('checkout:savedCardFormRemount', amount);
                        $('body').trigger('checkout:updateSavedCardInstallments');
                    }
                });

                //
                // remember stage (e.g. shipping)
                //
                updateUrl(members.currentStage);

                //
                // Listen for foward/back button press and move to correct checkout-stage
                //
                $(window).on('popstate', function (e) {
                    //
                    // Back button when event state less than current state in ordered
                    // checkoutStages array.
                    //
                    if (e.state === null ||
                        checkoutStages.indexOf(e.state) < members.currentStage) {
                        members.handlePrevStage(false);
                    } else if (checkoutStages.indexOf(e.state) > members.currentStage) {
                        // Forward button  pressed
                        members.handleNextStage(false);
                    }
                });

                //
                // Set the form data
                //
                plugin.data('formData', formData);
            },

            /**
             * The next checkout state step updates the css for showing correct buttons etc...
             */
            nextStage: function () {
                var promise = members.updateStage();

                promise.done(function () {
                    // Update UI with new stage
                    $('.error-message').hide();
                    members.handleNextStage(true);
                });

                promise.fail(function (data) {
                    // show errors
                    if (data) {
                        if (data.errorStage) {
                            members.gotoStage(data.errorStage.stage);

                            if (data.errorStage.step === 'billingAddress') {
                                var $billingAddressSameAsShipping = $(
                                    'input[name$="_shippingAddressUseAsBillingAddress"]'
                                );
                                if ($billingAddressSameAsShipping.is(':checked')) {
                                    $billingAddressSameAsShipping.prop('checked', false);
                                }
                            }
                        }

                        if (data.errorMessage) {
                            $('.error-message').show();
                            $('.error-message-text').text(data.errorMessage);
                            scrollAnimate($('.error-message'));
                        }
                    }
                });
            },

            /**
             * The next checkout state step updates the css for showing correct buttons etc...
             *
             * @param {boolean} bPushState - boolean when true pushes state using the history api.
             */
            handleNextStage: function (bPushState) {
                if (members.currentStage < checkoutStages.length - 1) {
                    // move stage forward
                    members.currentStage++;

                    //updateTotals
                }

                // Set the next stage on the DOM
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
            },

            /**
             * Previous State
             */
            handlePrevStage: function () {
                if (members.currentStage > 0) {
                    // move state back
                    members.currentStage--;
                    updateUrl(members.currentStage);
                }

                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
            },

            /**
             * Use window history to go to a checkout stage
             * @param {string} stageName - the checkout state to goto
             */
            gotoStage: function (stageName) {
                members.currentStage = checkoutStages.indexOf(stageName);
                updateUrl(members.currentStage);
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
            }

        };

        //
        // Initialize the checkout
        //
        members.initialize();

        return this;
    };
}(jQuery));


var exports = {
    initialize: function () {
        $('#checkout-main').checkout();
    },

    updateCheckoutView: function () {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            if (data.csrfToken) {
                $("input[name*='csrf_token']").val(data.csrfToken);
            }
            customerHelpers.methods.updateCustomerInformation(data.customer, data.order);
            shippingHelpers.methods.updateMultiShipInformation(data.order);
            summaryHelpers.updateTotals(data.order.totals);
            data.order.shipping.forEach(function (shipping) {
                shippingHelpers.methods.updateShippingInformation(
                    shipping,
                    data.order,
                    data.customer,
                    data.options
                );
            });
            billingHelpers.methods.updateBillingInformation(
                data.order,
                data.customer,
                data.options
            );
            billingHelpers.methods.updatePaymentInformation(data.order, data.options);
            summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
        });
    },

    disableButton: function () {
        $('body').on('checkout:disableButton', function (e, button) {
            $(button).prop('disabled', true);
        });
    },

    enableButton: function () {
        $('body').on('checkout:enableButton', function (e, button) {
            $(button).prop('disabled', false);
        });
    },

    open3dsModal: function () {
        $('body').on('checkout:open3dsModal', function (e, modal) {
            $(modal).prop('hidden', false);
            $('.loading-area').prop('hidden', false);
        });
    },

    close3dsModal: function () {
        $('body').on('checkout:close3dsModal', function (e, modal) {
            $(modal).prop('hidden', true);
        });
    },

    toggleMoreOptions: function () {
        $('body').on('checkout:toggleMoreOptions', function (e, option) {
            $(option).prop('hidden', !$(option).prop('hidden'));
        });
    },

    toggleMoreOptionsButtonText: function () {
        $('body').on('checkout:toggleMoreOptionsButtonText', function (e, buttonText) {
            $("#methods-off-options").prop('hidden', !$("#methods-off-options").prop('hidden'));
            $("#methods-off-options-hide").prop('hidden', !$("#methods-off-options-hide").prop('hidden'));
        });
    },

    addPaymentMethod: function () {
        $('body').on('checkout:addPaymentMethod', function (e, amount) {
            savedCardFormHelper.unmountedCardForm();
            cardFormHelper.createCardForm(amount).mount();
        });
    },
    
    cancelAddPaymentMethod: function () {
        $('body').on('checkout:cancelAddPaymentMethod', function (e, amount) {
            cardFormHelper.unmountedCardForm();
            savedCardFormHelper.createCardForm(amount).mount();
        });
    },

    savedCardFormRemount: function () {
        $('body').on('checkout:savedCardFormRemount', function (e, amount) {
            savedCardFormHelper.unmountedCardForm();
            savedCardFormHelper.createCardForm(amount).mount();
        });
    },

    updateSavedCardInstallments: function () {
        $('body').on('checkout:updateSavedCardInstallments', function (e) {
            const installmentsSelect = document.getElementById("savedInstallments");
            if (!installmentsSelect) {
                $('body').trigger('checkout:addInstallmentsTaxes', {
                    installments: null, 
                    tax: null
                });
                return;
            }
            installmentsSelect.innerHTML = "";
            const selectedCard = document.querySelector(".row.saved-payment-instrument.selected-payment")
            if (!selectedCard) {
                const op = document.createElement("option");
                op.text = $(".mp-text-messages").data("mpTextMessages")["field.installments"];
                installmentsSelect.appendChild(op);

                $('body').trigger('checkout:addInstallmentsTaxes', {
                    installments: null, 
                    tax: null
                });
                return;
            }
            document.querySelector(".selected-payment #savedSecurityCode").value = "";
            const cardId = selectedCard.getAttribute("data-uuid");
            const selectedCardInstallments = savedCardsInstallments.find((item) => item.id === cardId).installments;
            for (let i = 0; i < selectedCardInstallments.length; i++) {
                const element = selectedCardInstallments[i];
                const op = document.createElement("option");
                op.text = savedCardFormHelper.formatInstallmentsMessage(element);
                op.value = element.installments;

                const tax = element.labels;
                if(tax.length > 0){
                    for (var l = 0; l < tax.length; l++) {
                        if (tax[l].indexOf('CFT_') !== -1){
                            op.setAttribute('data-tax', tax[l]);
                        }
                    }
                }
                installmentsSelect.appendChild(op);
            }
            $('body').trigger('checkout:addInstallmentsTaxes', {
                installments: installmentsSelect.value, 
                tax: installmentsSelect.options[installmentsSelect.selectedIndex].getAttribute('data-tax')
            });
        });;
    },

    addInstallmentsTaxes: function () {
        $('body').on('checkout:addInstallmentsTaxes', function (e, data) {

            const {installments, tax} = data;

            if(parseInt(installments) <= 1 || tax == null) {
                $('.mp-tax-info').hide();
                return;
            }

            const taxSplit = tax.split('|');
            const formatedFees = {};
            taxSplit.forEach(function(item) {
                let feeName = null;
                let label = null;

                switch (true) {
                    case item.includes('TNA'):
                        feeName = 'TNA';
                        label = null;
                        break;
                    case item.includes('TEA'):
                        feeName = 'TEA';
                        label = null;
                        break;
                    case item.includes('CFT'):
                        feeName = 'CFT';
                        label = 'CFTEA';
                        break;
                }
                formatedFees[feeName] = item.replace(`${feeName}_`, `${(label ? label : feeName)}: `);
            });

            Object.entries(formatedFees).forEach(([key, value])  => {
                $(`.text-${key.toLowerCase()}`).text(value);
            });
            $('.mp-tax-info').show();
        });
    }
};

[customerHelpers, billingHelpers, shippingHelpers, addressHelpers].forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (typeof library[item] === 'object') {
            exports[item] = $.extend({}, exports[item], library[item]);
        } else {
            exports[item] = library[item];
        }
    });
});

module.exports = exports;
