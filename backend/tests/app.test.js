const test = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../app');
const { invokeApp } = require('./helpers/http');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-123456789012345678901234';

test('GET /api/health returns JSON health payload', async () => {
  const response = await invokeApp(createApp(), { url: '/api/health' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type']?.includes('application/json'), true);

  const body = JSON.parse(response.body);
  assert.equal(body.status, 'ok');
  assert.ok(body.timestamp);
});

test('GET /api/ready returns 503 when database is disconnected', async () => {
  const response = await invokeApp(createApp(), { url: '/api/ready' });

  assert.equal(response.statusCode, 503);

  const body = JSON.parse(response.body);
  assert.equal(body.status, 'not_ready');
});

test('CORS rejects unknown origins', async () => {
  const response = await invokeApp(createApp(), {
    url: '/api/health',
    headers: {
      origin: 'https://evil.example.com',
    },
  });

  assert.equal(response.statusCode, 403);
  const body = JSON.parse(response.body);
  assert.equal(body.message, 'Origin not allowed by CORS');
});

test('unknown API routes return JSON 404 payloads', async () => {
  const response = await invokeApp(createApp(), { url: '/api/does-not-exist' });

  assert.equal(response.statusCode, 404);

  const body = JSON.parse(response.body);
  assert.equal(body.message, 'API route not found');
});
