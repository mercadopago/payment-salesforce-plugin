module.exports = {
  msg: (propertyName, fileName, isNull) => {
    if (isNull === null) {
      return propertyName + "-" + fileName;
    }
    return "";
  },
  msgf: (propertyName, fileName, isNull) => {
    if (isNull === null) {
      return propertyName + "-" + fileName;
    }
    return "";
  }
};
