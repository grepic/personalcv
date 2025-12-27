import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate XML sitemap
 */
export const generateSitemap = async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://networkhub.cz';

    // Get all public jobs
    const jobs = await prisma.job.findMany({
      where: { status: 'OPEN' },
      select: { id: true, updatedAt: true },
      take: 1000,
    });

    // Get all users (public profiles)
    const users = await prisma.user.findMany({
      select: { id: true, updatedAt: true },
      take: 1000,
    });

    // Generate XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Home Page -->
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Jobs Page -->
  <url>
    <loc>${baseUrl}/jobs</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Feed Page -->
  <url>
    <loc>${baseUrl}/feed</loc>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Individual Jobs -->
  ${jobs.map(job => `
  <url>
    <loc>${baseUrl}/jobs/${job.id}</loc>
    <lastmod>${job.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}

  <!-- User Profiles -->
  ${users.map(user => `
  <url>
    <loc>${baseUrl}/profile/${user.id}</loc>
    <lastmod>${user.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
};