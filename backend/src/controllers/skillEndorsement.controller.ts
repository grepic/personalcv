import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

export async function toggleEndorseSkill(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { skillId } = req.params;

    // Check if skill exists
    const skill = await prisma.userSkill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Don't allow users to endorse their own skills
    if (skill.userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot endorse your own skills' });
    }

    // Check if already endorsed
    const existing = await prisma.skillEndorsement.findUnique({
      where: {
        skillId_endorserId: {
          skillId,
          endorserId: req.user.userId,
        },
      },
    });

    if (existing) {
      // Remove endorsement
      await prisma.skillEndorsement.delete({
        where: { id: existing.id },
      });
      return res.json({ message: 'Endorsement removed', endorsed: false });
    }

    // Add endorsement
    const endorsement = await prisma.skillEndorsement.create({
      data: {
        skillId,
        endorserId: req.user.userId,
      },
    });

    res.status(201).json({ endorsement, endorsed: true });
  } catch (error) {
    console.error('Toggle endorse skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSkillEndorsements(req: AuthRequest, res: Response) {
  try {
    const { skillId } = req.params;

    const endorsements = await prisma.skillEndorsement.findMany({
      where: { skillId },
      orderBy: { createdAt: 'desc' },
    });

    // Check if current user has endorsed
    let userEndorsed = false;
    if (req.user) {
      userEndorsed = endorsements.some(e => e.endorserId === req.user!.userId);
    }

    res.json({
      count: endorsements.length,
      endorsed: userEndorsed,
      endorsements,
    });
  } catch (error) {
    console.error('Get skill endorsements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserSkillsWithEndorsements(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;

    const skills = await prisma.userSkill.findMany({
      where: { userId },
      include: {
        endorsements: {
          select: {
            id: true,
            endorserId: true,
            createdAt: true,
          },
        },
      },
    });

    // Check which skills current user has endorsed
    const skillsWithEndorsementInfo = skills.map(skill => ({
      ...skill,
      endorsementCount: skill.endorsements.length,
      userEndorsed: req.user
        ? skill.endorsements.some(e => e.endorserId === req.user!.userId)
        : false,
    }));

    res.json({ skills: skillsWithEndorsementInfo });
  } catch (error) {
    console.error('Get user skills with endorsements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
