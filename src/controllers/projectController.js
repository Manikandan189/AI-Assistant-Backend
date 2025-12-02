import { query } from '../config/database.js';

// Get all projects for user
export const getProjects = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT p.*, COUNT(f.id) as file_count 
       FROM projects p 
       LEFT JOIN files f ON p.id = f.project_id 
       WHERE p.user_id = $1 
       GROUP BY p.id 
       ORDER BY p.updated_at DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        next(error);
    }
};

// Get single project
export const getProject = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT p.*, COUNT(f.id) as file_count 
       FROM projects p 
       LEFT JOIN files f ON p.id = f.project_id 
       WHERE p.id = $1 AND p.user_id = $2 
       GROUP BY p.id`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

// Create project
export const createProject = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Project name is required',
            });
        }

        const result = await query(
            'INSERT INTO projects (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, name, description]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

// Update project
export const updateProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        const result = await query(
            `UPDATE projects 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description), 
           status = COALESCE($3, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
            [name, description, status, id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

// Delete project
export const deleteProject = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        res.json({
            success: true,
            message: 'Project deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// Get project files
export const getProjectFiles = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verify project belongs to user
        const projectCheck = await query(
            'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        const result = await query(
            'SELECT * FROM files WHERE project_id = $1 ORDER BY path',
            [id]
        );

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        next(error);
    }
};
