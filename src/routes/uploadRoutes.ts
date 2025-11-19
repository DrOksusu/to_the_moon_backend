import { Router } from 'express';
import { uploadSingle, uploadMultiple } from '../controllers/uploadController';
import { upload } from '../middlewares/upload';
import { authenticate } from '../middlewares/auth';

const router = Router();

// 단일 파일 업로드 (인증 필요)
router.post('/single', authenticate, upload.single('file'), uploadSingle);

// 다중 파일 업로드 (인증 필요, 최대 10개)
router.post('/multiple', authenticate, upload.array('files', 10), uploadMultiple);

export default router;
