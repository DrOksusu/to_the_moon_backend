import { Router } from 'express';
import {
  getFiles,
  uploadFile,
  downloadFile,
  deleteFile,
} from '../controllers/fileController';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authenticate);

// 파일 목록 조회
router.get('/', getFiles);

// 파일 업로드
router.post('/upload', upload.single('file'), uploadFile);

// 파일 다운로드
router.get('/:id/download', downloadFile);

// 파일 삭제
router.delete('/:id', deleteFile);

export default router;
