const StudySession = require('../models/StudySession');
const Task = require('../models/Task');
const LeetCodeProblem = require('../models/LeetCodeProblem');
const Subject = require('../models/Subject');
const FocusSession = require('../models/FocusSession');

const formatDate = (d) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get aggregated dashboard summary for student
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayStr = formatDate(new Date());

    // 1. Today's Timetable Sessions
    const todaySessions = await StudySession.find({
      user: userId,
      date: todayStr,
    }).sort({ startTime: 1 });

    // Next upcoming study session
    const now = new Date();
    const currentH = String(now.getHours()).padStart(2, '0');
    const currentM = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentH}:${currentM}`;

    // Find next pending session today (or future days)
    const upcomingSessions = await StudySession.find({
      user: userId,
      status: 'Pending',
      $or: [
        { date: { $gt: todayStr } },
        { date: todayStr, endTime: { $gte: currentTimeStr } },
      ],
    }).sort({ date: 1, startTime: 1 }).limit(1);

    const nextUpcomingSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

    // 2. Study Tasks Summary
    const allTasks = await Task.find({ user: userId });
    const pendingTasks = allTasks.filter((t) => t.status === 'Pending');
    const completedTasks = allTasks.filter((t) => t.status === 'Completed');
    const highPriorityTasks = pendingTasks.filter((t) => t.priority === 'High');

    // 3. LeetCode Practice Quick View
    const allProblems = await LeetCodeProblem.find({ user: userId });
    const solvedProblems = allProblems.filter((p) => p.status === 'Solved');
    const attemptedProblems = allProblems.filter((p) => p.status === 'Attempted');
    const remainingProblems = allProblems.length - solvedProblems.length;

    const leetcodeSummary = {
      total: allProblems.length,
      solved: solvedProblems.length,
      attempted: attemptedProblems.length,
      remaining: remainingProblems,
      easySolved: solvedProblems.filter((p) => p.difficulty === 'Easy').length,
      mediumSolved: solvedProblems.filter((p) => p.difficulty === 'Medium').length,
      hardSolved: solvedProblems.filter((p) => p.difficulty === 'Hard').length,
    };

    // 4. Core Subjects Syllabus Progress
    const subjects = await Subject.find({ user: userId }).sort({ createdAt: 1 });
    const subjectsSummary = subjects.map((sub) => ({
      _id: sub._id,
      name: sub.name,
      code: sub.code,
      stats: sub.stats,
    }));

    // Overall syllabus metrics
    let totalSyllabusTopics = 0;
    let completedSyllabusTopics = 0;
    subjectsSummary.forEach((s) => {
      totalSyllabusTopics += s.stats.totalTopics;
      completedSyllabusTopics += s.stats.completedTopics;
    });
    const overallSyllabusPercentage =
      totalSyllabusTopics > 0
        ? Math.round((completedSyllabusTopics / totalSyllabusTopics) * 100)
        : 0;

    // 5. Weekly Activity & Study Goal Progress
    // Calculate current week date boundaries (Monday to Sunday)
    const curr = new Date();
    const day = curr.getDay(); // 0 is Sunday
    const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diffToMonday));
    const mondayStr = formatDate(monday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayStr = formatDate(sunday);

    // Completed sessions this week
    const weekSessions = await StudySession.find({
      user: userId,
      status: 'Completed',
      date: { $gte: mondayStr, $lte: sundayStr },
    });

    const weeklySessionsStudyHours = weekSessions.reduce(
      (acc, s) => acc + (s.duration || 1),
      0
    );

    // Focus sessions this week
    const mondayObj = new Date(mondayStr);
    mondayObj.setHours(0, 0, 0, 0);
    const weekFocus = await FocusSession.find({
      user: userId,
      completedAt: { $gte: mondayObj },
    });
    const weeklyFocusHours = weekFocus.reduce((acc, f) => acc + f.durationMinutes / 60, 0);

    const totalWeeklyHours = parseFloat(
      (weeklySessionsStudyHours + weeklyFocusHours).toFixed(1)
    );
    const weeklyGoalHours = req.user.weeklyGoalHours || 15;
    const weeklyGoalProgress = Math.min(
      Math.round((totalWeeklyHours / weeklyGoalHours) * 100),
      100
    );

    return res.json({
      success: true,
      currentDate: new Date().toISOString(),
      student: {
        name: req.user.name,
        email: req.user.email,
        weeklyGoalHours,
      },
      timetable: {
        todaySessions,
        nextUpcomingSession,
      },
      tasks: {
        total: allTasks.length,
        pending: pendingTasks.length,
        completed: completedTasks.length,
        highPriorityCount: highPriorityTasks.length,
        recentPending: pendingTasks.slice(0, 5),
      },
      leetcode: leetcodeSummary,
      subjects: {
        list: subjectsSummary,
        overallPercentage: overallSyllabusPercentage,
        totalTopics: totalSyllabusTopics,
        completedTopics: completedSyllabusTopics,
      },
      weeklyProgress: {
        weekStart: mondayStr,
        weekEnd: sundayStr,
        completedSessionsCount: weekSessions.length,
        hoursLogged: totalWeeklyHours,
        goalHours: weeklyGoalHours,
        goalProgressPercentage: weeklyGoalProgress,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardData,
};
