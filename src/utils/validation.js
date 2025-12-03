import fs from 'fs/promises';

/**
 * Validation utilities
 */

/**
 * Check if a path exists and is a directory
 * @param {string} dirPath - Path to check
 * @returns {Promise<{valid: boolean, error: string|null}>}
 */
export const validateDirectory = async (dirPath) => {
    try {
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
            return { valid: false, error: 'Path is not a directory' };
        }
        return { valid: true, error: null };
    } catch (error) {
        return { valid: false, error: 'Directory not found or not accessible' };
    }
};

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array<string>} fields - Required field names
 * @returns {{valid: boolean, missing: Array<string>}}
 */
export const validateRequiredFields = (body, fields) => {
    const missing = fields.filter(field => !body[field]);
    return {
        valid: missing.length === 0,
        missing
    };
};
