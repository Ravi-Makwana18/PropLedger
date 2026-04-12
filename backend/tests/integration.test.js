const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const createApp = require('../app');
const { ensureCollectionsExist } = require('../config/db');
const { invokeApp } = require('./helpers/http');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-123456789012345678901234';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.WRITE_RATE_LIMIT_MAX = '1000';

let replset;

const json = (response) => JSON.parse(response.body);

test.before(async () => {
  replset = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });

  await mongoose.connect(replset.getUri(), {
    dbName: 'propledger-test',
  });

  await ensureCollectionsExist();
});

test.after(async () => {
  await mongoose.disconnect();
  if (replset) {
    await replset.stop();
  }
});

test.beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

test('auth, deal creation, and payment flow works against MongoDB', async () => {
  const app = createApp();

  const registerResponse = await invokeApp(app, {
    method: 'POST',
    url: '/api/auth/register',
    headers: {
      'content-type': 'application/json',
    },
    body: {
      companyName: 'PropLedger Test Co',
      contactPersonName: 'Ravi Test',
      country: 'India',
      state: 'Gujarat',
      city: 'Ahmedabad',
      pincode: '380001',
      email: 'owner@example.com',
      phone: '9876543210',
      password: 'StrongPass123',
    },
  });

  assert.equal(registerResponse.statusCode, 201);
  const registeredUser = json(registerResponse);
  assert.ok(registeredUser.token);

  const createDealResponse = await invokeApp(app, {
    method: 'POST',
    url: '/api/deals',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${registeredUser.token}`,
    },
    body: {
      district: 'Ahmedabad',
      subDistrict: 'Daskroi',
      villageName: 'Navrangpura',
      newSurveyNo: '101',
      dealType: 'Buy',
      pricePerSqYard: 1000,
      totalSqYard: 200,
      totalSqMeter: 167.22,
      jantri: 500,
      additionalExpenses: {
        buyBrokeringPercent: 2,
        naRatePerSqMtr: 25,
      },
      addMoreEntries: [
        {
          percentage: 10,
          date: '2026-04-12',
          amount: 20000,
        },
      ],
    },
  });

  assert.equal(createDealResponse.statusCode, 201, createDealResponse.body);
  const createdDeal = json(createDealResponse);
  assert.equal(createdDeal.additionalExpenses.buyBrokeringPercent, 2);
  assert.equal(createdDeal.addMoreEntries.length, 1);

  const paymentResponse = await invokeApp(app, {
    method: 'POST',
    url: '/api/payments',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${registeredUser.token}`,
    },
    body: {
      dealId: createdDeal._id,
      date: '2026-04-13',
      modeOfPayment: 'Bank',
      amount: 50000,
      remarks: 'First installment',
    },
  });

  assert.equal(paymentResponse.statusCode, 201, paymentResponse.body);

  const detailResponse = await invokeApp(app, {
    method: 'GET',
    url: `/api/deals/${createdDeal._id}`,
    headers: {
      authorization: `Bearer ${registeredUser.token}`,
    },
  });

  assert.equal(detailResponse.statusCode, 200);
  const details = json(detailResponse);
  assert.equal(details.totalPaid, 50000);
  assert.equal(details.payments.length, 1);
  assert.equal(details.deal.additionalExpenses.naRatePerSqMtr, 25);
  assert.equal(details.deal.addMoreEntries.length, 1);
});

test('protected routes reject requests without authentication', async () => {
  const response = await invokeApp(createApp(), {
    method: 'GET',
    url: '/api/deals',
  });

  assert.equal(response.statusCode, 401);
  const body = json(response);
  assert.equal(body.message, 'Not authorized, no token');
});
