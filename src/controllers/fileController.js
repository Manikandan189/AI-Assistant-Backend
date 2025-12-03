import multer from 'multer';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { config } from '../config/config.js';
import * as fileDao from '../dao/fileDao.js';
import * as projectDao from '../dao/projectDao.js';
import { aiService } from '../services/aiService.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Ensure upload directory exists
if (!fs.existsSync(config.upload.uploadDir)) {
    fs.mkdirSync(config.upload.uploadDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.upload.uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${Date.now()}-${sanitized}`);
    }
});

export const upload = multer({
    storage,
    limits: { fileSize: config.upload.maxFileSize }
});

export const uploadFiles = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await projectDao.findProjectById(projectId);
        if (!project) return sendError(res, 404, 'Project not found');
        if (project.userId !== req.user.id) return sendError(res, 403, 'Unauthorized');

        if (!req.files || req.files.length === 0) {
            return sendError(res, 400, 'No files uploaded');
        }

        const filesData = await Promise.all(req.files.map(async (file) => {
            // Read file content if text
            let content = null;
            const ext = path.extname(file.originalname).toLowerCase();
            if (file.mimetype.startsWith('text/') ||
                ['.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.html', '.css', '.py', '.java', '.c', '.cpp', '.h', '.sql', '.prisma'].includes(ext)) {
                try {
                    content = await fsPromises.readFile(file.path, 'utf-8');
                } catch (err) {
                    console.warn(`Failed to read content of ${file.originalname}:`, err);
                }
            }

            return {
                name: file.originalname,
                path: file.path,
                type: file.mimetype,
                size: file.size,
                projectId,
                content
            };
        }));

        console.log('Creating files in database:', filesData.length, 'files');
        const createdFiles = await fileDao.createFiles(filesData);
        console.log('Files created successfully:', createdFiles);

        // Prisma @updatedAt handles this automatically, but we can trigger it by updating
        await projectDao.updateProject(projectId, {});

        sendSuccess(res, { message: `${filesData.length} files uploaded successfully`, count: createdFiles.count }, 201);
    } catch (error) {
        console.error('Upload files error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        sendError(res, 500, error.message || 'Failed to upload files');
    }
};

export const deleteFile = async (req, res) => {
    try {
        const file = await fileDao.findFileById(req.params.id);
        if (!file) return sendError(res, 404, 'File not found');

        const project = await projectDao.findProjectById(file.projectId);
        if (project.userId !== req.user.id) return sendError(res, 403, 'Unauthorized');

        // Delete from disk
        try {
            await fsPromises.unlink(file.path);
        } catch (err) {
            console.warn(`Failed to delete file from disk: ${file.path}`, err);
        }

        await fileDao.deleteFile(req.params.id);
        sendSuccess(res, { message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        sendError(res, 500, 'Failed to delete file');
    }
};

export const analyzeProjectFiles = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { model } = req.body;

        const project = await projectDao.findProjectById(projectId);
        if (!project) return sendError(res, 404, 'Project not found');
        if (project.userId !== req.user.id) return sendError(res, 403, 'Unauthorized');

        const files = await fileDao.findFilesByProjectId(projectId);
        if (files.length === 0) return sendError(res, 400, 'No files to analyze');

        // Filter for text files/content
        const analyzableFiles = files.filter(f => f.content);

        if (analyzableFiles.length === 0) return sendError(res, 400, 'No analyzable text files found');

        const summary = await aiService.analyzeProject(analyzableFiles, model);
        sendSuccess(res, { summary });
    } catch (error) {
        console.error('Analyze project error:', error);
        sendError(res, 500, 'Failed to analyze project');
    }
};

export const queryProject = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { query, model } = req.body;

        if (!query) return sendError(res, 400, 'Query is required');

        const project = await projectDao.findProjectById(projectId);
        if (!project) return sendError(res, 404, 'Project not found');
        if (project.userId !== req.user.id) return sendError(res, 403, 'Unauthorized');

        const files = await fileDao.findFilesByProjectId(projectId);
        const analyzableFiles = files.filter(f => f.content);

        const response = await aiService.queryWithContext(analyzableFiles, query, model);
        sendSuccess(res, { response });
    } catch (error) {
        console.error('Query project error:', error);
        sendError(res, 500, 'Failed to query project');
    }
};

export const analyzeFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const { model } = req.body;

        const file = await fileDao.findFileById(fileId);
        if (!file) return sendError(res, 404, 'File not found');

        const project = await projectDao.findProjectById(file.projectId);
        if (project.userId !== req.user.id) return sendError(res, 403, 'Unauthorized');

        if (!file.content) return sendError(res, 400, 'File content is not available or not text');

        const analysis = await aiService.analyzeFile(file, model);
        sendSuccess(res, { analysis });
    } catch (error) {
        console.error('Analyze file error:', error);
        sendError(res, 500, 'Failed to analyze file');
    }
};
