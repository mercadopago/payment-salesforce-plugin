module.exports = {
  getCurrent: () => ({
    defaultLocale: "en_US",
    getCustomPreferenceValue: (value) => ({
      toString: () => value
    })
  })
};
