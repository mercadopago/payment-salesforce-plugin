function createSiteMock(preferences) {
  return {
    getCurrent: () => ({
      defaultLocale: "en_US",
      getName: () => "Test Site",
      getHttpHostName: () => "test.example.com",
      httpsHostName: "https://test.example.com",
      getCustomPreferenceValue: (key) => {
        if (preferences && preferences[key]) {
          return preferences[key];
        }
        // Default values for common preferences
        if (key === "mercadopagoPublicKey") {
          return {
            value: "mercadopagoPublicKey",
            toString: () => "mercadopagoPublicKey"
          };
        }
        return {
          value: null,
          toString: () => null
        };
      }
    })
  };
}

// Create a function that can be called with preferences
const siteFunction = createSiteMock;
// When called without arguments, return default mock
siteFunction.getCurrent = createSiteMock({}).getCurrent;

module.exports = siteFunction;
