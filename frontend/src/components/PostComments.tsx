import { useState, useEffect } from 'react';
import api from '../services/api';
import { PostComment } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/authStore';

interface PostCommentsProps {
  postId: string;
}

export default function PostComments({ postId }: PostCommentsProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/posts/${postId}/comments`);
      setComments(data.comments);
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setSubmitting(true);
    try {
      await api.post(`/posts/${postId}/comments`, { content: newComment });
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Create comment error:', error);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/comments/${commentId}`);
      await loadComments();
    } catch (error) {
      console.error('Delete comment error:', error);
      alert('Failed to delete comment');
    }
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold text-gray-900 mb-4">
        Comments ({comments.length})
      </h3>

      {/* Comment form */}
      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium flex-shrink-0">
              {user?.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center font-medium flex-shrink-0">
                {comment.author?.displayName.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="font-semibold text-gray-900">
                        {comment.author?.displayName || 'Unknown User'}
                      </span>
                      {comment.author?.headline && (
                        <span className="text-sm text-gray-600 ml-2">
                          {comment.author.headline}
                        </span>
                      )}
                    </div>
                    {user?.id === comment.authorId && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-3">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
