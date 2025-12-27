import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import SEO from '../components/SEO';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt: string;
  updatedAt: string;
}

const DynamicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/cms/pages/${slug}`);
      setPage(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Page not found');
      } else {
        setError('Failed to load page');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Page Not Found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/" className="btn-primary inline-block">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={page.metaTitle || page.title}
        description={page.metaDescription || `${page.title} - NetworkHub`}
        type="article"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {page.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Published {new Date(page.publishedAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>Last updated {new Date(page.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Content */}
          <div className="card p-8 md:p-12">
            <div
              className="prose dark:prose-invert max-w-none
                prose-headings:font-bold
                prose-h1:text-3xl prose-h1:mb-4
                prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-8
                prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-6
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:mb-4 prose-p:leading-relaxed
                prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 dark:prose-strong:text-white
                prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:mb-2
                prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded-lg
                prose-blockquote:border-l-4 prose-blockquote:border-primary-600 prose-blockquote:pl-4 prose-blockquote:italic
                prose-img:rounded-lg prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link to="/" className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default DynamicPage;
