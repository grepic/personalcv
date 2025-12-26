import { useState, useEffect } from 'react';
import api from '../services/api';
import { PostReactionsSummary, ReactionType } from '../types';
import { useAuthStore } from '../store/authStore';

interface PostReactionsProps {
  postId: string;
}

const reactionEmojis: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  celebrate: '🎉',
  insightful: '💡',
  curious: '🤔',
};

const reactionLabels: Record<ReactionType, string> = {
  like: 'Like',
  love: 'Love',
  celebrate: 'Celebrate',
  insightful: 'Insightful',
  curious: 'Curious',
};

export default function PostReactions({ postId }: PostReactionsProps) {
  const { isAuthenticated } = useAuthStore();
  const [reactions, setReactions] = useState<PostReactionsSummary | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [postId]);

  const loadReactions = async () => {
    try {
      const { data } = await api.get(`/posts/${postId}/reactions`);
      setReactions(data);
    } catch (error) {
      console.error('Load reactions error:', error);
    }
  };

  const handleReaction = async (type: ReactionType) => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      await api.post(`/posts/${postId}/reactions`, { type });
      await loadReactions();
      setShowReactionPicker(false);
    } catch (error) {
      console.error('Reaction error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!reactions) return null;

  const hasReacted = !!reactions.userReaction;
  const userReactionType = reactions.userReaction;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Show reaction counts */}
        {reactions.total > 0 && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            {Object.entries(reactions.byType).map(([type, count]) => (
              <span key={type} className="flex items-center">
                {reactionEmojis[type as ReactionType]} {count}
              </span>
            ))}
          </div>
        )}

        {/* Reaction button */}
        {isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              onBlur={() => setTimeout(() => setShowReactionPicker(false), 200)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                hasReacted
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {hasReacted && userReactionType ? (
                <span>
                  {reactionEmojis[userReactionType]} {reactionLabels[userReactionType]}
                </span>
              ) : (
                <span>👍 React</span>
              )}
            </button>

            {/* Reaction picker dropdown */}
            {showReactionPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-white shadow-lg rounded-lg p-2 flex gap-1 z-10 border border-gray-200">
                {(Object.keys(reactionEmojis) as ReactionType[]).map((type) => (
                  <button
                    key={type}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleReaction(type);
                    }}
                    className="p-2 hover:bg-gray-100 rounded transition"
                    title={reactionLabels[type]}
                  >
                    <span className="text-2xl">{reactionEmojis[type]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
