import { Router } from 'express';
import {
  getAllTeachers,
  getAllStudents,
  getTeacherStudents,
  assignStudent,
  reassignStudent,
  getAllLessons,
  getStats,
  getTeacherLessonStats,
} from '../controllers/adminController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 통계
router.get('/stats', getStats);
router.get('/teacher-lesson-stats', getTeacherLessonStats);

// 선생님 관리
router.get('/teachers', getAllTeachers);
router.get('/teacher-students/:teacherId', getTeacherStudents);

// 학생 관리
router.get('/students', getAllStudents);
router.post('/assign-student', assignStudent);
router.put('/reassign-student', reassignStudent);

// 레슨 관리
router.get('/lessons', getAllLessons);

export default router;
