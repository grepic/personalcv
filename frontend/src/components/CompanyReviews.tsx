import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { CompanyReview, CompanyReviewStats } from '../types';
import { useAuthStore } from '../store/authStore';
import CompanyReviewForm from './CompanyReviewForm';

interface CompanyReviewsProps {
  companyId: string;
}

export default function CompanyReviews({ companyId }: CompanyReviewsProps) {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [stats, setStats] = useState<CompanyReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState<CompanyReview | null>(null);

  useEffect(() => {
    loadReviews();
  }, [companyId]);

  const loadReviews = async () => {
    try {
      const { data } = await api.get(`/companies/${companyId}/reviews`);
      setReviews(data.reviews);
      setStats(data.stats);

      // Find user's review if it exists
      if (user) {
        const myReview = data.reviews.find((r: CompanyReview) => r.authorId === user.id);
        setUserReview(myReview || null);
      }
    } catch (error) {
      console.error('Load reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'text-3xl' : 'text-lg';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderRatingBar = (count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-yellow-400 h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Company Reviews</h2>
            {stats && stats.totalReviews > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(stats.averageRating), 'lg')}
                  <span className="text-2xl font-bold">
                    {stats.averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-600">
                  {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}
          </div>

          {user && !userReview && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          )}
        </div>

        {/* Rating Distribution */}
        {stats && stats.totalReviews > 0 && (
          <div className="space-y-2 mb-6">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-12">{rating} stars</span>
                {renderRatingBar(
                  stats.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5],
                  stats.totalReviews
                )}
                <span className="text-sm text-gray-600 w-12">
                  {stats.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <div className="mb-6">
            <CompanyReviewForm
              companyId={companyId}
              onSuccess={() => {
                setShowReviewForm(false);
                loadReviews();
              }}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        )}

        {/* User's Review Notice */}
        {userReview && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-sm text-blue-800">
              You have already reviewed this company. You can only submit one review per company.
            </p>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No reviews yet. Be the first to review this company!
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-t border-gray-200 pt-6 first:border-t-0 first:pt-0">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {review.author?.displayName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{review.author?.displayName}</h3>
                      {review.author?.headline && (
                        <p className="text-sm text-gray-600">{review.author.headline}</p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(review.rating)}
                    {review.isVerifiedEmployee && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Verified Employee
                      </span>
                    )}
                  </div>

                  <h4 className="font-semibold mb-2">{review.title}</h4>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{review.content}</p>

                  {review.pros && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-green-700 mb-1">Pros</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.pros}</p>
                    </div>
                  )}

                  {review.cons && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-red-700 mb-1">Cons</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.cons}</p>
                    </div>
                  )}

                  {/* Edit/Delete for own review */}
                  {user && review.authorId === user.id && (
                    <div className="flex gap-2 mt-3">
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        Edit
                      </button>
                      <button className="text-sm text-red-600 hover:text-red-700">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
