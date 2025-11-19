import { Request, Response } from 'express';

/**
 * 단일 파일 업로드
 */
export const uploadSingle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' },
      });
      return;
    }

    const file = req.file as Express.MulterS3.File;

    res.json({
      success: true,
      data: {
        file: {
          fieldName: file.fieldname,
          originalName: file.originalname,
          filename: file.key,
          mimetype: file.mimetype,
          size: file.size,
          url: file.location,
          key: file.key,
        },
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'File upload failed' },
    });
  }
};

/**
 * 다중 파일 업로드
 */
export const uploadMultiple = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        error: { message: 'No files uploaded' },
      });
      return;
    }

    const files = req.files as Express.MulterS3.File[];

    res.json({
      success: true,
      data: {
        files: files.map((file) => ({
          fieldName: file.fieldname,
          originalName: file.originalname,
          filename: file.key,
          mimetype: file.mimetype,
          size: file.size,
          url: file.location,
          key: file.key,
        })),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'File upload failed' },
    });
  }
};
