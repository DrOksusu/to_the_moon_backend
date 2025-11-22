import { Request, Response } from 'express';
import { hashPassword } from '../utils/bcrypt';
import prisma from '../config/database';
import { randomUUID } from 'crypto';

/**
 * 미배정 학생 목록 조회 (선생님 전용)
 * GET /api/teacher/unassigned-students
 */
export const getUnassignedStudents = async (
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

    // student_profile이 없는 학생들 찾기
    const unassignedStudents = await prisma.users.findMany({
      where: {
        role: 'student',
        student_profiles_student_profiles_user_idTousers: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json(unassignedStudents);
  } catch (error) {
    console.error('Get unassigned students error:', error);
    res.status(500).json({
      error: 'Failed to get unassigned students',
    });
  }
};

/**
 * 학생을 선생님에게 할당
 * POST /api/teacher/assign-student
 */
export const assignStudent = async (
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

    const { student_id } = req.body;
    const teacherId = req.user.userId;

    if (!student_id) {
      res.status(400).json({
        error: 'Student ID is required',
      });
      return;
    }

    // 학생 존재 확인
    const student = await prisma.users.findUnique({
      where: { id: student_id },
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

    // student_profile 생성
    const profile = await prisma.student_profiles.create({
      data: {
        id: randomUUID(),
        user_id: student_id,
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
      },
    });

    res.status(201).json({
      message: 'Student assigned successfully',
      profile: {
        id: profile.id,
        user: profile.users_student_profiles_user_idTousers,
        start_date: profile.start_date,
      },
    });
  } catch (error) {
    console.error('Assign student error:', error);
    res.status(500).json({
      error: 'Failed to assign student',
    });
  }
};

/**
 * 학생 목록 조회 (선생님 전용)
 * GET /api/teacher/students
 */
export const getStudents = async (
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

    const { search } = req.query;
    const teacherId = req.user.userId;

    console.log('getStudents - Teacher ID:', teacherId);

    // 검색 조건
    const where: any = {
      teacher_id: teacherId,
    };

    if (search) {
      where.user = {
        name: {
          contains: search as string,
        },
      };
    }

    console.log('getStudents - Query where:', JSON.stringify(where));

    const students = await prisma.student_profiles.findMany({
      where,
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

    console.log('getStudents - Found students count:', students.length);
    console.log('getStudents - Students data:', JSON.stringify(students, null, 2));

    const result = students.map((profile) => ({
      id: profile.id,
      user: profile.users_student_profiles_user_idTousers,
      voice_type: profile.voice_type,
      level: profile.level,
      start_date: profile.start_date,
      goals: profile.goals,
    }));

    console.log('getStudents - Returning result:', JSON.stringify(result, null, 2));

    res.json(result);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      error: 'Failed to get students',
    });
  }
};

/**
 * 학생 상세 정보 (선생님 전용)
 * GET /api/teacher/students/:id
 */
export const getStudent = async (
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

    const profile = await prisma.student_profiles.findFirst({
      where: {
        id,
        teacher_id: teacherId,
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

    if (!profile) {
      res.status(404).json({
        error: 'Student not found',
      });
      return;
    }

    // 레슨 통계
    const totalLessons = await prisma.lessons.count({
      where: {
        student_id: profile.user_id,
      },
    });

    const completedLessons = await prisma.lessons.count({
      where: {
        student_id: profile.user_id,
        status: 'completed',
      },
    });

    const upcomingLessons = await prisma.lessons.count({
      where: {
        student_id: profile.user_id,
        status: 'scheduled',
        scheduled_at: {
          gte: new Date(),
        },
      },
    });

    res.json({
      id: profile.id,
      user: profile.users_student_profiles_user_idTousers,
      voice_type: profile.voice_type,
      level: profile.level,
      start_date: profile.start_date,
      goals: profile.goals,
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      upcoming_lessons: upcomingLessons,
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      error: 'Failed to get student',
    });
  }
};

/**
 * 학생 사전등록 (선생님 전용)
 * POST /api/teacher/students
 */
export const createStudent = async (
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

    const { name, phone, voice_type, level, start_date, goals } = req.body;

    // 입력 검증
    if (!name || !phone) {
      res.status(400).json({
        error: 'Name and phone are required',
      });
      return;
    }

    // 전화번호 중복 확인 (이미 등록된 사용자인지)
    const existingUser = await prisma.users.findUnique({
      where: { phone },
    });

    if (existingUser) {
      res.status(400).json({
        error: 'Phone number already registered - Student account exists',
      });
      return;
    }

    // 전화번호 중복 확인 (이미 사전등록되었는지)
    const existingPreReg = await prisma.student_pre_registrations.findUnique({
      where: { student_phone: phone },
    });

    if (existingPreReg) {
      res.status(400).json({
        error: 'Phone number already pre-registered - Student will be auto-assigned on signup',
      });
      return;
    }

    // 학생 사전등록 생성
    const preRegistration = await prisma.student_pre_registrations.create({
      data: {
        id: randomUUID(),
        teacher_id: req.user.userId,
        student_name: name,
        student_phone: phone,
        voice_type,
        level,
        start_date: start_date ? new Date(start_date) : new Date(),
        goals,
        is_registered: false,
        updated_at: new Date(),
      },
    });

    res.status(201).json({
      id: preRegistration.id,
      student_name: preRegistration.student_name,
      student_phone: preRegistration.student_phone,
      voice_type: preRegistration.voice_type,
      level: preRegistration.level,
      start_date: preRegistration.start_date,
      is_registered: preRegistration.is_registered,
      message: 'Student pre-registered. They can now sign up with this phone number.',
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      error: 'Failed to pre-register student',
    });
  }
};

/**
 * 학생 정보 수정 (선생님 전용)
 * PUT /api/teacher/students/:id
 */
export const updateStudent = async (
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
    const { voice_type, level, goals } = req.body;
    const teacherId = req.user.userId;

    // 해당 선생님의 학생인지 확인
    const existingProfile = await prisma.student_profiles.findFirst({
      where: {
        id,
        teacher_id: teacherId,
      },
    });

    if (!existingProfile) {
      res.status(404).json({
        error: 'Student not found',
      });
      return;
    }

    // 프로필 업데이트
    const updatedProfile = await prisma.student_profiles.update({
      where: { id },
      data: {
        voice_type,
        level,
        goals,
        updated_at: new Date(),
      },
    });

    res.json({
      id: updatedProfile.id,
      voice_type: updatedProfile.voice_type,
      level: updatedProfile.level,
      goals: updatedProfile.goals,
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      error: 'Failed to update student',
    });
  }
};

/**
 * 학생 삭제 (선생님 전용)
 * DELETE /api/teacher/students/:id
 */
export const deleteStudent = async (
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

    // 해당 선생님의 학생인지 확인
    const existingProfile = await prisma.student_profiles.findFirst({
      where: {
        id,
        teacher_id: teacherId,
      },
    });

    if (!existingProfile) {
      res.status(404).json({
        error: 'Student not found',
      });
      return;
    }

    // 프로필 삭제 (사용자는 CASCADE로 삭제되지 않음)
    await prisma.student_profiles.delete({
      where: { id },
    });

    res.json({
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      error: 'Failed to delete student',
    });
  }
};
