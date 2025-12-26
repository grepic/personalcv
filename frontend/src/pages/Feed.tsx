import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Post } from '../types';
import { formatDistanceToNow } from 'date-fns';
import CreatePostForm from '../components/CreatePostForm';
import { useAuthStore } from '../store/authStore';

export default function Feed() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter === 'jobs') params.type = 'JOB';
      if (filter === 'portfolio') params.type = 'PORTFOLIO';

      const { data } = await api.get('/posts/feed', { params });
      setPosts(data.posts);
    } catch (error) {
      console.error('Load posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/posts/${postId}`);
      loadPosts();
    } catch (error) {
      console.error('Delete post error:', error);
      alert('Failed to delete post');
    }
  };

  const PostCard = ({ post }: { post: Post }) => {
    const isOwner = user?.id === post.author.id;
    const isEditing = editingPost?.id === post.id;

    if (isEditing) {
      return (
        <div className="mb-4">
          <CreatePostForm
            post={editingPost}
            onPostCreated={() => {
              setEditingPost(null);
              loadPosts();
            }}
            onCancel={() => setEditingPost(null)}
          />
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium flex-shrink-0">
            {post.author.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/profile/${post.author.id}`}
              className="font-semibold text-gray-900 hover:text-blue-600"
            >
              {post.author.displayName}
            </Link>
            {post.author.headline && (
              <p className="text-sm text-gray-600">{post.author.headline}</p>
            )}
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {post.type}
            </span>
            {isOwner && (
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingPost(post)}
                  className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1"
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="text-sm text-red-600 hover:text-red-700 px-2 py-1"
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

      {post.title && <h3 className="text-lg font-semibold mb-2">{post.title}</h3>}
      <p className="text-gray-700 whitespace-pre-wrap mb-3">{post.content}</p>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag, index) => (
            <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {post.job && (
        <Link
          to={`/jobs/${post.job.id}`}
          className="block mt-3 p-4 bg-blue-50 rounded-md hover:bg-blue-100 transition"
        >
          <h4 className="font-semibold text-blue-900">{post.job.title}</h4>
          <p className="text-sm text-gray-700 mt-1">
            {post.job.location} {post.job.isRemote && '(Remote)'}
          </p>
          {post.job.salaryMin && post.job.salaryMax && (
            <p className="text-sm text-gray-600 mt-1">
              ${post.job.salaryMin.toLocaleString()} - ${post.job.salaryMax.toLocaleString()} {post.job.currency}
            </p>
          )}
        </Link>
      )}
      </div>
    );
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Feed</h2>
          <button
            onClick={() => setShowCreatePost(!showCreatePost)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {showCreatePost ? 'Cancel' : 'Create Post'}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('jobs')}
            className={`px-4 py-2 rounded-md ${
              filter === 'jobs'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Jobs
          </button>
          <button
            onClick={() => setFilter('portfolio')}
            className={`px-4 py-2 rounded-md ${
              filter === 'portfolio'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Portfolio
          </button>
        </div>
      </div>

      {showCreatePost && (
        <div className="mb-6">
          <CreatePostForm
            onPostCreated={() => {
              setShowCreatePost(false);
              loadPosts();
            }}
            onCancel={() => setShowCreatePost(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          No posts yet
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
