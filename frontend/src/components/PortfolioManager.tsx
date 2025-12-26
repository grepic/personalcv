import { useState, useEffect } from 'react';
import api from '../services/api';
import { PortfolioProject } from '../types';

interface PortfolioManagerProps {
  userId: string;
  isOwnProfile: boolean;
}

export default function PortfolioManager({ userId, isOwnProfile }: PortfolioManagerProps) {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [userId]);

  const loadProjects = async () => {
    try {
      const { data } = await api.get(`/users/${userId}/portfolio`);
      setProjects(data.projects);
    } catch (error) {
      console.error('Load portfolio error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        title,
        description,
        externalUrl: externalUrl || undefined,
      };

      if (editingProject) {
        await api.put(`/portfolio/${editingProject.id}`, payload);
      } else {
        await api.post('/portfolio', payload);
      }

      loadProjects();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (project: PortfolioProject) => {
    setEditingProject(project);
    setTitle(project.title);
    setDescription(project.description);
    setExternalUrl(project.externalUrl || '');
    setShowForm(true);
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await api.delete(`/portfolio/${projectId}`);
      loadProjects();
    } catch (error) {
      console.error('Delete project error:', error);
      alert('Failed to delete project');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setExternalUrl('');
    setEditingProject(null);
    setShowForm(false);
    setError('');
  };

  if (loading) {
    return <div className="text-center py-4">Loading portfolio...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Portfolio</h2>
        {isOwnProfile && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {showForm ? 'Cancel' : 'Add Project'}
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && isOwnProfile && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project URL (optional)
            </label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Add Project'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {isOwnProfile ? 'No portfolio projects yet. Add your first project!' : 'No portfolio projects yet.'}
        </p>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project.id} className="border-t border-gray-200 pt-6 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold">{project.title}</h3>
                {isOwnProfile && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap mb-3">{project.description}</p>
              {project.externalUrl && (
                <a
                  href={project.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  View Project
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
