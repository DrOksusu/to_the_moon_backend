import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import s3Client, { S3_CONFIG } from '../config/s3';
import path from 'path';

// 파일 필터: 허용된 파일 타입만 업로드
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (S3_CONFIG.allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: ${S3_CONFIG.allowedFileTypes.join(', ')}`
      )
    );
  }
};

// S3 스토리지 설정
const s3Storage = multerS3({
  s3: s3Client as S3Client,
  bucket: S3_CONFIG.bucketName,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (_req, file, cb) => {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
    });
  },
  key: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const filename = `uploads/${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// Multer 설정
export const upload = multer({
  storage: s3Storage,
  limits: {
    fileSize: S3_CONFIG.maxFileSize,
  },
  fileFilter,
});

// 로컬 스토리지 설정 (개발용)
const localStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const uploadLocal = multer({
  storage: localStorage,
  limits: {
    fileSize: S3_CONFIG.maxFileSize,
  },
  fileFilter,
});
