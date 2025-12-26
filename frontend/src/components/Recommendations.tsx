import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { UserRecommendation } from '../types';
import { useAuthStore } from '../store/authStore';
import RecommendationForm from './RecommendationForm';

interface RecommendationsProps {
  userId: string;
  isOwnProfile: boolean;
}

export default function Recommendations({ userId, isOwnProfile }: RecommendationsProps) {
  const { user } = useAuthStore();
  const [recommendations, setRecommendations] = useState<UserRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    try {
      const { data } = await api.get(`/users/${userId}/recommendations`);
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Load recommendations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (recommendationId: string) => {
    try {
      await api.patch(`/recommendations/${recommendationId}/visibility`);
      loadRecommendations();
    } catch (error) {
      console.error('Toggle visibility error:', error);
    }
  };

  const handleDelete = async (recommendationId: string) => {
    if (!confirm('Are you sure you want to delete this recommendation?')) return;

    try {
      await api.delete(`/recommendations/${recommendationId}`);
      loadRecommendations();
    } catch (error) {
      console.error('Delete recommendation error:', error);
      alert('Failed to delete recommendation');
    }
  };

  const isCompanyOrRecruiter = user?.roles.includes('COMPANY');
  const canGiveRecommendation = user && !isOwnProfile && isCompanyOrRecruiter;

  if (loading) {
    return <div className="text-center py-4">Loading recommendations...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recommendations</h2>
          <p className="text-sm text-gray-600 mt-1">
            {recommendations.length} {recommendations.length === 1 ? 'recommendation' : 'recommendations'}
          </p>
        </div>

        {canGiveRecommendation && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
          >
            {showForm ? 'Cancel' : 'Write Recommendation'}
          </button>
        )}
      </div>

      {/* Recommendation Form */}
      {showForm && canGiveRecommendation && (
        <div className="mb-6">
          <RecommendationForm
            recipientId={userId}
            onSuccess={() => {
              setShowForm(false);
              loadRecommendations();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">
            {isOwnProfile
              ? 'No recommendations yet. Ask colleagues or clients to recommend you!'
              : 'No recommendations yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="border-t border-gray-200 pt-6 first:border-t-0 first:pt-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition"
            >
              <div className="flex gap-4">
                {/* Author Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {recommendation.author?.displayName.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Author Info */}
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {recommendation.author?.displayName}
                      {recommendation.author?.companyName && (
                        <span className="text-gray-600 font-normal"> · {recommendation.author.companyName}</span>
                      )}
                    </h3>
                    {recommendation.author?.headline && (
                      <p className="text-sm text-gray-600">{recommendation.author.headline}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {recommendation.relationship}
                      {recommendation.position && ` · ${recommendation.position}`}
                    </p>
                  </div>

                  {/* Recommendation Content */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      "{recommendation.content}"
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(recommendation.createdAt), { addSuffix: true })}
                    </span>

                    {/* Actions */}
                    {user && (
                      <div className="flex gap-3">
                        {/* Author can delete their recommendation */}
                        {recommendation.authorId === user.id && (
                          <button
                            onClick={() => handleDelete(recommendation.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        )}

                        {/* Recipient can hide/show recommendations on their profile */}
                        {isOwnProfile && (
                          <button
                            onClick={() => handleToggleVisibility(recommendation.id)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {recommendation.isVisible ? 'Hide' : 'Show'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
