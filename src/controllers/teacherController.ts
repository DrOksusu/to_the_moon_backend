import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * 선생님 목록 조회 (공개 - 회원가입용)
 * GET /api/teachers
 */
export const getTeachers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const teachers = await prisma.users.findMany({
      where: {
        role: 'teacher',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      error: 'Failed to get teachers',
    });
  }
};
