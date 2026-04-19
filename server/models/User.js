const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default
  },
  // 4-digit override PIN for bypassing time limits temporarily
  overridePin: {
    type: String,
    select: false,
  },
  overridePinExpiry: {
    type: Date, // PIN is valid for 10 minutes after activation
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Hash PIN before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('overridePin') || !this.overridePin) return next();
  this.overridePin = await bcrypt.hash(this.overridePin, 10);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to compare override PIN
userSchema.methods.comparePin = async function (candidatePin) {
  if (!this.overridePin) return false;
  return bcrypt.compare(candidatePin, this.overridePin);
};

module.exports = mongoose.model('User', userSchema);
