import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * 학생 대시보드 데이터 조회
 * GET /api/student/dashboard
 */
export const getStudentDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'student') {
      res.status(403).json({
        error: 'Forbidden - Student access only',
      });
      return;
    }

    const studentId = req.user.userId;

    // 학생 프로필 정보 (선생님 정보 포함)
    const studentProfile = await prisma.student_profiles.findUnique({
      where: { user_id: studentId },
      include: {
        users_student_profiles_teacher_idTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        users_student_profiles_user_idTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 전체 레슨 통계
    const totalLessons = await prisma.lessons.count({
      where: { student_id: studentId },
    });

    const completedLessons = await prisma.lessons.count({
      where: {
        student_id: studentId,
        status: 'completed',
      },
    });

    const scheduledLessons = await prisma.lessons.count({
      where: {
        student_id: studentId,
        status: 'scheduled',
      },
    });

    // 다가오는 레슨 (가장 가까운 3개)
    const upcomingLessons = await prisma.lessons.findMany({
      where: {
        student_id: studentId,
        status: 'scheduled',
        scheduled_at: {
          gte: new Date(),
        },
      },
      include: {
        users_lessons_teacher_idTousers: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        scheduled_at: 'asc',
      },
      take: 3,
    });

    // 최근 피드백 (최근 3개)
    const recentFeedbacks = await prisma.feedbacks.findMany({
      where: {
        student_id: studentId,
      },
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
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 3,
    });

    // 평균 평점 계산
    const feedbackStats = await prisma.feedbacks.aggregate({
      where: {
        student_id: studentId,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    res.json({
      profile: studentProfile,
      stats: {
        totalLessons,
        completedLessons,
        scheduledLessons,
        totalFeedbacks: feedbackStats._count.id,
        averageRating: feedbackStats._avg.rating || 0,
      },
      upcomingLessons: upcomingLessons.map(lesson => ({
        ...lesson,
        teacher: lesson.users_lessons_teacher_idTousers,
      })),
      recentFeedbacks: recentFeedbacks.map(feedback => ({
        ...feedback,
        teacher: feedback.users_feedbacks_teacher_idTousers,
      })),
    });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({
      error: 'Failed to get student dashboard data',
    });
  }
};

/**
 * 학생 프로필 조회
 * GET /api/student/profile
 */
export const getStudentProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'student') {
      res.status(403).json({
        error: 'Forbidden - Student access only',
      });
      return;
    }

    const studentId = req.user.userId;

    const profile = await prisma.student_profiles.findUnique({
      where: { user_id: studentId },
      include: {
        users_student_profiles_teacher_idTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        users_student_profiles_user_idTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!profile) {
      res.status(404).json({
        error: 'Student profile not found',
      });
      return;
    }

    res.json({
      ...profile,
      teacher: profile.users_student_profiles_teacher_idTousers,
      student: profile.users_student_profiles_user_idTousers,
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      error: 'Failed to get student profile',
    });
  }
};
