import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { useToast } from './ToastContext';

export type TimerMode = 'focus' | 'short_break' | 'long_break';

interface CustomDurations {
  focus: number;
  short_break: number;
  long_break: number;
}

interface PomodoroContextType {
  mode: TimerMode;
  durations: CustomDurations;
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  selectedSubjectId: number | '';
  selectedSubjectName: string;
  selectedTaskId: number | '';
  selectedTaskTitle: string;
  sessionNotes: string;
  sessionCountVersion: number;
  setMode: (mode: TimerMode) => void;
  updateDurations: (newDurations: CustomDurations) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  setSelectedSubject: (id: number | '', name: string) => void;
  setSelectedTask: (id: number | '', title: string) => void;
  setSessionNotes: (notes: string) => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error } = useToast();

  const [durations, setDurations] = useState<CustomDurations>(() => {
    const saved = localStorage.getItem('cse_pomodoro_durations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return { focus: 25, short_break: 5, long_break: 15 };
  });

  const [mode, setModeState] = useState<TimerMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(durations.focus * 60);
  const [totalSeconds, setTotalSeconds] = useState<number>(durations.focus * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<number | ''>('');
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [sessionCountVersion, setSessionCountVersion] = useState<number>(0);

  const startedAtRef = useRef<string>('');
  const intervalRef = useRef<number | null>(null);

  // Refs to access current state inside timer completion callback without causing interval recreation
  const stateRef = useRef({
    mode,
    durations,
    selectedSubjectId,
    selectedSubjectName,
    selectedTaskId,
    selectedTaskTitle,
    sessionNotes,
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      durations,
      selectedSubjectId,
      selectedSubjectName,
      selectedTaskId,
      selectedTaskTitle,
      sessionNotes,
    };
  }, [mode, durations, selectedSubjectId, selectedSubjectName, selectedTaskId, selectedTaskTitle, sessionNotes]);

  const handleSessionComplete = useCallback(async () => {
    const curr = stateRef.current;
    const durationMins = curr.durations[curr.mode];
    const nowIso = new Date().toISOString();
    const todayStr = new Date().toISOString().split('T')[0];

    // Browser notification if supported and granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(
          curr.mode === 'focus' ? 'Pomodoro Focus Session Complete!' : 'Break Time Ended!',
          {
            body:
              curr.mode === 'focus'
                ? `Great work! You completed ${durationMins} minutes of deep focus.`
                : 'Ready to start your next focus session?',
          }
        );
      } catch {
        // ignore browser notification error
      }
    }

    try {
      await api.post('/api/pomodoro/sessions', {
        subject_id: curr.selectedSubjectId ? Number(curr.selectedSubjectId) : null,
        subject_name: curr.selectedSubjectName,
        task_id: curr.selectedTaskId ? Number(curr.selectedTaskId) : null,
        task_title: curr.selectedTaskTitle,
        mode: curr.mode,
        duration_minutes: durationMins,
        session_date: todayStr,
        started_at: startedAtRef.current || nowIso,
        completed_at: nowIso,
        is_completed: true,
        notes: curr.sessionNotes,
      });

      setSessionCountVersion((v) => v + 1);
      success(
        curr.mode === 'focus' ? 'Focus Session Saved!' : 'Break Completed!',
        curr.mode === 'focus'
          ? `${durationMins} minutes logged to your study analytics.`
          : 'Break session completed.'
      );
    } catch {
      error('Could not save Pomodoro session to server.');
    }
  }, [success, error]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsRunning(false);
          setIsPaused(false);
          handleSessionComplete();
          return stateRef.current.durations[stateRef.current.mode] * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, handleSessionComplete]);

  const setMode = (newMode: TimerMode) => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setModeState(newMode);
    const secs = durations[newMode] * 60;
    setSecondsLeft(secs);
    setTotalSeconds(secs);
  };

  const updateDurations = (newDurations: CustomDurations) => {
    setDurations(newDurations);
    localStorage.setItem('cse_pomodoro_durations', JSON.stringify(newDurations));
    if (!isRunning && !isPaused) {
      const secs = newDurations[mode] * 60;
      setSecondsLeft(secs);
      setTotalSeconds(secs);
    }
  };

  const startTimer = () => {
    startedAtRef.current = new Date().toISOString();
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const resumeTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const resetTimer = () => {
    // Interrupted sessions are discarded and NOT counted as completed sessions
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    const secs = durations[mode] * 60;
    setSecondsLeft(secs);
    setTotalSeconds(secs);
  };

  const setSelectedSubject = (id: number | '', name: string) => {
    setSelectedSubjectId(id);
    setSelectedSubjectName(name);
  };

  const setSelectedTask = (id: number | '', title: string) => {
    setSelectedTaskId(id);
    setSelectedTaskTitle(title);
  };

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        durations,
        secondsLeft,
        totalSeconds,
        isRunning,
        isPaused,
        selectedSubjectId,
        selectedSubjectName,
        selectedTaskId,
        selectedTaskTitle,
        sessionNotes,
        sessionCountVersion,
        setMode,
        updateDurations,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        setSelectedSubject,
        setSelectedTask,
        setSessionNotes,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used within PomodoroProvider');
  return ctx;
}
