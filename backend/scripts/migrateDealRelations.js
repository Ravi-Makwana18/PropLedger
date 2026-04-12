/**
 * Migrates legacy embedded deal relations into normalized collections and
 * removes the embedded fields from Deal documents.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Deal = require('../models/Deal');
const DealAdditionalExpenses = require('../models/DealAdditionalExpenses');
const DealScheduleEntry = require('../models/DealScheduleEntry');

const normalizeAdditionalExpenses = (expenses = {}) => ({
  buyBrokeringPercent: Number(expenses.buyBrokeringPercent) || 0,
  sellCpIncentiveRate: Number(expenses.sellCpIncentiveRate) || 0,
  planpassRatePerSqMtr: Number(expenses.planpassRatePerSqMtr) || 0,
  naRatePerSqMtr: Number(expenses.naRatePerSqMtr) || 0,
});

const normalizeScheduleEntries = (entries = []) =>
  entries.map((entry, index) => ({
    dealId: entry.dealId,
    percentage: Number(entry.percentage) || 0,
    date: entry.date,
    amount: Number(entry.amount) || 0,
    sortOrder: entry.sortOrder ?? index,
  }));

const hasLegacyAdditionalExpenses = (deal) => {
  if (!deal.additionalExpenses || typeof deal.additionalExpenses !== 'object') {
    return false;
  }

  return [
    deal.additionalExpenses.buyBrokeringPercent,
    deal.additionalExpenses.sellCpIncentiveRate,
    deal.additionalExpenses.planpassRatePerSqMtr,
    deal.additionalExpenses.naRatePerSqMtr,
  ].some((value) => value !== undefined && value !== null);
};

const migrate = async () => {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deals = await Deal.find({
      $or: [
        { additionalExpenses: { $exists: true } },
        { addMoreEntries: { $exists: true, $ne: [] } },
      ],
    }).session(session);

    let migratedDeals = 0;

    for (const deal of deals) {
      if (hasLegacyAdditionalExpenses(deal)) {
        const normalizedExpenses = normalizeAdditionalExpenses(deal.additionalExpenses);
        await DealAdditionalExpenses.updateOne(
          { dealId: deal._id },
          { $set: { dealId: deal._id, ...normalizedExpenses } },
          { upsert: true, session }
        );
      }

      if (Array.isArray(deal.addMoreEntries)) {
        await DealScheduleEntry.deleteMany({ dealId: deal._id }).session(session);

        if (deal.addMoreEntries.length > 0) {
          const normalizedEntries = normalizeScheduleEntries(
            deal.addMoreEntries.map((entry, index) => {
              const entryData = typeof entry.toObject === 'function' ? entry.toObject() : entry;

              return {
                ...entryData,
                dealId: deal._id,
                sortOrder: index,
              };
            })
          );

          await DealScheduleEntry.insertMany(normalizedEntries, { session });
        }
      }

      await Deal.updateOne(
        { _id: deal._id },
        { $unset: { additionalExpenses: 1, addMoreEntries: 1 } },
        { session, strict: false }
      );

      migratedDeals += 1;
    }

    await session.commitTransaction();
    console.log(`Migrated ${migratedDeals} deal(s). Removed legacy embedded fields from Deal collection.`);
  } catch (error) {
    await session.abortTransaction();
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    session.endSession();
    await mongoose.disconnect();
  }
};

migrate();
