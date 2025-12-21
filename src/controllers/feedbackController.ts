import { Request, Response } from 'express';
import prisma from '../config/database';
import { randomUUID } from 'crypto';
import { createNotification } from './notificationController';

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
    console.log('createFeedback - req.user:', req.user);
    if (!req.user || req.user.role !== 'teacher') {
      console.log('createFeedback - Forbidden: role is', req.user?.role);
      res.status(403).json({
        error: 'Forbidden',
      });
      return;
    }

    const { lesson_id, student_id, rating, content, strengths, improvements, homework, reference_urls } =
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

    // 선생님 정보 조회
    const teacher = await prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { name: true },
    });

    // 피드백 생성
    const feedback = await prisma.feedbacks.create({
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
        reference_urls,
        updated_at: new Date(),
      },
    });

    // 학생에게 알림 전송
    const lessonTitle = lesson.title || '레슨';
    await createNotification(
      student_id,
      'feedback_received',
      '새 피드백이 도착했습니다',
      `${teacher?.name || '선생님'}님이 "${lessonTitle}" 수업에 대한 피드백을 작성했습니다.`,
      lesson_id
    );

    res.status(201).json(feedback);
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
    const { rating, content, strengths, improvements, homework, reference_urls } = req.body;
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
        reference_urls,
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

/**
 * 학생 반응 추가 (학생 전용)
 * PATCH /api/feedback/:id/reaction
 */
export const addStudentReaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'student') {
      res.status(403).json({
        error: 'Forbidden',
      });
      return;
    }

    const { id } = req.params;
    const { reaction, message } = req.body;
    const studentId = req.user.userId;

    // 반응 검증 (허용된 이모티콘만)
    const allowedReactions = ['👍', '😊', '🔥', '💪', '🙏'];
    if (!reaction || !allowedReactions.includes(reaction)) {
      res.status(400).json({
        error: 'Invalid reaction. Allowed: 👍, 😊, 🔥, 💪, 🙏',
      });
      return;
    }

    // 메시지 길이 검증 (최대 100자)
    if (message && message.length > 100) {
      res.status(400).json({
        error: 'Message must be 100 characters or less',
      });
      return;
    }

    // 해당 학생의 피드백인지 확인
    const existingFeedback = await prisma.feedbacks.findFirst({
      where: {
        id,
        student_id: studentId,
      },
    });

    if (!existingFeedback) {
      res.status(404).json({
        error: 'Feedback not found',
      });
      return;
    }

    // 학생 반응 업데이트
    const updatedFeedback = await prisma.feedbacks.update({
      where: { id },
      data: {
        student_reaction: reaction,
        student_message: message || null,
        student_reacted_at: new Date(),
        updated_at: new Date(),
      },
    });

    res.json({
      id: updatedFeedback.id,
      student_reaction: updatedFeedback.student_reaction,
      student_message: updatedFeedback.student_message,
      student_reacted_at: updatedFeedback.student_reacted_at,
    });
  } catch (error) {
    console.error('Add student reaction error:', error);
    res.status(500).json({
      error: 'Failed to add student reaction',
    });
  }
};

/**
 * 선생님이 학생 반응 확인 (선생님 전용)
 * PATCH /api/feedback/:id/view-reaction
 */
export const viewStudentReaction = async (
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

    // 반응 확인 시간 업데이트
    const updatedFeedback = await prisma.feedbacks.update({
      where: { id },
      data: {
        teacher_viewed_reaction_at: new Date(),
        updated_at: new Date(),
      },
    });

    res.json({
      id: updatedFeedback.id,
      teacher_viewed_reaction_at: updatedFeedback.teacher_viewed_reaction_at,
    });
  } catch (error) {
    console.error('View student reaction error:', error);
    res.status(500).json({
      error: 'Failed to mark reaction as viewed',
    });
  }
};

/**
 * 확인하지 않은 학생 반응 개수 조회 (선생님 전용)
 * GET /api/feedback/unviewed-reactions-count
 */
export const getUnviewedReactionsCount = async (
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

    const teacherId = req.user.userId;

    const count = await prisma.feedbacks.count({
      where: {
        teacher_id: teacherId,
        student_reaction: { not: null },
        teacher_viewed_reaction_at: null,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unviewed reactions count error:', error);
    res.status(500).json({
      error: 'Failed to get unviewed reactions count',
    });
  }
};
