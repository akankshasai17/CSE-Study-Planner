const FocusSession = require('../models/FocusSession');

// @desc    Log a completed focus session
// @route   POST /api/focus/log
// @access  Private
const logFocusSession = async (req, res) => {
  try {
    const { durationMinutes = 25, subject = 'General Study' } = req.body;

    const session = await FocusSession.create({
      user: req.user._id,
      durationMinutes: Number(durationMinutes) || 25,
      subject: subject.trim(),
      completedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: `Completed ${session.durationMinutes}-minute focus session!`,
      session,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get focus session statistics
// @route   GET /api/focus/stats
// @access  Private
const getFocusStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const todaySessions = await FocusSession.find({
      user: req.user._id,
      completedAt: { $gte: today },
    });

    const weekSessions = await FocusSession.find({
      user: req.user._id,
      completedAt: { $gte: weekAgo },
    });

    const todayMinutes = todaySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const weekMinutes = weekSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

    return res.json({
      success: true,
      stats: {
        todayCount: todaySessions.length,
        todayMinutes,
        weekCount: weekSessions.length,
        weekMinutes,
        weekHours: parseFloat((weekMinutes / 60).toFixed(1)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  logFocusSession,
  getFocusStats,
};
