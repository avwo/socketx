const net = require('net');

const PORT = 9999;
const noop = _ => _;
let server;

exports.noop = noop;
exports.serverPort = PORT;
exports.startServer = (done) => {
  if (server) {
    return done();
  }
  server = net.createServer((socket) => {
    socket.on('error', noop);
    socket.on('data', (data) => {
      if (`${data}` === 'error') {
        socket.destroy();
      } else {
        socket.write(data);
      }
    });
  });
  server.listen(PORT, done);
  server.unref();
  return server;
};
