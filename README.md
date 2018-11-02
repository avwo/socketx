# socketx
[![NPM version](https://img.shields.io/npm/v/socketx.svg?style=flat-square)](https://npmjs.org/package/socketx)
[![node version](https://img.shields.io/badge/node.js-%3E=_6.0-green.svg?style=flat-square)](http://nodejs.org/download/)
[![build status](https://img.shields.io/travis/avwo/socketx.svg?style=flat-square)](https://travis-ci.org/avwo/socketx)
[![Test coverage](https://codecov.io/gh/avwo/socketx/branch/master/graph/badge.svg?style=flat-square)](https://codecov.io/gh/avwo/socketx)
[![License](https://img.shields.io/npm/l/socketx.svg?style=flat-square)](https://www.npmjs.com/package/socketx)

socketx用于在Node中建立socket连接及连接池，使用简单，且支持设置代理等自定义建立连接的方式。

# 安装

```
npm i --save socketx
```

# 使用
服务器代码：
```js
// server.js
const net = require('net');

const noop = _ => _;
const server = net.createServer((socket) => {
    socket.on('error', noop);
    socket.on('data', (data) => {
      socket.write(`response: ${data}`);
    });
  });
server.listen(9999, () => {
	console.log(`server listening on ${server.address().port}.`);
});
```
普通客户端代码：
```js
const { connect } = require('socketx');

(async () => {
	const client = await connect({
		host: '127.0.0.1',
		port: 9999,
	});
	client.on('data', (data) => {
		console.log(`${data}`);
	});
	client.on('error', (e) => console.error(e));
	setInterval(() => {
		client.write('test');
	}, 3000);
})();

```
连接池代码：
```js
const { Pool } = require('socketx');

// 设置最大连接数为3，更多配置参数参考下面的API文档
const pool = new Pool({ max: 3 });
(async () => {
	const client = await pool.connect({
		host: '127.0.0.1',
		port: 9999,
	});
	client.on('data', (data) => {
		console.log(`${data}`);
	});
	client.on('error', (e) => console.error(e));
	setInterval(() => {
		client.write('test');
	}, 3000);
})();

```
通过代理到[whistle](https://github.com/avwo/whistle)：
``` js
const { connect } = require('socketx');

(async () => {
	const proxy = {
		host: '127.0.0.1',
    port: 8899,
	};
	const client = await connect({
		host: '127.0.0.1',
		port: 9999,
		createConnection,
	});
	client.on('data', (data) => {
		console.log(`${data}`);
	});
	client.on('error', (e) => console.error(e));
	setInterval(() => {
		client.write('test');
	}, 3000);
})();
```


# API
```
const { connect, Pool } = require('socketx');
```

### connect(options)
options:
- host: 服务器的ip或域名
- port: 服务器的端口
- createConnection(options): 设置代理等自定义建立连接方式，options为connect(`options`)，返回 `Promise` 或 `socket` 对象
- connectTimeout: 可选，socket连接超时毫秒数，默认为3000ms，如果值为非正数，表示不设置超时
- idleTimeout：可选，设置socket的空闲超时毫秒数，socket在idleTimeout时间内没有传输数据将自动销毁，默认为0，不设置idleTimeout时间，如果值为非正数，表示不设置超时
- path: 同[socket](https://nodejs.org/dist/latest-v10.x/docs/api/net.html#net_socket_connect_path_connectlistener)

其中 `host:port`、`path`、`createConnection` 至少要存在一个。

### new Pool(options)

options:
- max: 可选，设置连接池的连接数上限，默认为0，不限制(非正数表示不设置上限)
- connectTimeout: 可选，设置连接池里面默认socket连接超时毫秒数，默认为3000ms，如果值为非正数，表示不设置超时，该设置可以通过 `pool.connect(opts)` 的 `opts.connectTimeout` 修改
- idleTimeout：可选，设置连接池里面默认socket的空闲超时毫秒数，socket在idleTimeout时间内没有传输数据将自动销毁，默认为0，不设置idleTimeout时间，如果值为非正数，表示不设置超时，该设置可以通过 `pool.connect(opts)` 的 `opts.idleTimeout` 修改
- createConnection: 可选，主要用于设置代理等自定义建立连接方式，该设置可以通过 `pool.connect(opts)` 的 `opts.createConnection` 修改

### pool.connect(options)
options:
- host: 服务器的ip或域名
- port: 服务器的端口
- name: 可选，连接名称，主要用于协助设置缓存的key
- createConnection(options): 设置代理等自定义建立连接方式，options为connect(`options`)，返回 `Promise` 或 `socket` 对象
- connectTimeout: 可选，socket连接超时毫秒数，默认为3000ms，如果值为非正数，表示不设置超时
- idleTimeout：可选，设置socket的空闲超时毫秒数，socket在idleTimeout时间内没有传输数据将自动销毁，默认为0，不设置idleTimeout时间，如果值为非正数，表示不设置超时
- path: 同[socket](https://nodejs.org/dist/latest-v10.x/docs/api/net.html#net_socket_connect_path_connectlistener)

其中 `host:port`、`path`、`name&createConnection` 至少要存在一个，如果相同的 `host:port` 要缓存池里面建立多条连接可以采用设置 `name` 的方式，因为缓存的key是通过按优先顺序 `host:port:name` 或 `path:name` 或 `:name` 生成。
