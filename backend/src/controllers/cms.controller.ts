import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const seoSettingSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(160),
  keywords: z.string().optional(),
  ogImage: z.string().url().optional(),
  noindex: z.boolean().optional(),
});

const pageSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  content: z.string().min(1),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * Get page by slug (public)
 */
export const getPageBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const page = await prisma.page.findUnique({
      where: {
        slug,
        isPublished: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        metaTitle: true,
        metaDescription: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    console.error('Error getting page:', error);
    res.status(500).json({ error: 'Failed to get page' });
  }
};

/**
 * Get SEO settings for a page (public)
 */
export const getSeoSettings = async (req: Request, res: Response) => {
  try {
    const { page } = req.params;

    const settings = await prisma.seoSetting.findUnique({
      where: { page },
    });

    if (!settings) {
      // Return defaults if not found
      return res.json({
        page,
        title: 'NetworkHub - Professional Networking & Jobs',
        description: 'Connect with professionals and find your dream job',
        keywords: 'networking, jobs, career',
        noindex: false,
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error getting SEO settings:', error);
    res.status(500).json({ error: 'Failed to get SEO settings' });
  }
};

// ============================================
// ADMIN - SEO MANAGEMENT
// ============================================

/**
 * Get all SEO settings
 */
export const getAllSeoSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.seoSetting.findMany({
      orderBy: { page: 'asc' },
    });

    res.json(settings);
  } catch (error) {
    console.error('Error getting SEO settings:', error);
    res.status(500).json({ error: 'Failed to get SEO settings' });
  }
};

/**
 * Update SEO settings for a page
 */
export const updateSeoSettings = async (req: Request, res: Response) => {
  try {
    const { page } = req.params;
    const userId = (req as any).user.id;
    const validation = seoSettingSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const settings = await prisma.seoSetting.upsert({
      where: { page },
      update: {
        ...validation.data,
        updatedBy: userId,
      },
      create: {
        page,
        ...validation.data,
        updatedBy: userId,
      },
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    res.status(500).json({ error: 'Failed to update SEO settings' });
  }
};

// ============================================
// ADMIN - PAGE MANAGEMENT
// ============================================

/**
 * Get all pages (admin)
 */
export const getAllPages = async (req: Request, res: Response) => {
  try {
    const pages = await prisma.page.findMany({
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(pages);
  } catch (error) {
    console.error('Error getting pages:', error);
    res.status(500).json({ error: 'Failed to get pages' });
  }
};

/**
 * Create new page
 */
export const createPage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validation = pageSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { slug, title, content, metaTitle, metaDescription } = validation.data;

    // Check if slug already exists
    const existing = await prisma.page.findUnique({
      where: { slug },
    });

    if (existing) {
      return res.status(400).json({ error: 'Page with this slug already exists' });
    }

    const page = await prisma.page.create({
      data: {
        slug,
        title,
        content,
        metaTitle,
        metaDescription,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    res.status(201).json(page);
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Failed to create page' });
  }
};

/**
 * Get single page (admin)
 */
export const getPage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    console.error('Error getting page:', error);
    res.status(500).json({ error: 'Failed to get page' });
  }
};

/**
 * Update page
 */
export const updatePage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = pageSchema.partial().safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const page = await prisma.page.update({
      where: { id },
      data: validation.data,
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    res.json(page);
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
};

/**
 * Delete page
 */
export const deletePage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.page.delete({
      where: { id },
    });

    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
};

/**
 * Publish page
 */
export const publishPage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const page = await prisma.page.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    res.json(page);
  } catch (error) {
    console.error('Error publishing page:', error);
    res.status(500).json({ error: 'Failed to publish page' });
  }
};

/**
 * Unpublish page
 */
export const unpublishPage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const page = await prisma.page.update({
      where: { id },
      data: {
        isPublished: false,
      },
    });

    res.json(page);
  } catch (error) {
    console.error('Error unpublishing page:', error);
    res.status(500).json({ error: 'Failed to unpublish page' });
  }
};