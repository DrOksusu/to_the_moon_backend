import { Router } from 'express';
import {
  getFeedbacks,
  getFeedback,
  createFeedback,
  updateFeedback,
  addStudentReaction,
} from '../controllers/feedbackController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authenticate);

// 피드백 목록 조회
router.get('/', getFeedbacks);

// 피드백 상세 정보
router.get('/:id', getFeedback);

// 피드백 작성
router.post('/', createFeedback);

// 피드백 수정
router.put('/:id', updateFeedback);

// 학생 반응 추가
router.patch('/:id/reaction', addStudentReaction);

export default router;
