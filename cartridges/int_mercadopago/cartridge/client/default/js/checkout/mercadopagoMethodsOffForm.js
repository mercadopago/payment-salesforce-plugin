const publicKey = $(".js-mp-form").data("mpPreferences").mercadopagoPublicKey;

const mp = new MercadoPago(publicKey);

function prepareMethodsOffForm() {
  mp.getIdentificationTypes().then((identificationTypes) => {
    const $docTypesElement = $("#docTypeMethodsOff");

    $("docTypeMethodsOff").empty();

    if (identificationTypes.length) {
      identificationTypes.forEach((identification) => {
        $docTypesElement.append(
          $("<option></option>")
            .attr("value", identification.id)
            .text(identification.name)
        );
      });
    } else {
      $("#methods-off-document").remove();
    }
  });
}

module.exports = {
  prepareMethodsOffForm: prepareMethodsOffForm
};
