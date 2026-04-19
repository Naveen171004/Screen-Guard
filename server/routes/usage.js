const express = require('express');
const router = express.Router();
const {
  startSession,
  endSession,
  heartbeat,
  getTodayUsage,
  getWeeklyUsage,
  getMonthlyUsage,
} = require('../controllers/usageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/start', startSession);
router.put('/end/:sessionId', endSession);
router.put('/heartbeat/:sessionId', heartbeat);
router.get('/today', getTodayUsage);
router.get('/weekly', getWeeklyUsage);
router.get('/monthly', getMonthlyUsage);

module.exports = router;
