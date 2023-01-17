module.exports = {
  https: () => ({
    getCustomPreferenceValue: (value) => ({
      toString: () => value
    })
  })
};
