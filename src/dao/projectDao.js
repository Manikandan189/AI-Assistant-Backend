import prisma from '../db/prisma.js';

export const createProject = async (data) => {
    return await prisma.project.create({ data });
};

export const findProjectsByUserId = async (userId) => {
    return await prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { files: true } } }
    });
};

export const findProjectById = async (id) => {
    return await prisma.project.findUnique({
        where: { id },
        include: { files: true }
    });
};

export const updateProject = async (id, data) => {
    return await prisma.project.update({
        where: { id },
        data
    });
};

export const deleteProject = async (id) => {
    return await prisma.project.delete({ where: { id } });
};
