const StudySession = require('../models/StudySession');
const Task = require('../models/Task');
const LeetCodeProblem = require('../models/LeetCodeProblem');
const Subject = require('../models/Subject');
const FocusSession = require('../models/FocusSession');

// @desc    Get detailed progress analytics for the student
// @route   GET /api/progress
// @access  Private
const getProgressOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Study Sessions Analytics
    const sessions = await StudySession.find({ user: userId });
    const completedSessions = sessions.filter((s) => s.status === 'Completed');
    const totalStudyHours = completedSessions.reduce((acc, s) => acc + (s.duration || 1), 0);

    // Subject-wise session distribution
    const subjectSessionMap = {};
    completedSessions.forEach((s) => {
      subjectSessionMap[s.subject] = (subjectSessionMap[s.subject] || 0) + (s.duration || 1);
    });

    // 2. LeetCode Practice Analytics
    const leetcode = await LeetCodeProblem.find({ user: userId });
    const solvedLeetcode = leetcode.filter((p) => p.status === 'Solved');
    const attemptedLeetcode = leetcode.filter((p) => p.status === 'Attempted');
    const notStartedLeetcode = leetcode.filter((p) => p.status === 'Not Started');

    // Topic breakdown for LeetCode
    const topicBreakdown = {};
    leetcode.forEach((p) => {
      if (!topicBreakdown[p.topic]) {
        topicBreakdown[p.topic] = { total: 0, solved: 0 };
      }
      topicBreakdown[p.topic].total += 1;
      if (p.status === 'Solved') {
        topicBreakdown[p.topic].solved += 1;
      }
    });

    // 3. Core Subjects Syllabus Analytics
    const subjects = await Subject.find({ user: userId });
    let totalTopics = 0;
    let completedTopics = 0;
    let inProgressTopics = 0;
    let pendingTopics = 0;

    const subjectBreakdown = subjects.map((sub) => {
      const stats = sub.stats;
      totalTopics += stats.totalTopics;
      completedTopics += stats.completedTopics;
      inProgressTopics += stats.inProgressTopics;
      pendingTopics += stats.pendingTopics;
      return {
        _id: sub._id,
        name: sub.name,
        code: sub.code,
        stats,
      };
    });

    const syllabusOverallPercentage =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // 4. Tasks Analytics
    const tasks = await Task.find({ user: userId });
    const completedTasks = tasks.filter((t) => t.status === 'Completed');
    const taskCompletionRate =
      tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    // 5. Focus Sessions
    const focusSessions = await FocusSession.find({ user: userId });
    const totalFocusMinutes = focusSessions.reduce((acc, f) => acc + f.durationMinutes, 0);

    return res.json({
      success: true,
      sessions: {
        totalScheduled: sessions.length,
        completedCount: completedSessions.length,
        pendingCount: sessions.length - completedSessions.length,
        totalHours: parseFloat(totalStudyHours.toFixed(1)),
        bySubject: subjectSessionMap,
      },
      leetcode: {
        total: leetcode.length,
        solved: solvedLeetcode.length,
        attempted: attemptedLeetcode.length,
        notStarted: notStartedLeetcode.length,
        solveRate:
          leetcode.length > 0
            ? Math.round((solvedLeetcode.length / leetcode.length) * 100)
            : 0,
        difficultyBreakdown: {
          easy: {
            total: leetcode.filter((p) => p.difficulty === 'Easy').length,
            solved: leetcode.filter((p) => p.difficulty === 'Easy' && p.status === 'Solved').length,
          },
          medium: {
            total: leetcode.filter((p) => p.difficulty === 'Medium').length,
            solved: leetcode.filter((p) => p.difficulty === 'Medium' && p.status === 'Solved').length,
          },
          hard: {
            total: leetcode.filter((p) => p.difficulty === 'Hard').length,
            solved: leetcode.filter((p) => p.difficulty === 'Hard' && p.status === 'Solved').length,
          },
        },
        topicBreakdown,
      },
      syllabus: {
        totalTopics,
        completedTopics,
        inProgressTopics,
        pendingTopics,
        overallPercentage: syllabusOverallPercentage,
        subjects: subjectBreakdown,
      },
      tasks: {
        total: tasks.length,
        completed: completedTasks.length,
        pending: tasks.length - completedTasks.length,
        completionRate: taskCompletionRate,
      },
      focus: {
        totalSessions: focusSessions.length,
        totalMinutes: totalFocusMinutes,
        totalHours: parseFloat((totalFocusMinutes / 60).toFixed(1)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProgressOverview,
};
