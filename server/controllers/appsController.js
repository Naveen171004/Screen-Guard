const App = require('../models/App');

// @desc    Get all apps for current user
// @route   GET /api/apps
const getApps = async (req, res) => {
  try {
    const apps = await App.find({ userId: req.user._id, isActive: true }).sort('name');
    
    // Check if any overrides have expired and reset blocked status
    const now = new Date();
    const updatedApps = apps.map((app) => {
      const appObj = app.toObject();
      if (appObj.overrideUntil && new Date(appObj.overrideUntil) < now) {
        appObj.overrideUntil = null;
      }
      return appObj;
    });

    res.json({ success: true, apps: updatedApps });
  } catch (error) {
    console.error('Get apps error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching apps' });
  }
};

// @desc    Add a new custom app
// @route   POST /api/apps
const addApp = async (req, res) => {
  try {
    const { name, icon, category, color, dailyLimit } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'App name is required' });
    }

    const app = await App.create({
      userId: req.user._id,
      name,
      icon: icon || '📱',
      category: category || 'Custom',
      color: color || '#6366f1',
      dailyLimit: dailyLimit || 0,
    });

    res.status(201).json({ success: true, app });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'App with this name already exists' });
    }
    console.error('Add app error:', error);
    res.status(500).json({ success: false, message: 'Server error adding app' });
  }
};

// @desc    Update app (mainly daily limit)
// @route   PUT /api/apps/:id
const updateApp = async (req, res) => {
  try {
    const { dailyLimit, name, icon, color, category } = req.body;

    const app = await App.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { dailyLimit, name, icon, color, category },
      { new: true, runValidators: true }
    );

    if (!app) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }

    res.json({ success: true, app });
  } catch (error) {
    console.error('Update app error:', error);
    res.status(500).json({ success: false, message: 'Server error updating app' });
  }
};

// @desc    Delete (soft delete) an app
// @route   DELETE /api/apps/:id
const deleteApp = async (req, res) => {
  try {
    const app = await App.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!app) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }

    res.json({ success: true, message: 'App removed' });
  } catch (error) {
    console.error('Delete app error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting app' });
  }
};

module.exports = { getApps, addApp, updateApp, deleteApp };
