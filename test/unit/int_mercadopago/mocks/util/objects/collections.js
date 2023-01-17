module.exports = {
  map: (value) => {
    const args = Array.from(value);
    let list = args[0];
    const callback = args[1];
    if (list && Object.prototype.hasOwnProperty.call(list, "toArray")) {
      list = list.toArray();
    }
    return list ? list.map(callback) : [];
  },
  iterator: (value) => {
    const args = Array.from(value);
    let list = args[0];
    const callback = args[1];
    if (list && Object.prototype.hasOwnProperty.call(list, "toArray")) {
      list = list.toArray();
    }
    return list ? list.iterator(callback) : null;
  },
  forEach: (value, callback) => {
    let list = Array.from(value);
    if (list && Object.prototype.hasOwnProperty.call(list, "toArray")) {
      list = list.toArray();
    }
    return list ? Object.values(list).forEach(callback) : null;
  }
};
