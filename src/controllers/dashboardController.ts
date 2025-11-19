import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * 대시보드 통계 조회
 * GET /api/dashboard/stats
 */
export const getDashboardStats = async (
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

    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === 'teacher') {
      // 선생님용 대시보드
      const totalStudents = await prisma.studentProfile.count({
        where: { teacher_id: userId },
      });

      const upcomingLessons = await prisma.lesson.count({
        where: {
          teacher_id: userId,
          status: 'scheduled',
          scheduled_at: {
            gte: new Date(),
          },
        },
      });

      // 피드백이 없는 완료된 레슨 수
      const completedLessonsWithoutFeedback = await prisma.lesson.count({
        where: {
          teacher_id: userId,
          status: 'completed',
          feedback: null,
        },
      });

      // 최근 학생 목록 (최근 수업 기준)
      const recentStudents = await prisma.studentProfile.findMany({
        where: { teacher_id: userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 5,
        orderBy: {
          updated_at: 'desc',
        },
      });

      // 다가오는 레슨 목록
      const upcomingLessonsList = await prisma.lesson.findMany({
        where: {
          teacher_id: userId,
          status: 'scheduled',
          scheduled_at: {
            gte: new Date(),
          },
        },
        include: {
          student: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          scheduled_at: 'asc',
        },
        take: 5,
      });

      res.json({
        total_students: totalStudents,
        upcoming_lessons: upcomingLessons,
        pending_feedback: completedLessonsWithoutFeedback,
        recent_students: recentStudents.map((profile) => ({
          id: profile.id,
          name: profile.user.name,
          voice_type: profile.voice_type,
          level: profile.level,
        })),
        upcoming_lessons_list: upcomingLessonsList.map((lesson) => ({
          id: lesson.id,
          student_name: lesson.student.name,
          scheduled_at: lesson.scheduled_at,
          duration: lesson.duration,
        })),
      });
    } else {
      // 학생용 대시보드
      const profile = await prisma.studentProfile.findUnique({
        where: { user_id: userId },
      });

      const upcomingLessons = await prisma.lesson.count({
        where: {
          student_id: userId,
          status: 'scheduled',
          scheduled_at: {
            gte: new Date(),
          },
        },
      });

      const totalFeedback = await prisma.feedback.count({
        where: { student_id: userId },
      });

      // 최근 피드백
      const recentFeedback = await prisma.feedback.findMany({
        where: { student_id: userId },
        orderBy: { created_at: 'desc' },
        take: 5,
      });

      // 다가오는 레슨 목록
      const upcomingLessonsList = await prisma.lesson.findMany({
        where: {
          student_id: userId,
          status: 'scheduled',
          scheduled_at: {
            gte: new Date(),
          },
        },
        include: {
          teacher: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          scheduled_at: 'asc',
        },
        take: 5,
      });

      res.json({
        profile: {
          voice_type: profile?.voice_type,
          level: profile?.level,
        },
        upcoming_lessons: upcomingLessons,
        total_feedback: totalFeedback,
        recent_feedback: recentFeedback.map((feedback) => ({
          id: feedback.id,
          rating: feedback.rating,
          content: feedback.content,
          created_at: feedback.created_at,
        })),
        upcoming_lessons_list: upcomingLessonsList.map((lesson) => ({
          id: lesson.id,
          teacher_name: lesson.teacher.name,
          scheduled_at: lesson.scheduled_at,
          duration: lesson.duration,
          location: lesson.location,
        })),
      });
    }
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard stats',
    });
  }
};
