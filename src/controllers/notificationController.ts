import { Request, Response } from 'express';
import prisma from '../config/database';
import { randomUUID } from 'crypto';

/**
 * 알림 목록 조회
 * GET /api/notifications
 */
export const getNotifications = async (
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

    const userId = req.user.userId;
    const { unread_only } = req.query;

    const where: any = {
      user_id: userId,
    };

    if (unread_only === 'true') {
      where.is_read = false;
    }

    const notifications = await prisma.notifications.findMany({
      where,
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            scheduled_at: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 50,
    });

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to get notifications',
    });
  }
};

/**
 * 읽지 않은 알림 개수 조회
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (
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

    const userId = req.user.userId;

    const count = await prisma.notifications.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      error: 'Failed to get unread count',
    });
  }
};

/**
 * 알림 읽음 처리
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (
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

    const notification = await prisma.notifications.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!notification) {
      res.status(404).json({
        error: 'Notification not found',
      });
      return;
    }

    await prisma.notifications.update({
      where: { id },
      data: { is_read: true },
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
    });
  }
};

/**
 * 모든 알림 읽음 처리
 * PATCH /api/notifications/read-all
 */
export const markAllAsRead = async (
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

    const userId = req.user.userId;

    await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: { is_read: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
    });
  }
};

/**
 * 알림 생성 헬퍼 함수
 */
export const createNotification = async (
  userId: string,
  type: 'lesson_created' | 'lesson_updated' | 'lesson_cancelled' | 'teacher_changed' | 'feedback_received',
  title: string,
  message: string,
  relatedLessonId?: string
): Promise<void> => {
  try {
    await prisma.notifications.create({
      data: {
        id: randomUUID(),
        user_id: userId,
        type,
        title,
        message,
        related_lesson_id: relatedLessonId || null,
      },
    });
  } catch (error) {
    console.error('Create notification error:', error);
  }
};
