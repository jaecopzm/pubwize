/**
 * Database client - Neon/Prisma (replaces Firebase Admin)
 */
export { prisma } from "@/lib/prisma";

// Stub - auth is handled by Clerk
export const adminAuth = () => { throw new Error("Use Clerk for auth"); };
