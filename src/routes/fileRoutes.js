import express from 'express';
import { upload, uploadFiles, deleteFile, analyzeFile, analyzeProjectFiles, queryProject } from '../controllers/fileController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/projects/:id/upload', upload.array('files', 1000), uploadFiles);
router.post('/projects/:id/analyze', analyzeProjectFiles);
router.post('/projects/:id/query', queryProject);
router.post('/:id/analyze', analyzeFile);
router.delete('/:id', deleteFile);

export default router;
