import { Router } from 'express';
import { getTeachers } from '../controllers/teacherController';

const router = Router();

/**
 * GET /api/teachers
 * 선생님 목록 조회 (공개 - 인증 불필요)
 */
router.get('/', getTeachers);

export default router;
