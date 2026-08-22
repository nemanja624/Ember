import bcrypt from "bcrypt";
import { prisma } from "../shared/prisma.js";

export async function registerUser(email: string, password: string, name: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if(existingUser) {
        throw new Error("USER_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return prisma.user.create({ 
        data: { email, passwordHash, name },
    });
    
}