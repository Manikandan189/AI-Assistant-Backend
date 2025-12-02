import express from 'express';
import { analyzeDirectory, queryDirectory } from '../controllers/directoryController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Analyze directory without storing files
router.post('/analyze', analyzeDirectory);

// Query directory files without storing
router.post('/query', queryDirectory);

export default router;
