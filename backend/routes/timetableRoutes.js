const express = require('express');
const router = express.Router();
const {
  getTimetableSessions,
  createStudySession,
  updateStudySession,
  toggleSessionStatus,
  deleteStudySession,
} = require('../controllers/timetableController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getTimetableSessions)
  .post(createStudySession);

router.route('/:id')
  .put(updateStudySession)
  .delete(deleteStudySession);

router.patch('/:id/toggle', toggleSessionStatus);

module.exports = router;
