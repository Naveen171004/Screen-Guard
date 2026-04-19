const mongoose = require('mongoose');

/**
 * UsageSession tracks each "session" a user spends on a mock app.
 * A session starts when the user opens an app tab and ends when they leave.
 * This powers real-time tracking + daily aggregates.
 */
const usageSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  appId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true,
  },
  appName: {
    type: String,
    required: true,
  },
  // Session start time
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  // Session end time (null means session is ongoing)
  endTime: {
    type: Date,
    default: null,
  },
  // Duration in seconds (calculated on session end)
  duration: {
    type: Number,
    default: 0,
  },
  // The date this session belongs to (for daily aggregation)
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
});

// Index for efficient daily queries
usageSessionSchema.index({ userId: 1, appId: 1, date: 1 });
usageSessionSchema.index({ userId: 1, date: 1 });

/**
 * DailyUsage stores the aggregated daily usage per app per user.
 * Updated in real-time as sessions progress.
 */
const dailyUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  appId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true,
  },
  appName: {
    type: String,
    required: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  // Total seconds used on this date
  totalSeconds: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Unique constraint: one record per user per app per day
dailyUsageSchema.index({ userId: 1, appId: 1, date: 1 }, { unique: true });

const UsageSession = mongoose.model('UsageSession', usageSessionSchema);
const DailyUsage = mongoose.model('DailyUsage', dailyUsageSchema);

module.exports = { UsageSession, DailyUsage };
