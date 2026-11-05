import React, { useState, useEffect } from 'react';
import { focusService } from '../../services/api';

const DEFAULT_TIME = 25 * 60; // 25 minutes in seconds

const FocusTimer = ({ onSessionCompleted }) => {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleLogSession();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    setSuccessMsg('');
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(DEFAULT_TIME);
    setSuccessMsg('');
  };

  const handleLogSession = async () => {
    setSaving(true);
    try {
      const minutesCompleted = Math.round((DEFAULT_TIME - timeLeft) / 60) || 25;
      await focusService.logSession({
        durationMinutes: minutesCompleted >= 5 ? minutesCompleted : 25,
        subject: subject || 'General CSE Study',
      });
      setSuccessMsg(`Logged focus session!`);
      setTimeLeft(DEFAULT_TIME);
      setIsRunning(false);
      if (onSessionCompleted) {
        onSessionCompleted();
      }
    } catch (err) {
      console.error('Failed to log focus session:', err);
    } finally {
      setSaving(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="focus-timer-card">
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#93c5fd' }}>
        ⏱️ 25-Minute Focus Timer
      </div>

      <div className="timer-circle">
        <div className="timer-digits">{formattedTime}</div>
      </div>

      <div style={{ width: '100%', maxWidth: '280px', marginBottom: '12px' }}>
        <input
          type="text"
          className="form-control"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Session subject / focus area"
        />
      </div>

      <div className="timer-controls">
        <button
          onClick={toggleTimer}
          className={`btn ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
          style={{ minWidth: '90px' }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button onClick={resetTimer} className="btn btn-secondary">
          Reset
        </button>
        <button
          onClick={handleLogSession}
          disabled={saving || (timeLeft === DEFAULT_TIME && !isRunning)}
          className="btn btn-success"
          title="Log completed study block"
        >
          {saving ? 'Logging...' : 'Log Session'}
        </button>
      </div>

      {successMsg && (
        <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#86efac' }}>
          ✓ {successMsg}
        </div>
      )}
    </div>
  );
};

export default FocusTimer;
