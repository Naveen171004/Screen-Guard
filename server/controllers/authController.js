const jwt = require('jsonwebtoken');
const User = require('../models/User');
const App = require('../models/App');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user + seed default apps
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Seed default apps for new user
    const defaultApps = App.DEFAULT_APPS.map((app) => ({
      ...app,
      userId: user._id,
      dailyLimit: 0,
    }));
    await App.insertMany(defaultApps);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: { id: req.user._id, name: req.user.name, email: req.user.email },
  });
};

// @desc    Set or update override PIN
// @route   PUT /api/auth/pin
const setPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be exactly 4 digits' });
    }

    const user = await User.findById(req.user._id);
    user.overridePin = pin; // Will be hashed by pre-save hook
    await user.save();

    res.json({ success: true, message: 'Override PIN set successfully' });
  } catch (error) {
    console.error('Set PIN error:', error);
    res.status(500).json({ success: false, message: 'Server error setting PIN' });
  }
};

// @desc    Verify override PIN and grant temporary access
// @route   POST /api/auth/verify-pin
const verifyPin = async (req, res) => {
  try {
    const { pin, appId } = req.body;

    if (!pin) {
      return res.status(400).json({ success: false, message: 'PIN is required' });
    }

    const user = await User.findById(req.user._id).select('+overridePin');
    
    if (!user.overridePin) {
      return res.status(400).json({ success: false, message: 'No override PIN set. Please set a PIN in settings first.' });
    }

    const isMatch = await user.comparePin(pin);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect PIN' });
    }

    // Grant 10-minute override for the specific app
    if (appId) {
      const overrideUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await App.findOneAndUpdate(
        { _id: appId, userId: req.user._id },
        { overrideUntil, isBlocked: false }
      );
    }

    res.json({
      success: true,
      message: 'Override granted for 10 minutes',
      overrideUntil: new Date(Date.now() + 10 * 60 * 1000),
    });
  } catch (error) {
    console.error('Verify PIN error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying PIN' });
  }
};

module.exports = { register, login, getMe, setPin, verifyPin };
