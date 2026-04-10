/**
 * DealScheduleEntry
 * Normalized (1:N) schedule entries for a deal (replaces Deal.addMoreEntries).
 */

const mongoose = require('mongoose');

const dealScheduleEntrySchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: true,
      index: true,
    },
    percentage: { type: Number, min: 0, max: 100, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, min: 0, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dealScheduleEntrySchema.index({ dealId: 1, sortOrder: 1, date: 1 });

module.exports = mongoose.model('DealScheduleEntry', dealScheduleEntrySchema);

