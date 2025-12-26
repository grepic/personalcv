import { useState } from 'react';
import api from '../services/api';

interface RecommendationFormProps {
  recipientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RecommendationForm({ recipientId, onSuccess, onCancel }: RecommendationFormProps) {
  const [relationship, setRelationship] = useState('');
  const [position, setPosition] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (content.length < 10) {
      setError('Recommendation must be at least 10 characters long');
      return;
    }

    setLoading(true);

    try {
      await api.post('/recommendations', {
        recipientId,
        relationship,
        position: position || undefined,
        content,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit recommendation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4 border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Recommendation</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Relationship *
        </label>
        <input
          type="text"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="e.g., Manager, Colleague, Client"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">
          How did you work with this person?
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Position at Your Company (optional)
        </label>
        <input
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="e.g., Senior Developer, Marketing Manager"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          maxLength={200}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Recommendation *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience working with this person. What are their strengths? What did they accomplish?"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-40 resize-none"
          required
          minLength={10}
        />
        <p className="text-xs text-gray-500 mt-1">
          {content.length} characters (minimum 10)
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
        >
          {loading ? 'Submitting...' : 'Submit Recommendation'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          Cancel
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Your recommendation will be visible on this person's profile.
          Make sure it's professional and accurate.
        </p>
      </div>
    </form>
  );
}
