import * as projectDao from '../dao/projectDao.js';
import * as fileDao from '../dao/fileDao.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { validateRequiredFields } from '../utils/validation.js';

export const getProjects = async (req, res) => {
    try {
        const projects = await projectDao.findProjectsByUserId(req.user.id);
        sendSuccess(res, projects);
    } catch (error) {
        console.error('Get projects error:', error);
        sendError(res, 500, 'Failed to fetch projects');
    }
};

export const getProject = async (req, res) => {
    try {
        const project = await projectDao.findProjectById(req.params.id);
        if (!project) return sendError(res, 404, 'Project not found');
        if (project.userId !== req.user.id) return sendError(res, 403, 'Unauthorized');
        sendSuccess(res, project);
    } catch (error) {
        console.error('Get project error:', error);
        sendError(res, 500, 'Failed to fetch project');
    }
};

export const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const validation = validateRequiredFields(req.body, ['name']);
        if (!validation.valid) return sendError(res, 400, `Missing fields: ${validation.missing.join(', ')}`);

        const project = await projectDao.createProject({
            name,
            description,
            userId: req.user.id
        });
        sendSuccess(res, project, 201);
    } catch (error) {
        console.error('Create project error:', error);
        sendError(res, 500, 'Failed to create project');
    }
};

export const updateProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const project = await projectDao.findProjectById(req.params.id);
        if (!project) return sendError(res, 404, 'Project not found');
        if (project.userId !== req.user.id) return sendError(res, 403, 'Unauthorized');

        const updatedProject = await projectDao.updateProject(req.params.id, { name, description });
        sendSuccess(res, updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        sendError(res, 500, 'Failed to update project');
    }
};

export const deleteProject = async (req, res) => {
    try {
        const project = await projectDao.findProjectById(req.params.id);
        if (!project) return sendError(res, 404, 'Project not found');
        if (project.userId !== req.user.id) return sendError(res, 403, 'Unauthorized');

        await projectDao.deleteProject(req.params.id);
        sendSuccess(res, { message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        sendError(res, 500, 'Failed to delete project');
    }
};

export const getProjectFiles = async (req, res) => {
    try {
        const project = await projectDao.findProjectById(req.params.id);
        if (!project) return sendError(res, 404, 'Project not found');
        if (project.userId !== req.user.id) return sendError(res, 403, 'Unauthorized');

        const files = await fileDao.findFilesByProjectId(req.params.id);
        sendSuccess(res, files);
    } catch (error) {
        console.error('Get project files error:', error);
        sendError(res, 500, 'Failed to fetch project files');
    }
};
