import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * 모든 선생님 목록 조회 (관리자 전용)
 * GET /api/admin/teachers
 */
export const getAllTeachers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({
        error: 'Admin access required',
      });
      return;
    }

    const teachers = await prisma.users.findMany({
      where: {
        role: 'teacher',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        created_at: true,
        is_admin: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json(teachers);
  } catch (error) {
    console.error('Get all teachers error:', error);
    res.status(500).json({
      error: 'Failed to get teachers',
    });
  }
};

/**
 * 모든 학생 목록 조회 (관리자 전용)
 * GET /api/admin/students
 */
export const getAllStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({
        error: 'Admin access required',
      });
      return;
    }

    const students = await prisma.users.findMany({
      where: {
        role: 'student',
      },
      include: {
        student_profiles_student_profiles_user_idTousers: {
          include: {
            users_student_profiles_teacher_idTousers: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const result = students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      created_at: student.created_at,
      profile: student.student_profiles_student_profiles_user_idTousers
        ? {
            id: student.student_profiles_student_profiles_user_idTousers.id,
            teacher: student.student_profiles_student_profiles_user_idTousers
              .users_student_profiles_teacher_idTousers,
            voice_type:
              student.student_profiles_student_profiles_user_idTousers
                .voice_type,
            level:
              student.student_profiles_student_profiles_user_idTousers.level,
            start_date:
              student.student_profiles_student_profiles_user_idTousers
                .start_date,
            is_active:
              student.student_profiles_student_profiles_user_idTousers
                .is_active,
          }
        : null,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({
      error: 'Failed to get students',
    });
  }
};

/**
 * 선생님별 학생 현황 조회 (관리자 전용)
 * GET /api/admin/teacher-students/:teacherId
 */
export const getTeacherStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({
        error: 'Admin access required',
      });
      return;
    }

    const { teacherId } = req.params;

    const students = await prisma.student_profiles.findMany({
      where: {
        teacher_id: teacherId,
        is_active: true,
      },
      include: {
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

    res.json(students);
  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({
      error: 'Failed to get teacher students',
    });
  }
};

/**
 * 학생을 선생님에게 배정 (관리자 전용)
 * POST /api/admin/assign-student
 */
export const assignStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({
        error: 'Admin access required',
      });
      return;
    }

    const { studentId, teacherId } = req.body;

    if (!studentId || !teacherId) {
      res.status(400).json({
        error: 'Student ID and teacher ID are required',
      });
      return;
    }

    // 학생 확인
    const student = await prisma.users.findUnique({
      where: { id: studentId },
      include: { student_profiles_student_profiles_user_idTousers: true },
    });

    if (!student || student.role !== 'student') {
      res.status(404).json({
        error: 'Student not found',
      });
      return;
    }

    // 이미 프로필이 있는지 확인
    if (student.student_profiles_student_profiles_user_idTousers) {
      res.status(400).json({
        error: 'Student already has a teacher assigned',
      });
      return;
    }

    // 선생님 확인
    const teacher = await prisma.users.findUnique({
      where: { id: teacherId, role: 'teacher' },
    });

    if (!teacher) {
      res.status(404).json({
        error: 'Teacher not found',
      });
      return;
    }

    // student_profile 생성
    const { randomUUID } = require('crypto');
    const profile = await prisma.student_profiles.create({
      data: {
        id: randomUUID(),
        user_id: studentId,
        teacher_id: teacherId,
        start_date: new Date(),
        updated_at: new Date(),
      },
      include: {
        users_student_profiles_user_idTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        users_student_profiles_teacher_idTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Student assigned successfully',
      profile,
    });
  } catch (error) {
    console.error('Assign student error:', error);
    res.status(500).json({
      error: 'Failed to assign student',
    });
  }
};

/**
 * 학생을 특정 선생님에게 재할당 (관리자 전용)
 * PUT /api/admin/reassign-student
 */
export const reassignStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({
        error: 'Admin access required',
      });
      return;
    }

    const { studentProfileId, newTeacherId } = req.body;

    if (!studentProfileId || !newTeacherId) {
      res.status(400).json({
        error: 'Student profile ID and new teacher ID are required',
      });
      return;
    }

    // 선생님 확인
    const teacher = await prisma.users.findUnique({
      where: { id: newTeacherId, role: 'teacher' },
    });

    if (!teacher) {
      res.status(404).json({
        error: 'Teacher not found',
      });
      return;
    }

    // 학생 프로필 업데이트
    const updatedProfile = await prisma.student_profiles.update({
      where: { id: studentProfileId },
      data: {
        teacher_id: newTeacherId,
        updated_at: new Date(),
      },
      include: {
        users_student_profiles_user_idTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        users_student_profiles_teacher_idTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Student reassigned successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Reassign student error:', error);
    res.status(500).json({
      error: 'Failed to reassign student',
    });
  }
};

/**
 * 전체 레슨 목록 조회 (관리자 전용)
 * GET /api/admin/lessons
 */
export const getAllLessons = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({
        error: 'Admin access required',
      });
      return;
    }

    // 시간이 지난 scheduled 레슨들을 자동으로 completed로 변경
    const now = new Date();
    const pastScheduledLessons = await prisma.lessons.findMany({
      where: {
        status: 'scheduled',
      },
      select: {
        id: true,
        scheduled_at: true,
        duration: true,
      },
    });

    const lessonsToComplete = pastScheduledLessons
      .filter(lesson => {
        const lessonEndTime = new Date(lesson.scheduled_at);
        lessonEndTime.setMinutes(lessonEndTime.getMinutes() + lesson.duration);
        return lessonEndTime < now;
      })
      .map(lesson => lesson.id);

    if (lessonsToComplete.length > 0) {
      await prisma.lessons.updateMany({
        where: {
          id: { in: lessonsToComplete },
        },
        data: {
          status: 'completed',
          updated_at: now,
        },
      });
    }

    const { status } = req.query;

    const where: any = {};
    if (status === 'upcoming') {
      where.status = 'scheduled';
      where.scheduled_at = { gte: new Date() };
    } else if (status === 'past') {
      where.status = 'completed';
    } else if (status) {
      where.status = status;
    }

    const lessons = await prisma.lessons.findMany({
      where,
      include: {
        users_lessons_teacher_idTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        users_lessons_student_idTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        feedbacks: {
          select: {
            id: true,
            rating: true,
            content: true,
          },
        },
      },
      orderBy: {
        scheduled_at: 'desc',
      },
    });

    res.json(lessons);
  } catch (error) {
    console.error('Get all lessons error:', error);
    res.status(500).json({
      error: 'Failed to get lessons',
    });
  }
};

