import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface SkillBadgeProps {
  skillId: string;
  skillName: string;
  userId: string;
  isOwnProfile?: boolean;
}

export default function SkillBadge({ skillId, skillName, isOwnProfile = false }: SkillBadgeProps) {
  const { isAuthenticated } = useAuthStore();
  const [endorsed, setEndorsed] = useState(false);
  const [endorsementCount, setEndorsementCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEndorsements();
  }, [skillId]);

  const loadEndorsements = async () => {
    try {
      const { data } = await api.get(`/skills/${skillId}/endorsements`);
      setEndorsementCount(data.count);
      setEndorsed(data.endorsed);
    } catch (error) {
      console.error('Load endorsements error:', error);
    }
  };

  const handleToggleEndorse = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || isOwnProfile) return;

    setLoading(true);
    try {
      const { data } = await api.post(`/skills/${skillId}/endorse`);
      setEndorsed(data.endorsed);
      // Update count optimistically
      setEndorsementCount(data.endorsed ? endorsementCount + 1 : endorsementCount - 1);
    } catch (error: any) {
      console.error('Toggle endorse error:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const canEndorse = isAuthenticated && !isOwnProfile;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md transition ${
        canEndorse
          ? endorsed
            ? 'bg-blue-100 text-blue-700 border border-blue-300'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
          : 'bg-gray-100 text-gray-700'
      }`}
      onClick={canEndorse ? handleToggleEndorse : undefined}
    >
      <span className="font-medium">{skillName}</span>
      {endorsementCount > 0 && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            endorsed ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {endorsementCount}
        </span>
      )}
      {canEndorse && (
        <button
          disabled={loading}
          className="ml-1 hover:scale-110 transition"
          title={endorsed ? 'Remove endorsement' : 'Endorse skill'}
        >
          {endorsed ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
