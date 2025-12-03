import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import * as userDao from '../dao/userDao.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { validateRequiredFields } from '../utils/validation.js';

export const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const validation = validateRequiredFields(req.body, ['email', 'password']);
        if (!validation.valid) return sendError(res, 400, `Missing fields: ${validation.missing.join(', ')}`);

        const existingUser = await userDao.findUserByEmail(email);
        if (existingUser) return sendError(res, 400, 'User already exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userDao.createUser({ email, password: hashedPassword, name });

        const token = jwt.sign({ userId: user.id, email: user.email }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
        sendSuccess(res, { token, user: { id: user.id, email: user.email, name: user.name } }, 201);
    } catch (error) {
        console.error('Register error:', error);
        sendError(res, 500, 'Registration failed');
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const validation = validateRequiredFields(req.body, ['email', 'password']);
        if (!validation.valid) return sendError(res, 400, `Missing fields: ${validation.missing.join(', ')}`);

        const user = await userDao.findUserByEmail(email);
        if (!user) return sendError(res, 401, 'Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return sendError(res, 401, 'Invalid credentials');

        const token = jwt.sign({ userId: user.id, email: user.email }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
        sendSuccess(res, { token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        console.error('Login error:', error);
        sendError(res, 500, 'Login failed');
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await userDao.findUserById(req.user.id);
        if (!user) return sendError(res, 404, 'User not found');
        sendSuccess(res, { id: user.id, email: user.email, name: user.name });
    } catch (error) {
        console.error('GetMe error:', error);
        sendError(res, 500, 'Failed to fetch user');
    }
};
