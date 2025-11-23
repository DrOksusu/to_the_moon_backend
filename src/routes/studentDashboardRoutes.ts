import express from 'express';
import {
  getStudentDashboard,
  getStudentProfile,
} from '../controllers/studentDashboardController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 학생 대시보드 데이터
router.get('/dashboard', getStudentDashboard);

// 학생 프로필
router.get('/profile', getStudentProfile);

export default router;
