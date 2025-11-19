import { Router } from 'express';
import {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  cancelLesson,
  getLessonFeedback,
} from '../controllers/lessonController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authenticate);

// 수업 목록 조회
router.get('/', getLessons);

// 레슨의 피드백 조회 (/:id보다 먼저 정의해야 함)
router.get('/:id/feedback', getLessonFeedback);

// 수업 취소 (/:id보다 먼저 정의해야 함)
router.patch('/:id/cancel', cancelLesson);

// 수업 상세 정보
router.get('/:id', getLesson);

// 수업 등록
router.post('/', createLesson);

// 수업 수정
router.put('/:id', updateLesson);

// 수업 삭제
router.delete('/:id', deleteLesson);

export default router;
