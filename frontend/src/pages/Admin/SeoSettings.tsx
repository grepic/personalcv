import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface SeoSetting {
  id: string;
  page: string;
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  noindex: boolean;
  updatedAt: string;
}

const commonPages = [
  { key: 'homepage', label: 'Homepage' },
  { key: 'jobs', label: 'Jobs Page' },
  { key: 'feed', label: 'Feed Page' },
  { key: 'about', label: 'About Us' },
  { key: 'contact', label: 'Contact' },
];

const SeoSettings: React.FC = () => {
  const [settings, setSettings] = useState<SeoSetting[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('homepage');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    keywords: '',
    ogImage: '',
    noindex: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    loadPageSettings(selectedPage);
  }, [selectedPage, settings]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cms/admin/seo');
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPageSettings = (page: string) => {
    const pageSetting = settings.find(s => s.page === page);
    if (pageSetting) {
      setFormData({
        title: pageSetting.title,
        description: pageSetting.description,
        keywords: pageSetting.keywords || '',
        ogImage: pageSetting.ogImage || '',
        noindex: pageSetting.noindex,
      });
    } else {
      // Load defaults
      setFormData({
        title: '',
        description: '',
        keywords: '',
        ogImage: '',
        noindex: false,
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/cms/admin/seo/${selectedPage}`, formData);
      alert('SEO settings saved successfully!');
      fetchSettings();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getCharCount = (text: string, limit: number) => {
    const count = text.length;
    const color = count > limit ? 'text-danger-600' : count > limit * 0.9 ? 'text-warning-600' : 'text-success-600';
    return <span className={color}>{count}/{limit}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SEO Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage meta tags, descriptions, and SEO settings for each page
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Page Selector */}
          <div className="lg:col-span-1">
            <div className="card p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Pages</h2>
              <div className="space-y-2">
                {commonPages.map((page) => (
                  <button
                    key={page.key}
                    onClick={() => setSelectedPage(page.key)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedPage === page.key
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {page.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Form */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                {commonPages.find(p => p.key === selectedPage)?.label} - SEO
              </h2>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    placeholder="NetworkHub - Professional Networking & Jobs"
                    maxLength={60}
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      This appears in browser tabs and search results
                    </p>
                    <p className="text-xs">{getCharCount(formData.title, 60)}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Connect with professionals, find your dream job, and grow your career..."
                    maxLength={160}
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      This appears in search results below the title
                    </p>
                    <p className="text-xs">{getCharCount(formData.description, 160)}</p>
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="input"
                    placeholder="networking, jobs, career, professionals"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional - helps with internal search and categorization
                  </p>
                </div>

                {/* OG Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Social Media Image (OG Image)
                  </label>
                  <input
                    type="url"
                    value={formData.ogImage}
                    onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                    className="input"
                    placeholder="https://networkhub.cz/images/og-homepage.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: 1200x630px - appears when shared on social media
                  </p>
                  {formData.ogImage && (
                    <div className="mt-3">
                      <img
                        src={formData.ogImage}
                        alt="OG Preview"
                        className="max-w-sm rounded-lg border border-gray-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* No Index */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="noindex"
                    checked={formData.noindex}
                    onChange={(e) => setFormData({ ...formData, noindex: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="noindex" className="text-sm text-gray-700 dark:text-gray-300">
                    Hide from search engines (noindex)
                  </label>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Search Engine Preview
                  </h3>
                  <div className="space-y-1">
                    <div className="text-xl text-blue-600 hover:underline cursor-pointer">
                      {formData.title || 'Page Title'}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-400">
                      https://networkhub.cz/{selectedPage === 'homepage' ? '' : selectedPage}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.description || 'Meta description will appear here...'}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => loadPageSettings(selectedPage)}
                    className="btn-secondary"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !formData.title || !formData.description}
                    className="btn-primary"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="card p-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                💡 SEO Best Practices
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>✓ Keep titles under 60 characters for best display</li>
                <li>✓ Write descriptions between 150-160 characters</li>
                <li>✓ Include primary keywords naturally in title and description</li>
                <li>✓ Make each page's SEO unique and relevant to its content</li>
                <li>✓ Use OG images sized 1200x630px for optimal social sharing</li>
                <li>✓ Only use "noindex" for pages you don't want in search results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoSettings;