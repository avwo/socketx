const SocketPool = require('./SocketPool');
const connect = require('./connect');
const { getOptions } = require('./util');

exports.Pool = SocketPool;
exports.SocketPool = SocketPool;
exports.connect = (options) => {
  try {
    return connect(getOptions(options));
  } catch (err) {
    return Promise.reject(err);
  }
};
