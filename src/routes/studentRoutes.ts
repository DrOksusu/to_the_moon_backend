import { Router } from 'express';
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getUnassignedStudents,
  assignStudent,
} from '../controllers/studentController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authenticate);

// 미배정 학생 목록 조회
router.get('/unassigned', getUnassignedStudents);

// 학생 할당
router.post('/assign', assignStudent);

// 학생 목록 조회
router.get('/', getStudents);

// 학생 상세 정보
router.get('/:id', getStudent);

// 학생 등록
router.post('/', createStudent);

// 학생 정보 수정
router.put('/:id', updateStudent);

// 학생 삭제
router.delete('/:id', deleteStudent);

export default router;
