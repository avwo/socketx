const connect = require('./connect');
const {
  isFunction,
  toNonnegative,
  getOptions,
  addEndListener,
  removeEndListener,
} = require('./util');

const socketsCache = Symbol('#cache');
const connectingCache = Symbol('#connecting');
const proxy = Symbol('#proxy');
const curSocket = Symbol('#socket');
const connectTimeout = Symbol('#idleTimeout');
const idleTimeout = Symbol('#connectTimeout');
const createConnection = Symbol('#createConnection');
const DEFAULT_CONNECT_TIMEOUT = 3000;

class SocketPool {
  constructor(options) {
    options = options || {};
    this[connectTimeout] = toNonnegative(options.connectTimeout,
      DEFAULT_CONNECT_TIMEOUT);
    this[idleTimeout] = toNonnegative(options.idleTimeout);
    this[socketsCache] = {};
    this[connectingCache] = {};
    this[proxy] = options.proxy;
    if (isFunction(options.createConnection)) {
      this[createConnection] = options.createConnection;
    }
  }
  count() {
    return Object.keys(this[socketsCache]).length;
  }
  connect(options) {
    try {
      if (!options.proxy && this[proxy]) {
        options = Object.assign({}, options);
        options.proxy = this[proxy];
      }
      options = getOptions(options);
    } catch (err) {
      return Promise.reject(err);
    }
    let useProxy = options.createConnection;
    if (!useProxy && this[createConnection]) {
      useProxy = true;
      options = Object.assign({}, options);
      options.createConnection = this[createConnection];
    }

    let {
      path,
      name,
    } = options;
    path = path || `${options.host}:${options.port}`;
    path = name ? `${path}:${name}` : path;
    const connectingSockets = this[connectingCache];
    let promise = connectingSockets[path];
    if (promise) {
      return promise;
    }

    const pool = this[socketsCache];
    promise = pool[path];
    const socket = promise && promise[curSocket];
    if (socket) {
      if (!socket.destroyed) {
        return promise;
      }
      delete pool[path];
    }
    options.connectTimeout = toNonnegative(options.connectTimeout, this[
      connectTimeout]);
    options.idleTimeout = toNonnegative(options.idleTimeout, this[idleTimeout]);
    promise = connect(options);
    connectingSockets[path] = promise;
    promise.then((s) => {
      delete connectingSockets[path];
      promise[curSocket] = s;
      pool[path] = promise;
      const clearup = () => {
        delete connectingSockets[path];
        delete pool[path];
        removeEndListener(s, clearup);
      };
      addEndListener(s, clearup);
    }, () => {
      delete connectingSockets[path];
      delete pool[path];
    });
    return promise;
  }
}

module.exports = SocketPool;
