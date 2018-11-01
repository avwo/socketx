const {
  connect,
} = require('../lib');
const {
  serverPort,
  startServer,
  noop,
} = require('./util');

describe('proxy', async () => {
  before(startServer);
  it('#params error', async () => {
    try {
      await connect({
        createConnection: noop,
      });
      throw new Error('error');
    } catch (e) {}
  });
  it('#createConnection', async () => {
    const client = await connect({
      path: 'test',
      name: 'mocha',
      createConnection: () => {
        return connect({
          host: '127.0.0.1',
          port: serverPort,
        });
      },
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
