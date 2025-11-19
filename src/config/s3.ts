import { S3Client } from '@aws-sdk/client-s3';

// AWS S3 클라이언트 설정
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export default s3Client;

// S3 설정 상수
export const S3_CONFIG = {
  bucketName: process.env.S3_BUCKET_NAME || '',
  region: process.env.AWS_REGION || 'ap-northeast-2',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/svg+xml')
    .split(',')
    .map((type) => type.trim()),
};
