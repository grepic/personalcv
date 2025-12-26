import { useState } from 'react';
import api from '../services/api';

interface CreatePostFormProps {
  onPostCreated?: () => void;
  onCancel?: () => void;
}

export default function CreatePostForm({ onPostCreated, onCancel }: CreatePostFormProps) {
  const [type, setType] = useState<'STATUS' | 'PORTFOLIO'>('STATUS');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers_only'>('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/posts', {
        type,
        title: title || undefined,
        content,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        visibility,
      });

      // Reset form
      setTitle('');
      setContent('');
      setTags('');
      setType('STATUS');
      setVisibility('public');

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Create Post</h3>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="STATUS"
                checked={type === 'STATUS'}
                onChange={(e) => setType(e.target.value as 'STATUS')}
                className="mr-2"
              />
              Status Update
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="PORTFOLIO"
                checked={type === 'PORTFOLIO'}
                onChange={(e) => setType(e.target.value as 'PORTFOLIO')}
                className="mr-2"
              />
              Portfolio
            </label>
          </div>
        </div>

        {type === 'PORTFOLIO' && (
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Project title..."
            />
          </div>
        )}

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What's on your mind?"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="React, Design, Freelance..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visibility
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="public"
                checked={visibility === 'public'}
                onChange={(e) => setVisibility(e.target.value as 'public')}
                className="mr-2"
              />
              Public
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="followers_only"
                checked={visibility === 'followers_only'}
                onChange={(e) => setVisibility(e.target.value as 'followers_only')}
                className="mr-2"
              />
              Followers Only
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
