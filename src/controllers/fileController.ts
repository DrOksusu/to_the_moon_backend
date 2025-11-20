import { Request, Response } from 'express';
import prisma from '../config/database';
import { randomUUID } from 'crypto';

/**
 * 파일 목록 조회
 * GET /api/files
 */
export const getFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
      });
      return;
    }

    const { student_id, file_type } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // 조건 설정
    const where: any = {};

    // 역할에 따라 필터링
    if (userRole === 'teacher') {
      where.uploader_id = userId;
      if (student_id) {
        where.student_id = student_id as string;
      }
    } else {
      // 학생은 자신에게 공유된 파일과 전체 공유 파일 조회
      where.OR = [
        { student_id: userId },
        { student_id: null }, // 전체 공유
      ];
    }

    // 파일 타입 필터
    if (file_type) {
      where.file_type = {
        startsWith: file_type as string,
      };
    }

    const files = await prisma.files.findMany({
      where,
      include: {
        users_files_uploader_idTousers: {
          select: {
            id: true,
            name: true,
          },
        },
        users_files_student_idTousers: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        uploaded_at: 'desc',
      },
    });

    res.json(files);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      error: 'Failed to get files',
    });
  }
};

/**
 * 파일 업로드
 * POST /api/files/upload
 */
export const uploadFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        error: 'No file uploaded',
      });
      return;
    }

    const file = req.file as Express.MulterS3.File;
    const { student_id, description } = req.body;

    // 파일 정보 저장
    const savedFile = await prisma.files.create({
      data: {
        id: randomUUID(),
        uploader_id: req.user.userId,
        student_id: student_id || null,
        file_type: file.mimetype,
        file_name: file.key,
        original_name: file.originalname,
        file_size: BigInt(file.size),
        file_url: file.location,
        description,
      },
    });

    res.status(201).json({
      id: savedFile.id,
      file_type: savedFile.file_type,
      file_name: savedFile.file_name,
      original_name: savedFile.original_name,
      file_size: Number(savedFile.file_size),
      file_url: savedFile.file_url,
      uploaded_at: savedFile.uploaded_at,
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      error: 'File upload failed',
    });
  }
};

/**
 * 파일 다운로드
 * GET /api/files/:id/download
 */
export const downloadFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // 파일 조회 (권한 확인)
    const file = await prisma.files.findFirst({
      where: {
        id,
        OR: [
          { uploader_id: userId }, // 업로더
          { student_id: userId }, // 학생
          { student_id: null }, // 전체 공유
        ],
      },
    });

    if (!file) {
      res.status(404).json({
        error: 'File not found',
      });
      return;
    }

    // S3 URL로 리다이렉트
    res.redirect(file.file_url);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      error: 'Failed to download file',
    });
  }
};

/**
 * 파일 삭제
 * DELETE /api/files/:id
 */
export const deleteFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // 업로더인지 확인
    const file = await prisma.files.findFirst({
      where: {
        id,
        uploader_id: userId,
      },
    });

    if (!file) {
      res.status(404).json({
        error: 'File not found',
      });
      return;
    }

    // 파일 삭제 (S3에서는 삭제하지 않음 - 필요시 추가)
    await prisma.files.delete({
      where: { id },
    });

    res.json({
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Failed to delete file',
    });
  }
};
