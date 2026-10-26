import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Clock,
  Bell,
  Lock,
  Palette,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { api, extractErrorMessage } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error, warning } = useToast();

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    college_name: user?.profile?.college_name || '',
    semester: user?.profile?.semester || 5,
    branch: user?.profile?.branch || 'Computer Science & Engineering',
    roll_number: user?.profile?.roll_number || '',
    bio: user?.profile?.bio || '',
    daily_study_hour_target: user?.profile?.daily_study_hour_target || 4.0,
    preferred_study_start_time: user?.profile?.preferred_study_start_time || '18:00',
    preferred_study_end_time: user?.profile?.preferred_study_end_time || '22:00',
    preferred_session_duration: user?.profile?.preferred_session_duration || 50,
    preferred_break_duration: user?.profile?.preferred_break_duration || 10,
    available_weekdays: user?.profile?.available_weekdays || [0, 1, 2, 3, 4, 5, 6],
    daily_dsa_goal: user?.profile?.daily_dsa_goal || 2,
    weekly_dsa_goal: user?.profile?.weekly_dsa_goal || 14,
    theme_preference: user?.profile?.theme_preference || theme,
    timezone_preference: user?.profile?.timezone_preference || 'Asia/Kolkata',
  });

  const [notifForm, setNotifForm] = useState({
    browser_notifications_enabled: user?.notification_preferences?.browser_notifications_enabled ?? false,
    task_due_reminders: user?.notification_preferences?.task_due_reminders ?? true,
    exam_countdown_alerts: user?.notification_preferences?.exam_countdown_alerts ?? true,
    study_session_reminders: user?.notification_preferences?.study_session_reminders ?? true,
    daily_goal_reminders: user?.notification_preferences?.daily_goal_reminders ?? true,
    pomodoro_sound_enabled: user?.notification_preferences?.pomodoro_sound_enabled ?? true,
    reminder_lead_minutes: user?.notification_preferences?.reminder_lead_minutes ?? 15,
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        college_name: user.profile?.college_name || '',
        semester: user.profile?.semester || 5,
        branch: user.profile?.branch || 'Computer Science & Engineering',
        roll_number: user.profile?.roll_number || '',
        bio: user.profile?.bio || '',
        daily_study_hour_target: user.profile?.daily_study_hour_target || 4.0,
        preferred_study_start_time: user.profile?.preferred_study_start_time || '18:00',
        preferred_study_end_time: user.profile?.preferred_study_end_time || '22:00',
        preferred_session_duration: user.profile?.preferred_session_duration || 50,
        preferred_break_duration: user.profile?.preferred_break_duration || 10,
        available_weekdays: user.profile?.available_weekdays || [0, 1, 2, 3, 4, 5, 6],
        daily_dsa_goal: user.profile?.daily_dsa_goal || 2,
        weekly_dsa_goal: user.profile?.weekly_dsa_goal || 14,
        theme_preference: user.profile?.theme_preference || theme,
        timezone_preference: user.profile?.timezone_preference || 'Asia/Kolkata',
      });
    }
    if (user?.notification_preferences) {
      setNotifForm({
        browser_notifications_enabled: user.notification_preferences.browser_notifications_enabled,
        task_due_reminders: user.notification_preferences.task_due_reminders,
        exam_countdown_alerts: user.notification_preferences.exam_countdown_alerts,
        study_session_reminders: user.notification_preferences.study_session_reminders,
        daily_goal_reminders: user.notification_preferences.daily_goal_reminders,
        pomodoro_sound_enabled: user.notification_preferences.pomodoro_sound_enabled,
        reminder_lead_minutes: user.notification_preferences.reminder_lead_minutes,
      });
    }
  }, [user, theme]);

  const handleSaveProfileAndPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/api/auth/profile', profileForm);
      if (profileForm.theme_preference === 'dark' || profileForm.theme_preference === 'light') {
        setTheme(profileForm.theme_preference);
      }
      await refreshUser();
      success(
        'Settings Saved!',
        'Your profile and study preferences are now active in the Dashboard and Timetable Generator.'
      );
    } catch (err) {
      error('Could not save settings', extractErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotif(true);
    try {
      if (notifForm.browser_notifications_enabled && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          warning('Browser Permission Not Granted', 'In-app alerts will still work.');
        }
      }
      await api.put('/api/auth/notifications', notifForm);
      await refreshUser();
      success('Notification Preferences Updated');
    } catch (err) {
      error('Failed to save notification settings', extractErrorMessage(err));
    } finally {
      setSavingNotif(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      error('Validation Error', 'New password and confirmation do not match.');
      return;
    }
    setSavingPass(true);
    try {
      await api.post('/api/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      success('Password Changed Securely');
    } catch (err) {
      error('Password Change Failed', extractErrorMessage(err));
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Profile &amp; Study Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Update your profile details, schedule generator defaults, theme, timezone, and security settings.
        </p>
      </div>

      <form onSubmit={handleSaveProfileAndPreferences} className="space-y-6">
        {/* 1. Student Profile Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <UserIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold">Student Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Email (Account ID)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Roll Number / USN</label>
              <input
                type="text"
                value={profileForm.roll_number}
                onChange={(e) => setProfileForm({ ...profileForm, roll_number: e.target.value })}
                placeholder="e.g. 21CS104"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">College / University</label>
              <input
                type="text"
                value={profileForm.college_name}
                onChange={(e) => setProfileForm({ ...profileForm, college_name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Branch / Department</label>
              <input
                type="text"
                value={profileForm.branch}
                onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Current Semester</label>
              <select
                value={profileForm.semester}
                onChange={(e) => setProfileForm({ ...profileForm, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Study & Timetable Generator Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold">Study &amp; Schedule Generator Preferences</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Daily Study Target (hrs)</label>
              <input
                type="number"
                min={0.5}
                max={16}
                step={0.5}
                value={profileForm.daily_study_hour_target}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, daily_study_hour_target: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Preferred Start Time</label>
              <input
                type="time"
                value={profileForm.preferred_study_start_time}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, preferred_study_start_time: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Preferred End Time</label>
              <input
                type="time"
                value={profileForm.preferred_study_end_time}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, preferred_study_end_time: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Session Duration (mins)</label>
              <input
                type="number"
                min={20}
                max={180}
                value={profileForm.preferred_session_duration}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, preferred_session_duration: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Break Duration (mins)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={profileForm.preferred_break_duration}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, preferred_break_duration: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5">Available Study Weekdays</label>
              <div className="flex flex-wrap gap-2">
                {SHORT_DAYS.map((d, idx) => {
                  const active = profileForm.available_weekdays.includes(idx);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? profileForm.available_weekdays.filter((w) => w !== idx)
                          : [...profileForm.available_weekdays, idx];
                        setProfileForm({ ...profileForm, available_weekdays: next });
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Daily DSA Goal (problems)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={profileForm.daily_dsa_goal}
                  onChange={(e) => setProfileForm({ ...profileForm, daily_dsa_goal: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Weekly DSA Goal</label>
                <input
                  type="number"
                  min={1}
                  max={150}
                  value={profileForm.weekly_dsa_goal}
                  onChange={(e) => setProfileForm({ ...profileForm, weekly_dsa_goal: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Theme & Timezone Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Palette className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold">Theme &amp; Regional Preferences</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Theme Preference</label>
              <select
                value={profileForm.theme_preference}
                onChange={(e) => setProfileForm({ ...profileForm, theme_preference: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="light">Light Academic Theme</option>
                <option value="dark">Dark Engineering Theme</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Timezone Preference</label>
              <select
                value={profileForm.timezone_preference}
                onChange={(e) => setProfileForm({ ...profileForm, timezone_preference: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+05:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile & Preferences'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* 4. Notification Preferences + Change Password */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSaveNotifications}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Bell className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold">Notification Preferences</h2>
          </div>

          <div className="space-y-2.5 text-xs font-semibold">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <span>Enable Browser Desktop Notifications</span>
              <input
                type="checkbox"
                checked={notifForm.browser_notifications_enabled}
                onChange={(e) =>
                  setNotifForm({ ...notifForm, browser_notifications_enabled: e.target.checked })
                }
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <span>Task &amp; Assignment Due Reminders</span>
              <input
                type="checkbox"
                checked={notifForm.task_due_reminders}
                onChange={(e) => setNotifForm({ ...notifForm, task_due_reminders: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <span>Upcoming Exam Countdown Alerts</span>
              <input
                type="checkbox"
                checked={notifForm.exam_countdown_alerts}
                onChange={(e) => setNotifForm({ ...notifForm, exam_countdown_alerts: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <span>Scheduled Study Session Reminders</span>
              <input
                type="checkbox"
                checked={notifForm.study_session_reminders}
                onChange={(e) => setNotifForm({ ...notifForm, study_session_reminders: e.target.checked })}
              />
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingNotif}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savingNotif ? 'Saving...' : 'Save Notification Settings'}</span>
            </button>
          </div>
        </form>

        {/* Change Password Form */}
        <form
          onSubmit={handleChangePassword}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold">Change Password Securely</h2>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">New Password (min 6 chars) *</label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPass}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              {savingPass ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
