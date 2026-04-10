/**
 * DealAdditionalExpenses
 * Normalized (1:1) additional expenses for a deal.
 */

const mongoose = require('mongoose');

const dealAdditionalExpensesSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: true,
      unique: true,
      index: true,
    },
    buyBrokeringPercent: { type: Number, min: 0, default: 0 },
    sellCpIncentiveRate: { type: Number, min: 0, default: 0 },
    planpassRatePerSqMtr: { type: Number, min: 0, default: 0 },
    naRatePerSqMtr: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DealAdditionalExpenses', dealAdditionalExpensesSchema);

