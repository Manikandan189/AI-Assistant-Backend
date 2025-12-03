import prisma from '../db/prisma.js';

export const createFile = async (data) => {
    return await prisma.file.create({ data });
};

export const createFiles = async (filesData) => {
    return await prisma.file.createMany({ data: filesData });
};

export const findFilesByProjectId = async (projectId) => {
    return await prisma.file.findMany({ where: { projectId } });
};

export const deleteFile = async (id) => {
    return await prisma.file.delete({ where: { id } });
};

export const findFileById = async (id) => {
    return await prisma.file.findUnique({ where: { id } });
};
