const processInclude = require("BaseCartridge/util");
const checkout = require("./checkout/checkout");

$(document).ready(() => {
  processInclude(checkout);
});
