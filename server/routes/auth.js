const express = require('express');
const router = express.Router();
const { register, login, getMe, setPin, verifyPin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/pin', protect, setPin);
router.post('/verify-pin', protect, verifyPin);

module.exports = router;
