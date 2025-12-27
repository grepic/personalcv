import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
}

const SEO: React.FC<SEOProps> = ({
  title = 'NetworkHub - Professional Networking & Job Platform',
  description = 'Connect with professionals, find your dream job, and grow your career. LinkedIn-style networking platform with advanced job search and professional features.',
  keywords = 'networking, jobs, career, professionals, freelance, hiring, recruitment, LinkedIn alternative',
  image = '/og-image.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  noindex = false,
}) => {
  const siteUrl = 'https://networkhub.cz'; // Change to your domain
  const fullUrl = url || siteUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {author && <meta name="author" content={author} />}

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="NetworkHub" />
      <meta property="og:locale" content="cs_CZ" />

      {/* Article specific */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Language */}
      <meta httpEquiv="content-language" content="cs" />
      <link rel="alternate" hrefLang="cs" href={fullUrl} />
      <link rel="alternate" hrefLang="en" href={fullUrl.replace('.cz', '.com')} />

      {/* Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#2563eb" />

      {/* Apple */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="NetworkHub" />

      {/* Microsoft */}
      <meta name="msapplication-TileColor" content="#2563eb" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
    </Helmet>
  );
};

export default SEO;

// Helper function to generate structured data
export const generateStructuredData = (data: {
  type: 'Organization' | 'JobPosting' | 'Person' | 'Article';
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  jobTitle?: string;
  salary?: { min: number; max: number; currency: string };
  location?: string;
  datePosted?: string;
  validThrough?: string;
  hiringOrganization?: string;
  author?: { name: string; url?: string };
}) => {
  const baseUrl = 'https://networkhub.cz';

  const schemas: Record<string, any> = {
    Organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: data.name || 'NetworkHub',
      description: data.description || 'Professional networking and job platform',
      url: data.url || baseUrl,
      logo: data.logo || `${baseUrl}/logo.png`,
      sameAs: [
        'https://www.facebook.com/networkhub',
        'https://www.linkedin.com/company/networkhub',
        'https://twitter.com/networkhub',
      ],
    },
    JobPosting: {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: data.name,
      description: data.description,
      datePosted: data.datePosted,
      validThrough: data.validThrough,
      hiringOrganization: {
        '@type': 'Organization',
        name: data.hiringOrganization,
        sameAs: data.url,
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: data.location,
          addressCountry: 'CZ',
        },
      },
      baseSalary: data.salary ? {
        '@type': 'MonetaryAmount',
        currency: data.salary.currency,
        value: {
          '@type': 'QuantitativeValue',
          minValue: data.salary.min,
          maxValue: data.salary.max,
          unitText: 'MONTH',
        },
      } : undefined,
    },
    Person: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: data.name,
      description: data.description,
      url: data.url,
      jobTitle: data.jobTitle,
    },
    Article: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.name,
      description: data.description,
      url: data.url,
      datePublished: data.datePosted,
      dateModified: data.validThrough,
      author: data.author ? {
        '@type': 'Person',
        name: data.author.name,
        url: data.author.url,
      } : undefined,
    },
  };

  return schemas[data.type];
};

// StructuredData component
export const StructuredData: React.FC<{ data: any }> = ({ data }) => {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
};