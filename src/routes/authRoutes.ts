import { Router } from 'express';
import { signup, login, me, logout } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// 회원가입
router.post('/signup', signup);

// 로그인
router.post('/login', login);

// 현재 사용자 정보 (인증 필요)
router.get('/me', authenticate, me);

// 로그아웃
router.post('/logout', authenticate, logout);

export default router;
