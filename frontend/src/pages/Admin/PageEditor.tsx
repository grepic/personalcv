import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    displayName: string;
  };
}

const PageEditor: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
  });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cms/admin/pages');
      setPages(data);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPage = () => {
    setSelectedPage(null);
    setFormData({
      slug: '',
      title: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
    });
    setIsEditing(true);
  };

  const handleEditPage = (page: Page) => {
    setSelectedPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedPage) {
        // Update existing page
        await api.put(`/cms/admin/pages/${selectedPage.id}`, formData);
        alert('Page updated successfully!');
      } else {
        // Create new page
        await api.post('/cms/admin/pages', formData);
        alert('Page created successfully!');
      }
      setIsEditing(false);
      fetchPages();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (pageId: string) => {
    try {
      await api.put(`/cms/admin/pages/${pageId}/publish`);
      alert('Page published successfully!');
      fetchPages();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to publish page');
    }
  };

  const handleUnpublish = async (pageId: string) => {
    try {
      await api.put(`/cms/admin/pages/${pageId}/unpublish`);
      alert('Page unpublished successfully!');
      fetchPages();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to unpublish page');
    }
  };

  const handleDelete = async (pageId: string, pageTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${pageTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/cms/admin/pages/${pageId}`);
      alert('Page deleted successfully!');
      fetchPages();
      if (selectedPage?.id === pageId) {
        setIsEditing(false);
        setSelectedPage(null);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete page');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
    // Auto-generate slug for new pages
    if (!selectedPage) {
      setFormData(prev => ({ ...prev, title, slug: generateSlug(title) }));
    }
  };

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-2"
              >
                ← Back to Pages
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {selectedPage ? 'Edit Page' : 'Create New Page'}
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="btn-secondary"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.slug || !formData.title || !formData.content}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Page'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Page Details
                </h2>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Page Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="input"
                      placeholder="About Us"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL Slug *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">/pages/</span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="input flex-1"
                        placeholder="about-us"
                        pattern="[a-z0-9-]+"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Only lowercase letters, numbers, and hyphens
                    </p>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content (HTML) *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="input font-mono text-sm"
                      rows={15}
                      placeholder="<h1>About Us</h1><p>Welcome to NetworkHub...</p>"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      HTML content with support for all standard tags
                    </p>
                  </div>
                </div>
              </div>

              {/* SEO Settings */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                  SEO Settings (Optional)
                </h2>

                <div className="space-y-4">
                  {/* Meta Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      className="input"
                      placeholder="Leave empty to use page title"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.metaTitle.length}/60 characters
                    </p>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      className="input"
                      rows={3}
                      placeholder="Brief description for search engines"
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.metaDescription.length}/160 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick HTML Guide */}
              <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  💡 HTML Quick Reference
                </h3>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1 font-mono">
                  <div>&lt;h1&gt;Heading&lt;/h1&gt; - Main heading</div>
                  <div>&lt;h2&gt;Subheading&lt;/h2&gt; - Subheading</div>
                  <div>&lt;p&gt;Paragraph&lt;/p&gt; - Text paragraph</div>
                  <div>&lt;strong&gt;Bold&lt;/strong&gt; - Bold text</div>
                  <div>&lt;em&gt;Italic&lt;/em&gt; - Italic text</div>
                  <div>&lt;a href="url"&gt;Link&lt;/a&gt; - Hyperlink</div>
                  <div>&lt;ul&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ul&gt; - List</div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className={showPreview ? 'block' : 'hidden lg:block'}>
              <div className="card p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Live Preview
                </h2>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 min-h-[500px]">
                  {formData.title && (
                    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formData.title}
                      </h1>
                      <p className="text-sm text-gray-500 mt-2">
                        URL: /pages/{formData.slug || 'page-slug'}
                      </p>
                    </div>
                  )}

                  {formData.content ? (
                    <div
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  ) : (
                    <div className="text-gray-400 text-center py-12">
                      Content preview will appear here...
                    </div>
                  )}
                </div>

                {(formData.metaTitle || formData.metaDescription) && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Search Engine Preview
                    </h3>
                    <div className="space-y-1">
                      <div className="text-lg text-blue-600">
                        {formData.metaTitle || formData.title}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-400">
                        https://networkhub.cz/pages/{formData.slug}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.metaDescription || 'No meta description set'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Page Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create and manage static pages like About, Privacy Policy, Terms of Service
            </p>
          </div>
          <button onClick={handleNewPage} className="btn-primary">
            + New Page
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : pages.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No pages yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first page to get started
            </p>
            <button onClick={handleNewPage} className="btn-primary">
              Create Page
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pages.map((page) => (
              <div key={page.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {page.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          page.isPublished
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {page.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      URL: /pages/{page.slug}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>By {page.author.displayName}</span>
                      <span>•</span>
                      <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
                      {page.publishedAt && (
                        <>
                          <span>•</span>
                          <span>Published {new Date(page.publishedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {page.isPublished ? (
                      <Link
                        to={`/pages/${page.slug}`}
                        target="_blank"
                        className="btn-secondary text-sm"
                      >
                        View
                      </Link>
                    ) : null}
                    <button
                      onClick={() => handleEditPage(page)}
                      className="btn-secondary text-sm"
                    >
                      Edit
                    </button>
                    {page.isPublished ? (
                      <button
                        onClick={() => handleUnpublish(page.id)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(page.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(page.id, page.title)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageEditor;
