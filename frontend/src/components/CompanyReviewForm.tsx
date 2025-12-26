import { useState } from 'react';
import api from '../services/api';

interface CompanyReviewFormProps {
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CompanyReviewForm({ companyId, onSuccess, onCancel }: CompanyReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [isVerifiedEmployee, setIsVerifiedEmployee] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);

    try {
      await api.post(`/companies/${companyId}/reviews`, {
        rating,
        title,
        content,
        pros: pros || undefined,
        cons: cons || undefined,
        isVerifiedEmployee,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="text-3xl focus:outline-none transition-colors"
          >
            <span
              className={
                star <= (hoveredRating || rating)
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-6 rounded-lg">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating *
        </label>
        {renderStars()}
        {rating > 0 && (
          <p className="text-sm text-gray-600 mt-1">{rating} out of 5 stars</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Review Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Review *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share details of your own experience at this company"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
          required
          minLength={10}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pros
        </label>
        <textarea
          value={pros}
          onChange={(e) => setPros(e.target.value)}
          placeholder="What are the best things about working here?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cons
        </label>
        <textarea
          value={cons}
          onChange={(e) => setCons(e.target.value)}
          placeholder="What could be improved?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isVerifiedEmployee}
            onChange={(e) => setIsVerifiedEmployee(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">
            I am/was an employee at this company
          </span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
