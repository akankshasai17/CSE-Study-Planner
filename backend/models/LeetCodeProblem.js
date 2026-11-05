const mongoose = require('mongoose');

const leetcodeTopics = [
  'Arrays',
  'Strings',
  'Hashing',
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'Linked Lists',
  'Stack',
  'Queue',
  'Trees',
  'Graphs',
  'Recursion',
  'Backtracking',
  'Dynamic Programming',
];

const leetcodeProblemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide problem title'],
      trim: true,
    },
    topic: {
      type: String,
      required: [true, 'Please select a topic'],
      enum: leetcodeTopics,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
      default: 'Medium',
    },
    problemUrl: {
      type: String,
      required: [true, 'Please provide LeetCode problem URL'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Not Started', 'Attempted', 'Solved'],
      default: 'Not Started',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    solvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LeetCodeProblem', leetcodeProblemSchema);
module.exports.leetcodeTopics = leetcodeTopics;
