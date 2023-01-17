module.exports = {
  getLogger: (loggerName) => ({
    error: (msg, args) => ({
      loggerName: loggerName,
      msg: msg,
      args: args
    })
  }),
  error: (msg, args) => ({
    msg: msg,
    args: args
  }),
  debug: (msg) => msg
};
