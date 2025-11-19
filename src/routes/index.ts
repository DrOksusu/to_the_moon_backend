import { Router } from 'express';
import authRoutes from './authRoutes';
import teacherRoutes from './teacherRoutes';
import studentRoutes from './studentRoutes';
import lessonRoutes from './lessonRoutes';
import feedbackRoutes from './feedbackRoutes';
import fileRoutes from './fileRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'VocalStudio API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/teachers', teacherRoutes);
router.use('/teacher/students', studentRoutes);
router.use('/lessons', lessonRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/files', fileRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
