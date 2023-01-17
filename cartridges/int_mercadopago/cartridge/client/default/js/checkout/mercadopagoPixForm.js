const publicKey = $(".js-mp-form").data("mpPreferences").mercadopagoPublicKey;

const mp = new MercadoPago(publicKey);

let identificationTypes;

function prepareForm() {
  if (!identificationTypes) {
    mp.getIdentificationTypes().then((data) => {
      identificationTypes = data;

      const $el = $("#docTypePix");
      $("#docTypePix").empty();

      identificationTypes.forEach((identification) => {
        $el.append(
          $("<option></option>")
            .attr("value", identification.id)
            .text(identification.name)
        );
      });
    });
  }
}

module.exports = {
  prepareForm: prepareForm
};
