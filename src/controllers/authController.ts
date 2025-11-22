import { Request, Response } from 'express';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateAccessToken } from '../utils/jwt';
import prisma from '../config/database';
import { randomUUID } from 'crypto';

/**
 * 회원가입
 * POST /api/auth/signup
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    // 디버깅: 받은 데이터 로깅
    console.log('Signup request body:', req.body);

    // 입력 검증
    if (!name || !password || !phone || !role) {
      console.log('Missing fields:', { name: !!name, password: !!password, phone: !!phone, role: !!role });
      res.status(400).json({
        error: 'Name, password, phone, and role are required',
      });
      return;
    }

    if (role !== 'teacher' && role !== 'student') {
      res.status(400).json({
        error: 'Role must be either teacher or student',
      });
      return;
    }

    // 전화번호 중복 확인
    const existingPhone = await prisma.users.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      res.status(400).json({
        error: 'Phone number already exists',
      });
      return;
    }

    // 이메일 중복 확인 (이메일이 제공된 경우)
    if (email) {
      const existingEmail = await prisma.users.findUnique({
        where: { email },
      });

      if (existingEmail) {
        res.status(400).json({
          error: 'Email already exists',
        });
        return;
      }
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    // 학생이 회원가입하는 경우, 사전등록된 정보가 있는지 확인
    let preRegistration = null;
    if (role === 'student') {
      preRegistration = await prisma.student_pre_registrations.findUnique({
        where: { student_phone: phone },
      });
    }

    // 트랜잭션으로 사용자 생성 및 프로필 연결
    const result = await prisma.$transaction(async (tx) => {
      // 사용자 생성
      const user = await tx.users.create({
        data: {
          id: randomUUID(),
          email: email || `${phone}@tothemoon.com`,
          name,
          password: hashedPassword,
          role,
          phone,
          updated_at: new Date(),
        },
      });

      // 학생이고 사전등록 정보가 있으면 자동으로 프로필 생성
      if (role === 'student' && preRegistration) {
        await tx.student_profiles.create({
          data: {
            id: randomUUID(),
            user_id: user.id,
            teacher_id: preRegistration.teacher_id,
            voice_type: preRegistration.voice_type,
            level: preRegistration.level,
            start_date: preRegistration.start_date,
            goals: preRegistration.goals,
            updated_at: new Date(),
          },
        });

        // 사전등록 상태 업데이트
        await tx.student_pre_registrations.update({
          where: { id: preRegistration.id },
          data: {
            is_registered: true,
            updated_at: new Date(),
          },
        });
      }

      return user;
    });

    // JWT 토큰 생성
    const token = generateAccessToken({
      userId: result.id,
      email: result.email,
      role: result.role,
    });

    res.status(201).json({
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
        phone: result.phone,
      },
      token,
      autoMatched: !!preRegistration, // 자동 매칭 여부 반환
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Signup failed',
    });
  }
};

/**
 * 로그인
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password, role } = req.body; // identifier = email 또는 phone

    // 입력 검증
    if (!identifier || !password || !role) {
      res.status(400).json({
        error: 'Email/Phone, password, and role are required',
      });
      return;
    }

    // 이메일 또는 전화번호로 사용자 조회
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
      },
    });

    if (!user) {
      res.status(401).json({
        error: 'Invalid credentials',
      });
      return;
    }

    // 역할 확인
    if (user.role !== role) {
      res.status(401).json({
        error: 'Invalid credentials',
      });
      return;
    }

    // 비밀번호 확인
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      res.status(401).json({
        error: 'Invalid credentials',
      });
      return;
    }

    // JWT 토큰 생성
    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
    });
  }
};

/**
 * 현재 사용자 정보
 * GET /api/auth/me
 */
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
      });
      return;
    }

    const user = await prisma.users.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: 'User not found',
      });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user information',
    });
  }
};

/**
 * 로그아웃
 * POST /api/auth/logout
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  // JWT는 stateless이므로 서버에서 특별한 처리 불필요
  // 클라이언트에서 토큰을 삭제하면 됨
  res.json({
    message: 'Logged out successfully',
  });
};
