import { useState } from 'react';
import api from '../services/api';

interface Props {
  candidateId: string;
  jobId?: string;
  anchorType: string;
  anchorId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddCommentForm({ candidateId, jobId, anchorType, anchorId, onSuccess, onCancel }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post(`/candidates/${candidateId}/comments`, {
        jobId,
        anchorType,
        anchorId,
        text,
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        required
        placeholder="Add a comment..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Adding...' : 'Add Comment'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
