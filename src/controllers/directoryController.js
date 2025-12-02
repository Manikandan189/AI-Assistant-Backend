import fs from 'fs/promises';
import path from 'path';
import { aiService } from '../services/aiService.js';

// Directories to skip during analysis
const SKIP_DIRS = [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    '.cache',
    'coverage',
    '__pycache__',
    '.venv',
    'venv',
    '.idea',
    '.vscode'
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

// Read directory recursively
async function readDirectoryRecursive(dirPath) {
    const files = [];

    async function traverse(currentPath, depth = 0) {
        // No depth limit - analyze everything!

        try {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                const relativePath = path.relative(dirPath, fullPath);

                if (entry.isDirectory()) {
                    // Skip certain directories
                    if (SKIP_DIRS.includes(entry.name)) continue;
                    await traverse(fullPath, depth + 1);
                } else if (entry.isFile()) {
                    // Skip certain file types
                    const ext = path.extname(entry.name).toLowerCase();
                    if (SKIP_EXTENSIONS.includes(ext)) continue;

                    // Get file stats
                    const stats = await fs.stat(fullPath);

                    // No size limit - read all text files!
                    // Only limit is for AI analysis (handled in AI service)

                    // Read file content
                    let content = null;
                    try {
                        content = await fs.readFile(fullPath, 'utf-8');
                    } catch (err) {
                        // Skip binary files or files that can't be read as text
                        continue;
                    }

                    files.push({
                        name: entry.name,
                        path: relativePath,
                        type: 'text/plain',
                        size: stats.size,
                        content: content
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

// Analyze directory without storing files
export const analyzeDirectory = async (req, res, next) => {
    try {
        const { directoryPath, model: modelName } = req.body;

        if (!directoryPath) {
            return res.status(400).json({
                success: false,
                error: 'Directory path is required',
            });
        }

        // Check if directory exists
        try {
            const stats = await fs.stat(directoryPath);
            if (!stats.isDirectory()) {
                return res.status(400).json({
                    success: false,
                    error: 'Path is not a directory',
                });
            }
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Directory not found or not accessible',
            });
        }

        // Read files from directory
        console.log(`Reading directory: ${directoryPath}`);
        const files = await readDirectoryRecursive(directoryPath);

        if (files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No analyzable files found in directory',
            });
        }

        console.log(`Found ${files.length} files to analyze`);

        // Analyze with AI
        const summary = await aiService.analyzeProject(files, modelName);

        res.json({
            success: true,
            data: {
                directoryPath,
                filesAnalyzed: files.length,
                summary,
                model: modelName || 'default',
            },
        });
    } catch (error) {
        console.error('Directory analysis error:', error);
        next(error);
    }
};

// Query directory files without storing
export const queryDirectory = async (req, res, next) => {
    try {
        const { directoryPath, query: userQuery, model: modelName } = req.body;

        if (!directoryPath || !userQuery) {
            return res.status(400).json({
                success: false,
                error: 'Directory path and query are required',
            });
        }

        // Check if directory exists
        try {
            const stats = await fs.stat(directoryPath);
            if (!stats.isDirectory()) {
                return res.status(400).json({
                    success: false,
                    error: 'Path is not a directory',
                });
            }
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Directory not found or not accessible',
            });
        }

        // Read files from directory
        const files = await readDirectoryRecursive(directoryPath);

        if (files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No analyzable files found in directory',
            });
        }

        // Get directory name for context
        const dirName = path.basename(directoryPath);

        // Query with AI
        const response = await aiService.queryWithContext(userQuery, files, dirName, modelName);

        res.json({
            success: true,
            data: {
                query: userQuery,
                response,
                filesAnalyzed: files.length,
                model: modelName || 'default',
            },
        });
    } catch (error) {
        console.error('Directory query error:', error);
        next(error);
    }
};
