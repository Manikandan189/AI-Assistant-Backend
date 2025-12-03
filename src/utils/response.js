/**
 * Standard API response utilities
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {Object} meta - Optional metadata
 */
export const sendSuccess = (res, data, meta = {}) => {
    return res.json({
        success: true,
        data,
        ...(Object.keys(meta).length > 0 && { meta })
    });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} details - Optional error details
 */
export const sendError = (res, statusCode, message, details = null) => {
    return res.status(statusCode).json({
        success: false,
        error: message,
        ...(details && { details })
    });
};
