const { UsageSession, DailyUsage } = require('../models/Usage');
const App = require('../models/App');

// Helper: get today's date string YYYY-MM-DD
const getTodayStr = () => new Date().toISOString().split('T')[0];

// Helper: get date strings for the last N days
const getLastNDays = (n) => {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

// @desc    Start a usage session (user opened an app tab)
// @route   POST /api/usage/start
const startSession = async (req, res) => {
  try {
    const { appId } = req.body;
    const today = getTodayStr();

    // Verify app belongs to user
    const app = await App.findOne({ _id: appId, userId: req.user._id });
    if (!app) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }

    // Check if app is blocked and override hasn't kicked in
    const now = new Date();
    if (app.isBlocked && (!app.overrideUntil || new Date(app.overrideUntil) < now)) {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: 'App is blocked - daily limit reached',
      });
    }

    // Close any open sessions for this app (in case of reconnect)
    const openSession = await UsageSession.findOne({
      userId: req.user._id,
      appId,
      endTime: null,
    });

    if (openSession) {
      const duration = Math.floor((now - openSession.startTime) / 1000);
      openSession.endTime = now;
      openSession.duration = duration;
      await openSession.save();
    }

    // Create new session
    const session = await UsageSession.create({
      userId: req.user._id,
      appId,
      appName: app.name,
      startTime: now,
      date: today,
    });

    res.status(201).json({ success: true, sessionId: session._id });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ success: false, message: 'Server error starting session' });
  }
};

// @desc    End a usage session (user left app tab)
// @route   PUT /api/usage/end/:sessionId
const endSession = async (req, res) => {
  try {
    const session = await UsageSession.findOne({
      _id: req.params.sessionId,
      userId: req.user._id,
      endTime: null,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    const now = new Date();
    const duration = Math.floor((now - session.startTime) / 1000);
    session.endTime = now;
    session.duration = duration;
    await session.save();

    // Update daily usage aggregate
    await updateDailyUsage(req.user._id, session.appId, session.appName, session.date, duration);

    res.json({ success: true, duration });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ success: false, message: 'Server error ending session' });
  }
};

// @desc    Heartbeat - update ongoing session every 30s
// @route   PUT /api/usage/heartbeat/:sessionId
const heartbeat = async (req, res) => {
  try {
    const session = await UsageSession.findOne({
      _id: req.params.sessionId,
      userId: req.user._id,
      endTime: null,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const now = new Date();
    const elapsedSinceStart = Math.floor((now - session.startTime) / 1000);

    // Get today's total (previous sessions + current)
    const todayUsage = await DailyUsage.findOne({
      userId: req.user._id,
      appId: session.appId,
      date: session.date,
    });

    const previousSeconds = todayUsage ? todayUsage.totalSeconds : 0;
    const totalToday = previousSeconds + elapsedSinceStart;

    // Update daily usage with current elapsed time
    await DailyUsage.findOneAndUpdate(
      { userId: req.user._id, appId: session.appId, date: session.date },
      {
        totalSeconds: totalToday,
        appName: session.appName,
        updatedAt: now,
      },
      { upsert: true, new: true }
    );

    // Check if daily limit is exceeded
    const app = await App.findById(session.appId);
    let blocked = false;

    if (app && app.dailyLimit > 0 && totalToday >= app.dailyLimit) {
      // Check if override is still active
      if (!app.overrideUntil || new Date(app.overrideUntil) < now) {
        // Block the app
        await App.findByIdAndUpdate(session.appId, { isBlocked: true });
        blocked = true;

        // End the current session
        const sessionDuration = elapsedSinceStart;
        session.endTime = now;
        session.duration = sessionDuration;
        await session.save();
      }
    }

    res.json({
      success: true,
      totalToday,
      blocked,
      dailyLimit: app?.dailyLimit || 0,
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ success: false, message: 'Heartbeat error' });
  }
};

// @desc    Get today's usage for all apps
// @route   GET /api/usage/today
const getTodayUsage = async (req, res) => {
  try {
    const today = getTodayStr();
    const usage = await DailyUsage.find({ userId: req.user._id, date: today });
    res.json({ success: true, usage, date: today });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching today usage' });
  }
};

// @desc    Get usage for the last 7 days (analytics)
// @route   GET /api/usage/weekly
const getWeeklyUsage = async (req, res) => {
  try {
    const dates = getLastNDays(7);
    const usage = await DailyUsage.find({
      userId: req.user._id,
      date: { $in: dates },
    }).sort({ date: 1 });

    res.json({ success: true, usage, dates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching weekly usage' });
  }
};

// @desc    Get usage for the last 30 days
// @route   GET /api/usage/monthly
const getMonthlyUsage = async (req, res) => {
  try {
    const dates = getLastNDays(30);
    const usage = await DailyUsage.find({
      userId: req.user._id,
      date: { $in: dates },
    }).sort({ date: 1 });

    res.json({ success: true, usage, dates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching monthly usage' });
  }
};

// Helper: update the daily usage aggregate document
const updateDailyUsage = async (userId, appId, appName, date, additionalSeconds) => {
  await DailyUsage.findOneAndUpdate(
    { userId, appId, date },
    {
      $inc: { totalSeconds: additionalSeconds },
      appName,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
};

module.exports = { startSession, endSession, heartbeat, getTodayUsage, getWeeklyUsage, getMonthlyUsage };
