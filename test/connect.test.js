const {
  connect,
} = require('../lib');
const {
  serverPort,
  startServer,
} = require('./util');

describe('connect', () => {
  before(startServer);
  it('#successful', async () => {
    const client = await connect({
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
  it('#disconnect', async () => {
    const client = await connect({
      host: '127.0.0.1',
      port: serverPort,
    });
    return new Promise((resolve, reject) => {
      client.on('data', () => {
        reject(new Error('error'));
        client.destroy();
      });
      client.on('error', () => resolve);
      client.on('close', resolve);
      client.write('error');
    });
  });
  it('#error', async () => {
    try {
      await connect({
        host: '127.0.0.1',
        port: serverPort + 1,
      });
      throw new Error('error');
    } catch (e) {}
  });
});
