const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending',
  },
});

const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  topics: [topicSchema],
});

const subjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide subject name'],
      trim: true,
    },
    code: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    modules: [moduleSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for subject completion percentage and topic statistics
subjectSchema.virtual('stats').get(function () {
  let totalTopics = 0;
  let completedTopics = 0;
  let inProgressTopics = 0;
  let pendingTopics = 0;

  if (this.modules && Array.isArray(this.modules)) {
    this.modules.forEach((mod) => {
      if (mod.topics && Array.isArray(mod.topics)) {
        mod.topics.forEach((top) => {
          totalTopics += 1;
          if (top.status === 'Completed') completedTopics += 1;
          else if (top.status === 'In Progress') inProgressTopics += 1;
          else pendingTopics += 1;
        });
      }
    });
  }

  const completionPercentage =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return {
    totalTopics,
    completedTopics,
    inProgressTopics,
    pendingTopics,
    completionPercentage,
  };
});

module.exports = mongoose.model('Subject', subjectSchema);
