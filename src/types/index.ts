import { Request } from 'express';
import { JwtPayload } from '../utils/jwt';

// Express Request 확장
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// 페이지네이션 쿼리
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 파일 업로드 정보
export interface FileUploadInfo {
  fieldName: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  key: string;
}
