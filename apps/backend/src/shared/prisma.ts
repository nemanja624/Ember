import { Prisma, PrismaClient } from "@prisma/client/extension";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URK!,
});

export const prisma = new PrismaClient({ adapter });