import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface UserPreferences {
  notifyJobsFromFollowedCompanies: boolean;
  notifyJobsMatchingSkills: boolean;
}

const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifyJobsFromFollowedCompanies: true,
    notifyJobsMatchingSkills: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data } = await api.get('/users/preferences');
      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await api.put('/users/preferences', preferences);
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwords.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setChangingPassword(true);
    setMessage(null);

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password' });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Account Information */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
              <p className="text-gray-900 dark:text-white">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
              <p className="text-gray-900 dark:text-white">{user?.displayName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Roles</label>
              <div className="flex gap-2 mt-1">
                {user?.roles.map((role) => (
                  <span
                    key={role}
                    className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 text-xs font-medium rounded"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Notification Preferences
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifyJobsFromFollowedCompanies}
                onChange={(e) =>
                  setPreferences({ ...preferences, notifyJobsFromFollowedCompanies: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Jobs from followed companies
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when companies you follow post new jobs
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifyJobsMatchingSkills}
                onChange={(e) =>
                  setPreferences({ ...preferences, notifyJobsMatchingSkills: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Jobs matching your skills
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified about jobs that match your skill set
                </div>
              </div>
            </label>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Change Password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="input"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="btn-primary"
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="card p-6 mt-6 border-2 border-red-200 dark:border-red-800">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
