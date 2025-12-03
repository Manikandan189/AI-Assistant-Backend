import prisma from '../db/prisma.js';

export const createUser = async (data) => {
    return await prisma.user.create({ data });
};

export const findUserByEmail = async (email) => {
    return await prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (id) => {
    return await prisma.user.findUnique({ where: { id } });
};
