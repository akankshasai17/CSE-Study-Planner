const express = require('express');
const router = express.Router();
const { getProgressOverview } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getProgressOverview);

module.exports = router;
