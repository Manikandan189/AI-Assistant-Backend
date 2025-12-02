import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import AdmZip from 'adm-zip';
import { query } from '../config/database.js';
import { config } from '../config/config.js';
import { aiService } from '../services/aiService.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = config.upload.uploadDir;
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.upload.maxFileSize, // 5GB
        files: 1000, // Allow up to 1000 files at once
    },
    fileFilter: (req, file, cb) => {
        // Accept all file types
        cb(null, true);
    },
});

// Upload files to project
export const uploadFiles = async (req, res, next) => {
    try {
        const { id: projectId } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded',
            });
        }

        // Verify project belongs to user
        const projectCheck = await query(
            'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
            [projectId, req.user.id]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        const uploadedFiles = [];

        for (const file of files) {
            // Check if it's a zip file
            if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
                // Extract zip file
                const extractedFiles = await extractZipFile(file.path, projectId);
                uploadedFiles.push(...extractedFiles);
            } else {
                // Read file content
                const content = await fs.readFile(file.path, 'utf-8').catch(() => null);

                // Preserve folder structure if available (from webkitRelativePath)
                // The path will be the original filename or relative path from folder upload
                const filePath = file.originalname;

                // Save file to database
                const result = await query(
                    `INSERT INTO files (project_id, name, path, type, size, content) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [
                        projectId,
                        file.originalname.split('/').pop(), // Just the filename
                        filePath, // Full path including folders
                        file.mimetype,
                        file.size,
                        content,
                    ]
                );

                uploadedFiles.push(result.rows[0]);
            }
        }

        // Update project status
        await query(
            `UPDATE projects SET status = 'idle', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [projectId]
        );

        res.status(201).json({
            success: true,
            data: uploadedFiles,
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
        });
    } catch (error) {
        next(error);
    }
};

// Extract zip file
async function extractZipFile(zipPath, projectId) {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    const extractedFiles = [];

    for (const entry of zipEntries) {
        if (!entry.isDirectory) {
            const content = entry.getData().toString('utf8');
            const fileName = entry.entryName;
            const fileSize = entry.header.size;

            // Save to database
            const result = await query(
                `INSERT INTO files (project_id, name, path, type, size, content) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [
                    projectId,
                    path.basename(fileName),
                    fileName,
                    'text/plain',
                    fileSize,
                    content,
                ]
            );

            extractedFiles.push(result.rows[0]);
        }
    }

    return extractedFiles;
}

// Delete file
export const deleteFile = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verify file belongs to user's project
        const result = await query(
            `DELETE FROM files 
       WHERE id = $1 
       AND project_id IN (SELECT id FROM projects WHERE user_id = $2) 
       RETURNING *`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'File not found',
            });
        }

        // Delete physical file
        const file = result.rows[0];
        await fs.unlink(file.path).catch(() => { });

        res.json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// Analyze a single file
export const analyzeFile = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get file content
        const result = await query(
            `SELECT * FROM files 
             WHERE id = $1 
             AND project_id IN (SELECT id FROM projects WHERE user_id = $2)`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'File not found',
            });
        }

        const file = result.rows[0];

        if (!file.content) {
            // Try to read from disk if content is missing in DB
            try {
                file.content = await fs.readFile(file.path, 'utf-8');
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    error: 'File content not available for analysis',
                });
            }
        }

        // Call Gemini API
        const summary = await aiService.analyzeFile(file.content, file.name);

        // Update database with summary
        await query(
            'UPDATE files SET summary = $1 WHERE id = $2',
            [summary, id]
        );

        res.json({
            success: true,
            data: {
                id: file.id,
                summary,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Analyze all files in a project
export const analyzeProjectFiles = async (req, res, next) => {
    try {
        const { id: projectId } = req.params;
        const { model: modelName } = req.body;

        // Verify project
        const projectCheck = await query(
            'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
            [projectId, req.user.id]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        // Get all files
        const filesResult = await query(
            'SELECT * FROM files WHERE project_id = $1',
            [projectId]
        );

        const files = filesResult.rows;

        if (files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files in project to analyze',
            });
        }

        const summary = await aiService.analyzeProject(files, modelName);

        res.json({
            success: true,
            data: {
                projectId,
                summary,
                model: modelName || 'default',
            },
        });
    } catch (error) {
        next(error);
    }
};

// Query project with AI (conversational)
export const queryProject = async (req, res, next) => {
    try {
        const { id: projectId } = req.params;
        const { query: userQuery, model: modelName } = req.body;

        if (!userQuery) {
            return res.status(400).json({
                success: false,
                error: 'Query is required',
            });
        }

        // Verify project
        const projectCheck = await query(
            'SELECT id, name FROM projects WHERE id = $1 AND user_id = $2',
            [projectId, req.user.id]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        const project = projectCheck.rows[0];

        // Get all files
        const filesResult = await query(
            'SELECT * FROM files WHERE project_id = $1',
            [projectId]
        );

        const files = filesResult.rows;

        if (files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files in project to query. Please upload files first.',
            });
        }

        // Send query to AI with file context and selected model
        const response = await aiService.queryWithContext(userQuery, files, project.name, modelName);

        res.json({
            success: true,
            data: {
                query: userQuery,
                response,
                fileCount: files.length,
                model: modelName || 'default',
            },
        });
    } catch (error) {
        next(error);
    }
};

