import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface SaveJobButtonProps {
  jobId: string;
  variant?: 'icon' | 'button';
}

export default function SaveJobButton({ jobId, variant = 'button' }: SaveJobButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      checkSaved();
    }
  }, [jobId, isAuthenticated]);

  const checkSaved = async () => {
    try {
      const { data } = await api.get(`/jobs/${jobId}/saved`);
      setSaved(data.saved);
    } catch (error) {
      console.error('Check saved error:', error);
    }
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const { data } = await api.post(`/jobs/${jobId}/save`);
      setSaved(data.saved);
    } catch (error) {
      console.error('Toggle save error:', error);
      alert('Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggleSave}
        disabled={loading}
        className={`p-2 rounded-full transition ${
          saved
            ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-50'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }`}
        title={saved ? 'Unsave job' : 'Save job'}
      >
        <svg
          className="w-6 h-6"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleSave}
      disabled={loading}
      className={`px-4 py-2 rounded-md font-medium transition flex items-center gap-2 ${
        saved
          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <svg
        className="w-5 h-5"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {loading ? 'Saving...' : saved ? 'Saved' : 'Save Job'}
    </button>
  );
}
