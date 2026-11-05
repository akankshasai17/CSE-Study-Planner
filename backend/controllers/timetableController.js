const StudySession = require('../models/StudySession');

// Helper to get formatted date string YYYY-MM-DD
const formatDate = (d) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get study timetable sessions (filterable by day, week, or all)
// @route   GET /api/timetable
// @access  Private
const getTimetableSessions = async (req, res) => {
  try {
    const { view, date, startDate } = req.query;
    let query = { user: req.user._id };

    if (view === 'day') {
      const targetDate = date || formatDate(new Date());
      query.date = targetDate;
    } else if (view === 'week') {
      // Calculate start and end of week (7 days)
      const start = startDate ? new Date(startDate) : new Date();
      // Ensure day of week calculation or 7-day span
      const startStr = formatDate(start);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const endStr = formatDate(end);

      query.date = { $gte: startStr, $lte: endStr };
    }

    // Sort by date ascending, then startTime ascending
    const sessions = await StudySession.find(query).sort({ date: 1, startTime: 1 });

    // Identify next upcoming session
    const todayStr = formatDate(new Date());
    const now = new Date();
    const currentH = String(now.getHours()).padStart(2, '0');
    const currentM = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentH}:${currentM}`;

    let nextSession = null;
    for (const session of sessions) {
      if (session.status === 'Pending') {
        if (session.date > todayStr || (session.date === todayStr && session.endTime > currentTimeStr)) {
          nextSession = session;
          break;
        }
      }
    }

    return res.json({
      success: true,
      count: sessions.length,
      nextSession,
      sessions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new study session
// @route   POST /api/timetable
// @access  Private
const createStudySession = async (req, res) => {
  try {
    const { subject, topic, date, startTime, endTime, notes } = req.body;

    if (!subject || !topic || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subject, topic, date, start time, and end time.',
      });
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        success: false,
        message: 'End time must be strictly after the start time.',
      });
    }

    const duration = parseFloat(((endMinutes - startMinutes) / 60).toFixed(2));

    const session = await StudySession.create({
      user: req.user._id,
      subject: subject.trim(),
      topic: topic.trim(),
      date,
      startTime,
      endTime,
      duration,
      notes: notes ? notes.trim() : '',
      status: 'Pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Study session scheduled successfully.',
      session,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a study session
// @route   PUT /api/timetable/:id
// @access  Private
const updateStudySession = async (req, res) => {
  try {
    const session = await StudySession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Study session not found' });
    }

    const { subject, topic, date, startTime, endTime, notes, status } = req.body;

    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (endMinutes <= startMinutes) {
        return res.status(400).json({
          success: false,
          message: 'End time must be strictly after start time.',
        });
      }
      session.duration = parseFloat(((endMinutes - startMinutes) / 60).toFixed(2));
    }

    if (subject) session.subject = subject.trim();
    if (topic) session.topic = topic.trim();
    if (date) session.date = date;
    if (startTime) session.startTime = startTime;
    if (endTime) session.endTime = endTime;
    if (notes !== undefined) session.notes = notes.trim();
    if (status && ['Pending', 'Completed'].includes(status)) session.status = status;

    await session.save();

    return res.json({
      success: true,
      message: 'Study session updated successfully.',
      session,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Toggle completion status of a study session
// @route   PATCH /api/timetable/:id/toggle
// @access  Private
const toggleSessionStatus = async (req, res) => {
  try {
    const session = await StudySession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Study session not found' });
    }

    session.status = session.status === 'Completed' ? 'Pending' : 'Completed';
    await session.save();

    return res.json({
      success: true,
      message: `Session marked as ${session.status.toLowerCase()}.`,
      session,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a study session
// @route   DELETE /api/timetable/:id
// @access  Private
const deleteStudySession = async (req, res) => {
  try {
    const session = await StudySession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Study session not found' });
    }

    return res.json({
      success: true,
      message: 'Study session deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTimetableSessions,
  createStudySession,
  updateStudySession,
  toggleSessionStatus,
  deleteStudySession,
};