/**
 * 이번 달 선생님별 레슨 현황 조회 (관리자 전용)
 * GET /api/admin/teacher-lesson-stats
 */
export const getTeacherLessonStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({
        error: 'Admin access required',
      });
      return;
    }

    // 이번 달의 시작과 끝
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 모든 선생님 가져오기
    const teachers = await prisma.users.findMany({
      where: { role: 'teacher' },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    // 각 선생님별 이번 달 레슨 통계
    const teacherStats = await Promise.all(
      teachers.map(async (teacher) => {
        const [completedLessons, scheduledLessons, totalLessons] = await Promise.all([
          prisma.lessons.count({
            where: {
              teacher_id: teacher.id,
              status: 'completed',
              scheduled_at: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          prisma.lessons.count({
            where: {
              teacher_id: teacher.id,
              status: 'scheduled',
              scheduled_at: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          prisma.lessons.count({
            where: {
              teacher_id: teacher.id,
              scheduled_at: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
        ]);

        return {
          teacherId: teacher.id,
          teacherName: teacher.name,
          completedLessons,
          scheduledLessons,
          totalLessons,
        };
      })
    );

    res.json({
      month: `${now.getFullYear()}년 ${now.getMonth() + 1}월`,
      stats: teacherStats,
    });
  } catch (error) {
    console.error('Get teacher lesson stats error:', error);
    res.status(500).json({
      error: 'Failed to get teacher lesson statistics',
    });
  }
};

/**
 * 전체 통계 조회 (관리자 전용)
 * GET /api/admin/stats
 */
export const getStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({
        error: 'Admin access required',
      });
      return;
    }

    const totalTeachers = await prisma.users.count({
      where: { role: 'teacher' },
    });

    const totalStudents = await prisma.users.count({
      where: { role: 'student' },
    });

    const activeStudents = await prisma.student_profiles.count({
      where: { is_active: true },
    });

    const unassignedStudents = await prisma.users.count({
      where: {
        role: 'student',
        student_profiles_student_profiles_user_idTousers: null,
      },
    });

    const totalLessons = await prisma.lessons.count();

    // status가 'scheduled'인 모든 레슨을 예정된 레슨으로 카운트
    // (피드백이 작성되었어도 선생님이 완료 버튼을 누르지 않으면 scheduled 상태)
    const upcomingLessons = await prisma.lessons.count({
      where: {
        status: 'scheduled',
      },
    });

    res.json({
      totalTeachers,
      totalStudents,
      activeStudents,
      unassignedStudents,
      totalLessons,
      upcomingLessons,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
    });
  }
};
