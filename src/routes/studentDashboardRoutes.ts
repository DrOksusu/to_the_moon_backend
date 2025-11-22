import express from 'express';
import {
  getStudentDashboard,
  getStudentProfile,
} from '../controllers/studentDashboardController';

const router = express.Router();

// 학생 대시보드 데이터
router.get('/dashboard', getStudentDashboard);

// 학생 프로필
router.get('/profile', getStudentProfile);

export default router;
