import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { Post } from '../types';
import { useAuthStore } from '../store/authStore';
import PostReactions from '../components/PostReactions';
import PostComments from '../components/PostComments';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const { data } = await api.get(`/posts/${postId}`);
      setPost(data.post);
    } catch (error) {
      console.error('Load post error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/posts/${postId}`);
      navigate('/feed');
    } catch (error) {
      console.error('Delete post error:', error);
      alert('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-white rounded-xl shadow-card p-8 text-center">
        <p className="text-gray-500">Post not found</p>
        <Link to="/feed" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          Back to Feed
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === post.author.id;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Post Card */}
      <div className="bg-white rounded-xl shadow-card p-8 border border-gray-100">
        {/* Author Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <Link to={`/profile/${post.author.id}`}>
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold hover:bg-primary-700 transition">
                {post.author.displayName.charAt(0).toUpperCase()}
              </div>
            </Link>
            <div>
              <Link
                to={`/profile/${post.author.id}`}
                className="font-bold text-xl text-gray-900 hover:text-primary-600 transition"
              >
                {post.author.displayName}
              </Link>
              {post.author.headline && (
                <p className="text-gray-600 mt-1">{post.author.headline}</p>
              )}
              {post.author.companyName && (
                <p className="text-sm text-gray-500">{post.author.companyName}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-gray-100 px-3 py-1.5 rounded-full font-medium">
              {post.type}
            </span>
            {isOwner && (
              <div className="flex gap-2">
                <Link
                  to={`/feed`}
                  state={{ editPostId: post.id }}
                  className="text-sm text-primary-600 hover:text-primary-700 px-3 py-1.5 font-medium"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="text-sm text-red-600 hover:text-red-700 px-3 py-1.5 font-medium"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-6">
          {post.title && (
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
          )}
          <p className="text-lg text-gray-800 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="text-sm bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Job Info */}
        {post.job && (
          <Link
            to={`/jobs/${post.job.id}`}
            className="block p-6 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl hover:shadow-md transition border border-primary-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-primary-900 mb-2">{post.job.title}</h3>
                <p className="text-gray-700 flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {post.job.location}
                  {post.job.isRemote && <span className="text-green-600 font-medium">(Remote)</span>}
                </p>
                {post.job.salaryMin && post.job.salaryMax && (
                  <p className="text-gray-700 font-semibold">
                    ${post.job.salaryMin.toLocaleString()} - ${post.job.salaryMax.toLocaleString()} {post.job.currency}
                  </p>
                )}
              </div>
              <span className="text-primary-600 font-medium">View Job →</span>
            </div>
          </Link>
        )}

        {/* Visibility */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {post.visibility === 'public' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              )}
            </svg>
            {post.visibility === 'public' ? 'Public' : 'Followers Only'}
          </p>
        </div>

        {/* Reactions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <PostReactions postId={post.id} />
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-6 bg-white rounded-xl shadow-card p-6 border border-gray-100">
        <PostComments postId={post.id} />
      </div>
    </div>
  );
}
