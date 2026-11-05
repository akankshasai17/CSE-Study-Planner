const express = require('express');
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  updateTopicStatus,
  addModule,
  addTopic,
  deleteTopic,
} = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.patch('/:subjectId/modules/:moduleId/topics/:topicId', updateTopicStatus);
router.post('/:id/modules', addModule);
router.post('/:subjectId/modules/:moduleId/topics', addTopic);
router.delete('/:subjectId/modules/:moduleId/topics/:topicId', deleteTopic);

module.exports = router;
