module.exports = {
  wrap: (callback) => {
    callback.apply();
  },
  begin: () => {},
  commit: () => {}
};
