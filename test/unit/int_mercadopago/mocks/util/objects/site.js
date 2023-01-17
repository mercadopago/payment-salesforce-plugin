module.exports = function Site(customPreferences) {
  const prefs = customPreferences || {};

  return {
    getCurrent: () => ({
      getCustomPreferenceValue: (key) => prefs[key]
    })
  };
};
