require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const App = require('./models/App');
const { DailyUsage } = require('./models/Usage');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate limiting - prevent brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/auth', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/apps', require('./routes/apps'));
app.use('/api/usage', require('./routes/usage'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ScreenGuard API is running 🛡️' });
});

// ─── Socket.io Real-Time Usage Tracking ───────────────────────────────────────
/**
 * Socket.io handles real-time communication for:
 * 1. Tick updates (every second) from active timers
 * 2. Blocking notifications when limits are exceeded
 * 3. Override grants
 *
 * Each socket is authenticated via JWT token sent on connection.
 */

// In-memory store for active timers
// Structure: { socketId: { appId, userId, startTime, sessionId, interval } }
const activeTimers = {};

// Helper: get today's date string
const getTodayStr = () => new Date().toISOString().split('T')[0];

// Authenticate socket connections
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('User not found'));

    socket.userId = decoded.id;
    socket.userName = user.name;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.userName})`);

  // ── Event: User starts using an app ──────────────────────────────────────
  socket.on('start_timer', async ({ appId, sessionId }) => {
    // Clear any existing timer for this socket
    if (activeTimers[socket.id]) {
      clearInterval(activeTimers[socket.id].interval);
    }

    const startTime = Date.now();

    // Tick every second - emit usage update to client
    const interval = setInterval(async () => {
      try {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const today = getTodayStr();

        // Get today's already stored usage (from previous sessions today)
        const todayUsage = await DailyUsage.findOne({
          userId: socket.userId,
          appId,
          date: today,
        });

        // Base seconds = what was stored before this session started
        // We stored usage at session start, so subtract current session's elapsed from stored
        const storedSeconds = todayUsage ? todayUsage.totalSeconds : 0;
        const totalToday = storedSeconds + elapsedSeconds;

        // Get app to check limit
        const appDoc = await App.findById(appId);
        if (!appDoc) {
          clearInterval(interval);
          return;
        }

        const now = new Date();
        const overrideActive = appDoc.overrideUntil && new Date(appDoc.overrideUntil) > now;

        // Emit tick to the specific client
        socket.emit('timer_tick', {
          appId,
          totalSeconds: totalToday,
          dailyLimit: appDoc.dailyLimit,
          elapsedThisSession: elapsedSeconds,
        });

        // Check if limit exceeded
        if (appDoc.dailyLimit > 0 && totalToday >= appDoc.dailyLimit && !overrideActive) {
          // Block the app in DB
          await App.findByIdAndUpdate(appId, { isBlocked: true });

          // Update daily usage in DB
          await DailyUsage.findOneAndUpdate(
            { userId: socket.userId, appId, date: today },
            { totalSeconds: totalToday, updatedAt: now },
            { upsert: true }
          );

          // Notify client to show block overlay
          socket.emit('app_blocked', {
            appId,
            appName: appDoc.name,
            totalSeconds: totalToday,
            dailyLimit: appDoc.dailyLimit,
          });

          // Stop the timer
          clearInterval(interval);
          delete activeTimers[socket.id];
        }
      } catch (err) {
        console.error('Timer tick error:', err.message);
      }
    }, 1000);

    activeTimers[socket.id] = { appId, sessionId, startTime, interval };
    console.log(`⏱️ Timer started for app ${appId}`);
  });

  // ── Event: User stops using an app ───────────────────────────────────────
  socket.on('stop_timer', async ({ appId }) => {
    if (activeTimers[socket.id]) {
      clearInterval(activeTimers[socket.id].interval);
      delete activeTimers[socket.id];
      console.log(`⏹️ Timer stopped for app ${appId}`);
    }
  });

  // ── Event: Override PIN verified - resume app ─────────────────────────────
  socket.on('override_granted', ({ appId }) => {
    socket.emit('override_active', { appId, duration: 600 }); // 10 min = 600s
  });

  // ── Cleanup on disconnect ─────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (activeTimers[socket.id]) {
      clearInterval(activeTimers[socket.id].interval);
      delete activeTimers[socket.id];
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🛡️  ScreenGuard Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time connections`);
  console.log(`🗄️  Connect MongoDB Compass to: ${process.env.MONGO_URI}\n`);
});
