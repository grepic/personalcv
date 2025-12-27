import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

/**
 * Upload user avatar
 */
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate URL for the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;

    // Update user's avatarUrl in database
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: fileUrl },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    // Delete old avatar file if it exists and is not the default
    // (This prevents accumulation of old files)
    // Note: Implement this carefully to avoid deleting files still in use

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

/**
 * Upload portfolio image
 */
export const uploadPortfolioImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate URL for the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: fileUrl,
    });
  } catch (error) {
    console.error('Error uploading portfolio image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

/**
 * Upload CV/Resume
 */
export const uploadCV = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate URL for the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      message: 'CV uploaded successfully',
      cvUrl: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error('Error uploading CV:', error);
    res.status(500).json({ error: 'Failed to upload CV' });
  }
};

/**
 * Delete uploaded file
 */
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { filename } = req.params;

    // Security: Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(__dirname, '../../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
