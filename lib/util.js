const assert = require('assert');
const http = require('http');

const isFunction = fn => typeof fn === 'function';
const notEmptyString = str => {
  return !!str && typeof str === 'string';
};

exports.isFunction = isFunction;

exports.addEndListener = (stream, l) => {
  stream.on('error', l);
  stream.on('close', l);
};

exports.removeEndListener = (stream, l) => {
  stream.removeListener('error', l);
  stream.removeListener('close', l);
};


const PROXY_RE = /[\w.-]+:(\d{1,5}})/;
const getProxy = ({ proxy }) => {
  if (!proxy) {
    return;
  }
  if (typeof proxy === 'string') {
    if (!PROXY_RE.test(proxy)) {
      return;
    }
    return {
      host: RegExp.$1,
      port: RegExp.$2,
      headers: { 'x-whistle-policy': 'tunnel' },
    };
  }
  if (notEmptyString(proxy.host) && (proxy.port > 0)) {
    return {
      host: proxy.host,
      port: proxy.port,
      headers: Object.assign({ 'x-whistle-policy': 'tunnel' }, proxy.headers),
    };
  }
};

const setProxy = (options, hasConnectOpts) => {
  const proxy = getProxy(options);
  if (!proxy) {
    return options;
  }
  assert(hasConnectOpts, 'options{ path || (host && port)} is required.');
  options.createConnection = ({ host, port, path }) => {
    proxy.method = 'CONNECT';
    proxy.agent = false;
    proxy.path = path || `${host}:${port}`;
    return new Promise((resolve, reject) => {
      const client = http.request(proxy);
      client.once('connect', (res, socket) => {
        if (res.statusCode !== 200) {
          return reject(Error(`Tunneling socket could not be established, statusCode=${res.statusCode}`));
        }
        resolve(socket);
      });
      client.once('error', reject);
      client.end();
    });
  };
  return options;
};

exports.getOptions = (options, isPool) => {
  assert(options, 'argument options is required.');
  const {
    path,
    host,
    port,
    name,
    createConnection,
  } = options;
  const hasHost = notEmptyString(host) && port > 0;
  let hasConnectOpts = hasHost || notEmptyString(path);
  if (isPool) {
    hasConnectOpts = hasConnectOpts || (notEmptyString(name) && isFunction(createConnection));
    assert(hasConnectOpts, 'options{ path || (host && port) || (name && createConnection) } is required.');
  } else {
    hasConnectOpts = hasConnectOpts || isFunction(createConnection);
    assert(hasConnectOpts, 'options{ path || (host && port) } is required.');
  }
  options = Object.assign({}, options);
  if (hasHost) {
    delete options.path;
  } else {
    delete options.host;
    delete options.port;
  }
  return setProxy(options, hasConnectOpts);
};
exports.toNonnegative = (num, defaultValue) => {
  if (num >= 0) {
    return num;
  }
  return defaultValue || 0;
};
