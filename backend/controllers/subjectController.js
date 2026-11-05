const Subject = require('../models/Subject');

// @desc    Get all core subjects with completion percentages
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id }).sort({ createdAt: 1 });

    const formatted = subjects.map((sub) => {
      const stats = sub.stats;
      return {
        _id: sub._id,
        name: sub.name,
        code: sub.code,
        description: sub.description,
        modulesCount: sub.modules ? sub.modules.length : 0,
        stats,
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      subjects: formatted,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed subject with modules and topics
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    return res.json({
      success: true,
      subject: {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        modules: subject.modules,
        stats: subject.stats,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update topic status (Pending, In Progress, Completed)
// @route   PATCH /api/subjects/:subjectId/modules/:moduleId/topics/:topicId
// @access  Private
const updateTopicStatus = async (req, res) => {
  try {
    const { subjectId, moduleId, topicId } = req.params;
    const { status } = req.body;

    if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: Pending, In Progress, Completed.',
      });
    }

    const subject = await Subject.findOne({ _id: subjectId, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const mod = subject.modules.id(moduleId);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found in this subject.' });
    }

    const topic = mod.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found in this module.' });
    }

    topic.status = status;
    await subject.save();

    return res.json({
      success: true,
      message: `Topic marked as ${status}.`,
      stats: subject.stats,
      topic,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a custom module to a subject
// @route   POST /api/subjects/:id/modules
// @access  Private
const addModule = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide module name.' });
    }

    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    subject.modules.push({
      name: name.trim(),
      topics: [],
    });

    await subject.save();

    return res.status(201).json({
      success: true,
      message: 'Module added successfully.',
      subject,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a topic to a module
// @route   POST /api/subjects/:subjectId/modules/:moduleId/topics
// @access  Private
const addTopic = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide topic name.' });
    }

    const subject = await Subject.findOne({ _id: req.params.subjectId, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const mod = subject.modules.id(req.params.moduleId);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    mod.topics.push({
      name: name.trim(),
      status: 'Pending',
    });

    await subject.save();

    return res.status(201).json({
      success: true,
      message: 'Topic added successfully.',
      subject,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a topic from a module
// @route   DELETE /api/subjects/:subjectId/modules/:moduleId/topics/:topicId
// @access  Private
const deleteTopic = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.subjectId, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const mod = subject.modules.id(req.params.moduleId);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    mod.topics.pull(req.params.topicId);
    await subject.save();

    return res.json({
      success: true,
      message: 'Topic deleted successfully.',
      subject,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  updateTopicStatus,
  addModule,
  addTopic,
  deleteTopic,
};
