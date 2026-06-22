import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    transactionOptions: {
      maxWait: 5000,
      timeout: 10000,
    },
  });
}

const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

async function connectWithRetry(maxRetries = 3, baseDelay = 1000): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await prisma.$connect();
      return;
    } catch (error) {
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Prisma connection attempt ${attempt + 1} failed. Retrying in ${delay}ms...`, error);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

connectWithRetry().catch(console.error);

export { prisma };
