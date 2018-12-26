const net = require('net');
const { addEndListener, removeEndListener } = require('./util');

module.exports = (options) => {
  const { connectTimeout, idleTimeout } = options;
  let timer;
  let socket;
  let errorHandler;
  const clearup = () => {
    clearTimeout(timer);
    if (socket instanceof Promise) {
      return;
    }
    removeEndListener(socket, errorHandler);
  };
  return new Promise((resolve, reject) => {
    const connectHandler = () => {
      clearup();
      if (idleTimeout > 0) {
        socket.setTimeout(idleTimeout, () => {
          socket.destroy();
        });
      }
      resolve(socket);
    };
    errorHandler = (err) => {
      clearup();
      reject(err || new Error('Socket closed'));
    };
    if (options.createConnection) {
      socket = options.createConnection(options);
      if (socket instanceof Promise) {
        socket.then((s) => {
          socket = s;
          connectHandler();
        }, errorHandler);
        return;
      }
    }
    if (socket) {
      connectHandler();
    } else {
      socket = net.connect(options, connectHandler);
      if (connectTimeout > 0) {
        timer = setTimeout(() => {
          const path = options.path || `${options.host}:${options.port}`;
          socket.destroy(new Error(`Socket connect to ${path} timeout`));
        }, connectTimeout);
      }
    }
    addEndListener(socket, errorHandler);
  });
};
