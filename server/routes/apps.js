const express = require('express');
const router = express.Router();
const { getApps, addApp, updateApp, deleteApp } = require('../controllers/appsController');
const { protect } = require('../middleware/auth');

router.use(protect); // All app routes require authentication

router.get('/', getApps);
router.post('/', addApp);
router.put('/:id', updateApp);
router.delete('/:id', deleteApp);

module.exports = router;
