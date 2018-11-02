const LRU = require('lru-cache');
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
    if (!options || typeof options !== 'object') {
      options = {
        max: options,
      };
    }
    const max = toNonnegative(options.max);
    this[connectTimeout] = toNonnegative(options.connectTimeout,
      DEFAULT_CONNECT_TIMEOUT);
    this[idleTimeout] = toNonnegative(options.idleTimeout);
    this[socketsCache] = new LRU({
      max,
    });
    this[connectingCache] = {};
    this[proxy] = options.proxy;
    if (isFunction(options.createConnection)) {
      this[createConnection] = options.createConnection;
    }
  }
  count() {
    return this[socketsCache].keys().length;
  }
  connect(options) {
    try {
      if (!options.proxy && this[proxy]) {
        options = Object.assign({}, options);
        options.proxy = this[proxy];
      }
      options = getOptions(options, true);
    } catch (err) {
      return Promise.reject(err);
    }
    let useProxy = isFunction(options.createConnection);
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
    promise = pool.get(path);
    const socket = promise && promise[curSocket];
    if (socket) {
      if (!socket.destroyed) {
        return promise;
      }
      pool.del(path);
    }
    options.connectTimeout = toNonnegative(options.connectTimeout, this[
      connectTimeout]);
    options.idleTimeout = toNonnegative(options.idleTimeout, this[idleTimeout]);
    promise = connect(options);
    connectingSockets[path] = promise;
    promise.then((s) => {
      delete connectingSockets[path];
      promise[curSocket] = s;
      pool.set(path, promise);
      const clearup = () => {
        delete connectingSockets[path];
        pool.del(path);
        removeEndListener(s, clearup);
      };
      addEndListener(s, clearup);
    }, () => {
      delete connectingSockets[path];
      pool.del(path);
    });
    return promise;
  }
}

module.exports = SocketPool;
