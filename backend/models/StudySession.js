const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Please provide a subject name'],
      trim: true,
    },
    topic: {
      type: String,
      required: [true, 'Please provide a topic name'],
      trim: true,
    },
    date: {
      type: String, // Stored as YYYY-MM-DD string for reliable timezone-safe day/week queries
      required: [true, 'Please provide a study date (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'],
    },
    startTime: {
      type: String, // HH:MM (24-hour format)
      required: [true, 'Please provide a start time (HH:MM)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format'],
    },
    endTime: {
      type: String, // HH:MM (24-hour format)
      required: [true, 'Please provide an end time (HH:MM)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format'],
    },
    duration: {
      type: Number, // duration in hours
      default: 1,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Validate that endTime > startTime and calculate duration
studySessionSchema.pre('validate', function (next) {
  if (this.startTime && this.endTime) {
    const [startH, startM] = this.startTime.split(':').map(Number);
    const [endH, endM] = this.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      this.invalidate('endTime', 'End time must be strictly after the start time');
    } else {
      this.duration = parseFloat(((endMinutes - startMinutes) / 60).toFixed(2));
    }
  }
  next();
});

module.exports = mongoose.model('StudySession', studySessionSchema);
