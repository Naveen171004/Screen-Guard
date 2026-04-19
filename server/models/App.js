const mongoose = require('mongoose');

// Pre-populated popular apps
const DEFAULT_APPS = [
  { name: 'Instagram', icon: '📸', category: 'Social Media', color: '#E1306C' },
  { name: 'YouTube', icon: '▶️', category: 'Entertainment', color: '#FF0000' },
  { name: 'WhatsApp', icon: '💬', category: 'Messaging', color: '#25D366' },
  { name: 'Twitter / X', icon: '🐦', category: 'Social Media', color: '#1DA1F2' },
  { name: 'Facebook', icon: '👥', category: 'Social Media', color: '#1877F2' },
  { name: 'TikTok', icon: '🎵', category: 'Entertainment', color: '#010101' },
  { name: 'Netflix', icon: '🎬', category: 'Entertainment', color: '#E50914' },
  { name: 'Reddit', icon: '🤖', category: 'Social Media', color: '#FF4500' },
  { name: 'Gaming', icon: '🎮', category: 'Gaming', color: '#7C3AED' },
  { name: 'Snapchat', icon: '👻', category: 'Social Media', color: '#FFFC00' },
];

const appSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'App name is required'],
    trim: true,
  },
  icon: {
    type: String,
    default: '📱',
  },
  category: {
    type: String,
    default: 'Other',
  },
  color: {
    type: String,
    default: '#6366f1',
  },
  // Daily limit in seconds (0 = no limit)
  dailyLimit: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Whether the app is currently blocked (limit reached)
  isBlocked: {
    type: Boolean,
    default: false,
  },
  // Override active until this time
  overrideUntil: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index so each user can't have duplicate app names
appSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('App', appSchema);
module.exports.DEFAULT_APPS = DEFAULT_APPS;
