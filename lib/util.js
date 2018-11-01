const assert = require('assert');

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
  return options;
};
exports.toNonnegative = (num, defaultValue) => {
  if (num >= 0) {
    return num;
  }
  return defaultValue || 0;
};
