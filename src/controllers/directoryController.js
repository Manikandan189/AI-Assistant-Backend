import fs from 'fs/promises';
import path from 'path';
import { aiService } from '../services/aiService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { validateDirectory, validateRequiredFields } from '../utils/validation.js';

// Directories to skip during analysis
const SKIP_DIRS = [
    'node_modules', '.git', '.next', 'dist', 'build',
    '.cache', 'coverage', '__pycache__', '.venv', 'venv',
    '.idea', '.vscode'
];

// File extensions to skip
const SKIP_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
    '.mp4', '.avi', '.mov', '.wmv', '.flv',
    '.mp3', '.wav', '.ogg', '.flac',
    '.zip', '.tar', '.gz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx'
];

/**
 * Read directory recursively and return all text files
 * @param {string} dirPath - Directory path to read
 * @returns {Promise<Array>} Array of file objects
 */
async function readDirectoryRecursive(dirPath) {
    const files = [];

    async function traverse(currentPath) {
        try {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                const relativePath = path.relative(dirPath, fullPath);

                if (entry.isDirectory()) {
                    if (SKIP_DIRS.includes(entry.name)) continue;
                    await traverse(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (SKIP_EXTENSIONS.includes(ext)) continue;

                    const stats = await fs.stat(fullPath);

                    // Read file content
                    let content = null;
                    try {
                        content = await fs.readFile(fullPath, 'utf-8');
                    } catch (err) {
                        continue; // Skip binary files
                    }

                    files.push({
                        name: entry.name,
                        path: relativePath,
                        type: 'text/plain',
                        size: stats.size,
                        content
                    });
                }
            }
        } catch (error) {
            console.error(`Error reading directory ${currentPath}:`, error.message);
        }
    }

    await traverse(dirPath);
    return files;
}

/**
 * Analyze directory without storing files
 * @route POST /api/directory/analyze
 */
export const analyzeDirectory = async (req, res, next) => {
    try {
        const { directoryPath, model: modelName } = req.body;

        // Validate required fields
        const validation = validateRequiredFields(req.body, ['directoryPath']);
        if (!validation.valid) {
            return sendError(res, 400, 'Directory path is required');
        }

        // Validate directory
        const dirValidation = await validateDirectory(directoryPath);
        if (!dirValidation.valid) {
            return sendError(res, 400, dirValidation.error);
        }

        // Read files from directory
        console.log(`Reading directory: ${directoryPath}`);
        const files = await readDirectoryRecursive(directoryPath);

        if (files.length === 0) {
            return sendError(res, 400, 'No analyzable files found in directory');
        }

        console.log(`Found ${files.length} files to analyze`);

        // Analyze with AI
        console.log('Calling AI service with model:', modelName);
        const summary = await aiService.analyzeProject(files, modelName);
        console.log('AI analysis complete');

        return sendSuccess(res, {
            directoryPath,
            filesAnalyzed: files.length,
            summary,
            model: modelName || 'default'
        });
    } catch (error) {
        console.error('Directory analysis error:', error);
        console.error('Error stack:', error.stack);
        next(error);
    }
};

/**
 * Query directory files without storing
 * @route POST /api/directory/query
 */
export const queryDirectory = async (req, res, next) => {
    try {
        const { directoryPath, query: userQuery, model: modelName } = req.body;

        // Validate required fields
        const validation = validateRequiredFields(req.body, ['directoryPath', 'query']);
        if (!validation.valid) {
            return sendError(res, 400, `Missing required fields: ${validation.missing.join(', ')}`);
        }

        // Validate directory
        const dirValidation = await validateDirectory(directoryPath);
        if (!dirValidation.valid) {
            return sendError(res, 400, dirValidation.error);
        }

        // Read files from directory
        const files = await readDirectoryRecursive(directoryPath);

        if (files.length === 0) {
            return sendError(res, 400, 'No analyzable files found in directory');
        }

        // Get directory name for context
        const dirName = path.basename(directoryPath);

        // Query with AI
        const response = await aiService.queryWithContext(userQuery, files, dirName, modelName);

        return sendSuccess(res, {
            query: userQuery,
            response,
            filesAnalyzed: files.length,
            model: modelName || 'default'
        });
    } catch (error) {
        console.error('Directory query error:', error);
        next(error);
    }
};
