const express = require('express');
const router = express.Router();
const {
  getLeetCodeProblems,
  updateProblemStatus,
  addLeetCodeProblem,
  deleteLeetCodeProblem,
} = require('../controllers/leetcodeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getLeetCodeProblems)
  .post(addLeetCodeProblem);

router.patch('/:id/status', updateProblemStatus);
router.delete('/:id', deleteLeetCodeProblem);

module.exports = router;
