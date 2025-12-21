import { Request, Response } from 'express';
import prisma from '../config/database';
import { randomUUID } from 'crypto';

/**
 * 수업 목록 조회
 * GET /api/lessons
 */
export const getLessons = async (
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

    const { status, from_date, to_date } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // 시간이 지난 scheduled 레슨들을 자동으로 completed로 변경
    const now = new Date();
    const pastScheduledLessons = await prisma.lessons.findMany({
      where: {
        status: 'scheduled',
        ...(userRole === 'teacher' ? { teacher_id: userId } : { student_id: userId }),
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

    // 조건 설정
    const where: any = {};

    // 역할에 따라 필터링
    if (userRole === 'teacher') {
      where.teacher_id = userId;
    } else {
      where.student_id = userId;
    }

    // 상태 필터
    if (status) {
      where.status = status;
    }

    // 날짜 범위 필터
    if (from_date || to_date) {
      where.scheduled_at = {};
      if (from_date) {
        where.scheduled_at.gte = new Date(from_date as string);
      }
      if (to_date) {
        where.scheduled_at.lte = new Date(to_date as string);
      }
    }

    const lessons = await prisma.lessons.findMany({
      where,
      include: {
        users_lessons_teacher_idTousers: {
          select: {
            id: true,
            name: true,
          },
        },
        users_lessons_student_idTousers: {
          select: {
            id: true,
            name: true,
          },
        },
        feedbacks: {
          select: {
            id: true,
            rating: true,
            student_reaction: true,
            student_message: true,
            student_reacted_at: true,
          },
        },
      },
      orderBy: {
        scheduled_at: 'desc',
      },
    });

    res.json(lessons.map(lesson => {
      const { users_lessons_teacher_idTousers, users_lessons_student_idTousers, feedbacks, ...lessonData } = lesson;
      return {
        ...lessonData,
        teacher: users_lessons_teacher_idTousers,
        student: users_lessons_student_idTousers,
        feedback: feedbacks,
      };
    }));
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({
      error: 'Failed to get lessons',
    });
  }
};

/**
 * 수업 상세 정보
 * GET /api/lessons/:id
 */
export const getLesson = async (
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

    const lesson = await prisma.lessons.findFirst({
      where: {
        id,
        OR: [{ teacher_id: userId }, { student_id: userId }],
      },
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
        feedbacks: true,
      },
    });

    if (!lesson) {
      res.status(404).json({
        error: 'Lesson not found',
      });
      return;
    }

    res.json({
      ...lesson,
      teacher: lesson.users_lessons_teacher_idTousers,
      student: lesson.users_lessons_student_idTousers,
      feedback: lesson.feedbacks,
    });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({
      error: 'Failed to get lesson',
    });
  }
};

/**
 * 수업 등록 (선생님 전용)
 * POST /api/lessons
 */
export const createLesson = async (
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

    const { student_id, title, date, time, scheduled_at: scheduledAtInput, duration, location, notes } =
      req.body;

    // 입력 검증: scheduled_at이 있으면 date/time은 필요 없음
    if (!student_id || (!scheduledAtInput && (!date || !time))) {
      res.status(400).json({
        error: 'Student ID and scheduled_at (or date and time) are required',
      });
      return;
    }

    // scheduled_at 생성: scheduled_at이 직접 전달되면 그것을 사용, 아니면 date + time으로 생성
    const scheduled_at = scheduledAtInput
      ? new Date(scheduledAtInput)
      : new Date(`${date}T${time}`);

    const lesson = await prisma.lessons.create({
      data: {
        id: randomUUID(),
        teacher_id: req.user.userId,
        student_id,
        title,
        scheduled_at,
        duration: duration || 60,
        location,
        notes,
        status: 'scheduled',
        updated_at: new Date(),
      },
    });

    res.status(201).json(lesson);
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({
      error: 'Failed to create lesson',
    });
  }
};

/**
 * 수업 수정 (선생님 전용)
 * PUT /api/lessons/:id
 */
export const updateLesson = async (
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
    const { date, time, scheduled_at: scheduledAtInput, student_id, duration, status, notes, title, location } = req.body;
    const teacherId = req.user.userId;

    // 해당 선생님의 수업인지 확인
    const existingLesson = await prisma.lessons.findFirst({
      where: {
        id,
        teacher_id: teacherId,
      },
    });

    if (!existingLesson) {
      res.status(404).json({
        error: 'Lesson not found',
      });
      return;
    }

    // scheduled_at 생성: scheduled_at이 직접 전달되면 그것을 사용, 아니면 date + time으로 생성
    let scheduled_at;
    if (scheduledAtInput) {
      scheduled_at = new Date(scheduledAtInput);
    } else if (date && time) {
      scheduled_at = new Date(`${date}T${time}`);
    }

    // 수업 업데이트 데이터 준비
    const updateData: any = {
      updated_at: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (scheduled_at) updateData.scheduled_at = scheduled_at;
    if (duration !== undefined) updateData.duration = duration;
    if (status !== undefined) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;
    if (student_id !== undefined) updateData.student_id = student_id;

    // 수업 업데이트
    const updatedLesson = await prisma.lessons.update({
      where: { id },
      data: updateData,
    });

    res.json(updatedLesson);
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({
      error: 'Failed to update lesson',
    });
  }
};

/**
 * 수업 삭제 (선생님 전용)
 * DELETE /api/lessons/:id
 */
export const deleteLesson = async (
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

    // 해당 선생님의 수업인지 확인
    const existingLesson = await prisma.lessons.findFirst({
      where: {
        id,
        teacher_id: teacherId,
      },
    });

    if (!existingLesson) {
      res.status(404).json({
        error: 'Lesson not found',
      });
      return;
    }

    // 수업 삭제
    await prisma.lessons.delete({
      where: { id },
    });

    res.json({
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({
      error: 'Failed to delete lesson',
    });
  }
};

/**
 * 수업 취소 (선생님 전용)
 * PATCH /api/lessons/:id/cancel
 */
export const cancelLesson = async (
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

    // 해당 선생님의 수업인지 확인
    const existingLesson = await prisma.lessons.findFirst({
      where: {
        id,
        teacher_id: teacherId,
      },
    });

    if (!existingLesson) {
      res.status(404).json({
        error: 'Lesson not found',
      });
      return;
    }

    // 상태를 cancelled로 변경
    const updatedLesson = await prisma.lessons.update({
      where: { id },
      data: {
        status: 'cancelled',
        updated_at: new Date(),
      },
    });

    res.json({
      id: updatedLesson.id,
      status: updatedLesson.status,
    });
  } catch (error) {
    console.error('Cancel lesson error:', error);
    res.status(500).json({
      error: 'Failed to cancel lesson',
    });
  }
};

/**
 * 레슨의 피드백 조회
 * GET /api/lessons/:id/feedback
 */
export const getLessonFeedback = async (
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

    // 피드백 조회
    const feedback = await prisma.feedbacks.findUnique({
      where: {
        lesson_id: id,
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
    console.error('Get lesson feedback error:', error);
    res.status(500).json({
      error: 'Failed to get lesson feedback',
    });
  }
};
