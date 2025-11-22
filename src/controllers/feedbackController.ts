import { Request, Response } from 'express';
import prisma from '../config/database';
import { randomUUID } from 'crypto';

/**
 * 피드백 목록 조회
 * GET /api/feedback
 */
export const getFeedbacks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
      });
      return;
    }

    const { student_id } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // 조건 설정
    const where: any = {};

    // 역할에 따라 필터링
    if (userRole === 'teacher') {
      where.teacher_id = userId;
      if (student_id) {
        where.student_id = student_id as string;
      }
    } else {
      where.student_id = userId;
    }

    const feedbacks = await prisma.feedbacks.findMany({
      where,
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            scheduled_at: true,
          },
        },
        users_feedbacks_teacher_idTousers: {
          select: {
            id: true,
            name: true,
          },
        },
        users_feedbacks_student_idTousers: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json(feedbacks);
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({
      error: 'Failed to get feedbacks',
    });
  }
};

/**
 * 피드백 상세 정보
 * GET /api/feedback/:id
 */
export const getFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;
    const userId = req.user.userId;

    const feedback = await prisma.feedbacks.findFirst({
      where: {
        id,
        OR: [{ teacher_id: userId }, { student_id: userId }],
      },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            scheduled_at: true,
            duration: true,
          },
        },
        users_feedbacks_teacher_idTousers: {
          select: {
            id: true,
            name: true,
          },
        },
        users_feedbacks_student_idTousers: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!feedback) {
      res.status(404).json({
        error: 'Feedback not found',
      });
      return;
    }

    res.json(feedback);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      error: 'Failed to get feedback',
    });
  }
};

/**
 * 피드백 작성 (선생님 전용)
 * POST /api/feedback
 */
export const createFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'teacher') {
      res.status(403).json({
        error: 'Forbidden',
      });
      return;
    }

    const { lesson_id, student_id, rating, content, strengths, improvements, homework } =
      req.body;

    // 입력 검증
    if (!lesson_id || !student_id || !rating || !content) {
      res.status(400).json({
        error: 'Lesson ID, student ID, rating, and content are required',
      });
      return;
    }

    // 평점 검증
    if (rating < 1 || rating > 5) {
      res.status(400).json({
        error: 'Rating must be between 1 and 5',
      });
      return;
    }

    // 수업이 존재하고 해당 선생님의 수업인지 확인
    const lesson = await prisma.lessons.findFirst({
      where: {
        id: lesson_id,
        teacher_id: req.user.userId,
        student_id,
      },
    });

    if (!lesson) {
      res.status(404).json({
        error: 'Lesson not found',
      });
      return;
    }

    // 이미 피드백이 있는지 확인
    const existingFeedback = await prisma.feedbacks.findUnique({
      where: { lesson_id },
    });

    if (existingFeedback) {
      res.status(400).json({
        error: 'Feedback already exists for this lesson',
      });
      return;
    }

    // 트랜잭션으로 피드백 생성 및 레슨 상태 업데이트
    const result = await prisma.$transaction(async (tx) => {
      // 피드백 생성
      const feedback = await tx.feedbacks.create({
        data: {
          id: randomUUID(),
          lesson_id,
          teacher_id: req.user.userId,
          student_id,
          rating,
          content,
          strengths,
          improvements,
          homework,
          updated_at: new Date(),
        },
      });

      // 레슨 상태를 completed로 변경
      await tx.lessons.update({
        where: { id: lesson_id },
        data: {
          status: 'completed',
          updated_at: new Date(),
        },
      });

      return feedback;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      error: 'Failed to create feedback',
    });
  }
};

/**
 * 피드백 수정 (선생님 전용)
 * PUT /api/feedback/:id
 */
export const updateFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'teacher') {
      res.status(403).json({
        error: 'Forbidden',
      });
      return;
    }

    const { id } = req.params;
    const { rating, content, strengths, improvements, homework } = req.body;
    const teacherId = req.user.userId;

    // 해당 선생님의 피드백인지 확인
    const existingFeedback = await prisma.feedbacks.findFirst({
      where: {
        id,
        teacher_id: teacherId,
      },
    });

    if (!existingFeedback) {
      res.status(404).json({
        error: 'Feedback not found',
      });
      return;
    }

    // 평점 검증
    if (rating && (rating < 1 || rating > 5)) {
      res.status(400).json({
        error: 'Rating must be between 1 and 5',
      });
      return;
    }

    // 피드백 업데이트
    const updatedFeedback = await prisma.feedbacks.update({
      where: { id },
      data: {
        rating,
        content,
        strengths,
        improvements,
        homework,
        updated_at: new Date(),
      },
    });

    res.json(updatedFeedback);
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      error: 'Failed to update feedback',
    });
  }
};
