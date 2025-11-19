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
    if (!name || !email || !password || !role) {
      console.log('Missing fields:', { name: !!name, email: !!email, password: !!password, role: !!role });
      res.status(400).json({
        error: 'Name, email, password, and role are required',
      });
      return;
    }

    if (role !== 'teacher' && role !== 'student') {
      res.status(400).json({
        error: 'Role must be either teacher or student',
      });
      return;
    }

    // 이메일 중복 확인
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        error: 'Email already exists',
      });
      return;
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    // 사용자 생성 (학생은 프로필 없이 생성, 나중에 선생님이 할당)
    const user = await prisma.users.create({
      data: {
        id: randomUUID(),
        email,
        name,
        password: hashedPassword,
        role,
        phone,
        updated_at: new Date(),
      },
    });

    // JWT 토큰 생성
    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
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
    const { email, password, role } = req.body;

    // 입력 검증
    if (!email || !password || !role) {
      res.status(400).json({
        error: 'Email, password, and role are required',
      });
      return;
    }

    // 사용자 조회
    const user = await prisma.users.findUnique({
      where: { email },
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
