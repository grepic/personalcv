import { useState, useEffect } from 'react';
import api from '../services/api';

interface Props {
  companyId: string;
}

export default function FollowCompanyButton({ companyId }: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIfFollowing();
  }, [companyId]);

  const checkIfFollowing = async () => {
    try {
      const { data } = await api.get('/follow/companies');
      const following = data.companies.some((c: any) => c.id === companyId);
      setIsFollowing(following);
    } catch (error) {
      console.error('Check following error:', error);
    }
  };

  const handleToggleFollow = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/follow/companies/${companyId}`);
        setIsFollowing(false);
      } else {
        await api.post(`/follow/companies/${companyId}`);
        setIsFollowing(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-md font-medium transition ${
        isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } disabled:opacity-50`}
    >
      {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
