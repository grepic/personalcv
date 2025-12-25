import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { UserProfile, CandidateReview, CandidateComment } from '../types';
import Profile from './Profile';

export default function CandidateView() {
  const { candidateId } = useParams();
  const [reviews, setReviews] = useState<CandidateReview[]>([]);
  const [comments, setComments] = useState<CandidateComment[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    loadReviews();
    loadComments();
  }, [candidateId]);

  const loadReviews = async () => {
    try {
      const { data } = await api.get(`/candidates/${candidateId}/reviews`);
      setReviews(data.reviews);
    } catch (error) {
      console.error('Load reviews error:', error);
    }
  };

  const loadComments = async () => {
    try {
      const { data } = await api.get(`/candidates/${candidateId}/comments`);
      setComments(data.comments);
    } catch (error) {
      console.error('Load comments error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Candidate Profile */}
      <Profile />

      {/* Internal Reviews (Company Only) */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Internal Reviews</h2>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Add Review
          </button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{review.title}</h3>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      review.overallRecommendation === 'STRONG_HIRE'
                        ? 'bg-green-100 text-green-700'
                        : review.overallRecommendation === 'HIRE'
                        ? 'bg-blue-100 text-blue-700'
                        : review.overallRecommendation === 'NO_HIRE'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {review.overallRecommendation.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Round {review.round}</p>
                <div className="grid grid-cols-4 gap-4 mb-3">
                  {review.hardSkills && (
                    <div>
                      <span className="text-xs text-gray-600">Hard Skills</span>
                      <p className="font-semibold">{review.hardSkills}/5</p>
                    </div>
                  )}
                  {review.softSkills && (
                    <div>
                      <span className="text-xs text-gray-600">Soft Skills</span>
                      <p className="font-semibold">{review.softSkills}/5</p>
                    </div>
                  )}
                  {review.language && (
                    <div>
                      <span className="text-xs text-gray-600">Language</span>
                      <p className="font-semibold">{review.language}/5</p>
                    </div>
                  )}
                  {review.cultureFit && (
                    <div>
                      <span className="text-xs text-gray-600">Culture Fit</span>
                      <p className="font-semibold">{review.cultureFit}/5</p>
                    </div>
                  )}
                </div>
                <p className="text-gray-700">{review.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Internal Comments (Company Only) */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Internal Comments</h2>
        {comments.length === 0 ? (
          <p className="text-gray-500">No comments yet</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`border-l-4 pl-4 ${
                  comment.resolved ? 'border-green-500' : 'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{comment.author?.displayName}</p>
                    <p className="text-sm text-gray-600">
                      on {comment.anchorType.toLowerCase()}
                    </p>
                  </div>
                  {comment.resolved && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Resolved
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mt-2">{comment.text}</p>
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-6 mt-3 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="text-sm">
                        <p className="font-medium">{reply.author?.displayName}</p>
                        <p className="text-gray-700">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
