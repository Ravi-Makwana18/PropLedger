const { EventEmitter } = require('node:events');
const { PassThrough, Readable } = require('node:stream');

const invokeApp = async (app, {
  method = 'GET',
  url = '/',
  headers = {},
  body,
} = {}) => {
  const payload = body && typeof body !== 'string' ? JSON.stringify(body) : body;

  const req = new Readable({
    read() {
      if (payload) {
        this.push(payload);
      }
      this.push(null);
    },
  });

  const socket = new PassThrough();
  socket.remoteAddress = '127.0.0.1';

  Object.assign(req, {
    method,
    url,
    headers: {
      ...(payload ? { 'content-length': String(Buffer.byteLength(payload)) } : {}),
      ...headers,
    },
    connection: socket,
    socket,
    httpVersion: '1.1',
  });

  const res = new EventEmitter();
  res.statusCode = 200;
  res.headers = {};
  res.locals = {};
  res.req = req;
  req.res = res;

  res.setHeader = (name, value) => {
    res.headers[String(name).toLowerCase()] = value;
  };

  res.getHeader = (name) => res.headers[String(name).toLowerCase()];
  res.removeHeader = (name) => { delete res.headers[String(name).toLowerCase()]; };
  res.getHeaders = () => ({ ...res.headers });
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.set = (name, value) => {
    res.setHeader(name, value);
    return res;
  };
  res.writeHead = (code, headersToSet = {}) => {
    res.statusCode = code;
    for (const [key, value] of Object.entries(headersToSet)) {
      res.setHeader(key, value);
    }
    return res;
  };

  return await new Promise((resolve, reject) => {
    let responseBody = '';

    res.write = (chunk) => {
      responseBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk;
      return true;
    };

    res.end = (chunk = '') => {
      responseBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk;
      resolve({
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: responseBody,
      });
    };

    app.handle(req, res, reject);
  });
};

module.exports = { invokeApp };
