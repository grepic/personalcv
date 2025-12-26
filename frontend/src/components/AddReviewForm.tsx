import { useState } from 'react';
import api from '../services/api';

interface Props {
  candidateId: string;
  jobId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddReviewForm({ candidateId, jobId, onSuccess, onCancel }: Props) {
  const [formData, setFormData] = useState({
    round: 1,
    title: '',
    hardSkills: 3,
    softSkills: 3,
    language: 3,
    cultureFit: 3,
    overallRecommendation: 'NEUTRAL',
    summary: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post(`/candidates/${candidateId}/reviews`, {
        ...formData,
        jobId,
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Add Interview Review</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Round *
          </label>
          <input
            type="number"
            min="1"
            value={formData.round}
            onChange={(e) => setFormData({ ...formData, round: parseInt(e.target.value) })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Technical Interview"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hard Skills (1-5)
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={formData.hardSkills}
            onChange={(e) => setFormData({ ...formData, hardSkills: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Soft Skills (1-5)
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={formData.softSkills}
            onChange={(e) => setFormData({ ...formData, softSkills: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language (1-5)
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Culture Fit (1-5)
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={formData.cultureFit}
            onChange={(e) => setFormData({ ...formData, cultureFit: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Overall Recommendation *
        </label>
        <select
          value={formData.overallRecommendation}
          onChange={(e) => setFormData({ ...formData, overallRecommendation: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="STRONG_HIRE">Strong Hire</option>
          <option value="HIRE">Hire</option>
          <option value="NEUTRAL">Neutral</option>
          <option value="NO_HIRE">No Hire</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Summary *
        </label>
        <textarea
          value={formData.summary}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          rows={4}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
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
