const assert = require('assert');
const {
  Pool,
} = require('../lib');
const {
  serverPort,
  startServer,
} = require('./util');

describe('pool', async () => {
  before(startServer);
  const pool = new Pool({ max: 3 });
  it('#count', async () => {
    const sockets = [];
    sockets.push(await pool.connect({
      host: '127.0.0.1',
      port: serverPort,
    }));
    sockets.push(await pool.connect({
      host: '127.0.0.1',
      name: 'test',
      port: serverPort,
    }));
    sockets.push(await pool.connect({
      host: '127.0.0.1',
      port: serverPort,
    }));
    try {
      await pool.connect({
        host: '127.0.0.1',
        port: serverPort + 1,
      });
    } catch (e) {}
    assert(pool.count() === 2, `expected 1 actual ${pool.count()}`);
    sockets.forEach(s => s.destroy());
  });
  it('#successful', async () => {
    const client = await pool.connect({
      host: '127.0.0.1',
      port: serverPort,
    });
    return new Promise((resolve, reject) => {
      client.on('data', (data) => {
        if (`${data}` === 'test') {
          resolve();
        } else {
          reject(new Error('error'));
        }
        client.destroy();
      });
      client.write('test');
    });
  });
});
