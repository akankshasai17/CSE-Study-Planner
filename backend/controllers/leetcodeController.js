const LeetCodeProblem = require('../models/LeetCodeProblem');
const { leetcodeTopics } = require('../models/LeetCodeProblem');
const { starterLeetCodeProblems } = require('../data/starterData');

// @desc    Get all LeetCode questions for user with filtering & stats
// @route   GET /api/leetcode
// @access  Private
const getLeetCodeProblems = async (req, res) => {
  try {
    const { topic, difficulty, status, search } = req.query;
    let query = { user: req.user._id };

    if (topic && topic !== 'All') {
      query.topic = topic;
    }
    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const problems = await LeetCodeProblem.find(query).sort({ topic: 1, difficulty: 1, title: 1 });

    // Aggregate statistics across all user problems (unfiltered)
    const allUserProblems = await LeetCodeProblem.find({ user: req.user._id });
    const stats = {
      total: allUserProblems.length,
      solved: allUserProblems.filter((p) => p.status === 'Solved').length,
      attempted: allUserProblems.filter((p) => p.status === 'Attempted').length,
      notStarted: allUserProblems.filter((p) => p.status === 'Not Started').length,
      easy: {
        total: allUserProblems.filter((p) => p.difficulty === 'Easy').length,
        solved: allUserProblems.filter((p) => p.difficulty === 'Easy' && p.status === 'Solved').length,
      },
      medium: {
        total: allUserProblems.filter((p) => p.difficulty === 'Medium').length,
        solved: allUserProblems.filter((p) => p.difficulty === 'Medium' && p.status === 'Solved').length,
      },
      hard: {
        total: allUserProblems.filter((p) => p.difficulty === 'Hard').length,
        solved: allUserProblems.filter((p) => p.difficulty === 'Hard' && p.status === 'Solved').length,
      },
    };

    return res.json({
      success: true,
      count: problems.length,
      stats,
      topics: leetcodeTopics,
      problems,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update problem status and optional notes
// @route   PATCH /api/leetcode/:id/status
// @access  Private
const updateProblemStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status || !['Not Started', 'Attempted', 'Solved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: Not Started, Attempted, Solved.',
      });
    }

    const problem = await LeetCodeProblem.findOne({ _id: req.params.id, user: req.user._id });
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    problem.status = status;
    if (status === 'Solved') {
      problem.solvedAt = new Date();
    } else {
      problem.solvedAt = null;
    }
    if (notes !== undefined) {
      problem.notes = notes.trim();
    }

    await problem.save();

    return res.json({
      success: true,
      message: `Problem status updated to ${status}.`,
      problem,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a custom LeetCode question
// @route   POST /api/leetcode
// @access  Private
const addLeetCodeProblem = async (req, res) => {
  try {
    const { title, topic, difficulty, problemUrl, description, status, notes } = req.body;

    if (!title || !topic || !difficulty || !problemUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide question title, topic, difficulty, and LeetCode problem URL.',
      });
    }

    const problem = await LeetCodeProblem.create({
      user: req.user._id,
      title: title.trim(),
      topic,
      difficulty,
      problemUrl: problemUrl.trim(),
      description: description ? description.trim() : '',
      status: status || 'Not Started',
      notes: notes ? notes.trim() : '',
      solvedAt: status === 'Solved' ? new Date() : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Question added successfully.',
      problem,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a question
// @route   DELETE /api/leetcode/:id
// @access  Private
const deleteLeetCodeProblem = async (req, res) => {
  try {
    const problem = await LeetCodeProblem.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    return res.json({
      success: true,
      message: 'Question deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLeetCodeProblems,
  updateProblemStatus,
  addLeetCodeProblem,
  deleteLeetCodeProblem,
};
