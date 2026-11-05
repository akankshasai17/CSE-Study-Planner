const express = require('express');
const router = express.Router();
const { logFocusSession, getFocusStats } = require('../controllers/focusController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/log', logFocusSession);
router.get('/stats', getFocusStats);

module.exports = router;
