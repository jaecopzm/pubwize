import { Prisma, type PrismaClient, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_BILLING_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
const RETRYABLE_PRISMA_CODES = new Set(["P2002", "P2025"]);

type EnsureUserInput = {
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};

type EnsureUserResult = {
  user: User;
  created: boolean;
  reconciled: boolean;
};

function normalizeEmail(userId: string, email?: string | null) {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || `${userId}@placeholder.local`;
}

function normalizeString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

async function ensureUserRecordOnce(
  tx: Prisma.TransactionClient | PrismaClient,
  userId: string,
  input: EnsureUserInput
): Promise<EnsureUserResult> {
  const email = normalizeEmail(userId, input.email);
  const displayName = normalizeString(input.displayName);
  const photoURL = normalizeString(input.photoURL);

  const existingById = await tx.user.findUnique({ where: { id: userId } });
  if (existingById) {
    let nextEmail =
      existingById.email.endsWith("@placeholder.local") && !email.endsWith("@placeholder.local")
        ? email
        : existingById.email;

    if (nextEmail !== existingById.email) {
      const existingByEmail = await tx.user.findUnique({ where: { email: nextEmail } });
      if (existingByEmail && existingByEmail.id !== userId) {
        nextEmail = existingById.email;
      }
    }

    const nextDisplayName = displayName ?? existingById.displayName;
    const nextPhotoURL = photoURL ?? existingById.photoURL;

    if (
      nextEmail !== existingById.email ||
      nextDisplayName !== existingById.displayName ||
      nextPhotoURL !== existingById.photoURL
    ) {
      return {
        user: await tx.user.update({
          where: { id: userId },
          data: {
            email: nextEmail,
            displayName: nextDisplayName,
            photoURL: nextPhotoURL,
          },
        }),
        created: false,
        reconciled: false,
      };
    }

    return { user: existingById, created: false, reconciled: false };
  }

  if (!email.endsWith("@placeholder.local")) {
    const existingByEmail = await tx.user.findUnique({ where: { email } });
    if (existingByEmail) {
      return {
        user: await tx.user.update({
          where: { email },
          data: {
            id: userId,
            displayName: displayName ?? existingByEmail.displayName,
            photoURL: photoURL ?? existingByEmail.photoURL,
          },
        }),
        created: false,
        reconciled: true,
      };
    }
  }

  return {
    user: await tx.user.create({
      data: {
        id: userId,
        email,
        displayName,
        photoURL,
        planTier: "free",
        periodEnd: new Date(Date.now() + DEFAULT_BILLING_PERIOD_MS),
      },
    }),
    created: true,
    reconciled: false,
  };
}

export async function ensureUserRecord(
  userId: string,
  input: EnsureUserInput = {}
): Promise<EnsureUserResult> {
  try {
    return await prisma.$transaction((tx) => ensureUserRecordOnce(tx, userId, input));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      RETRYABLE_PRISMA_CODES.has(error.code)
    ) {
      return prisma.$transaction((tx) => ensureUserRecordOnce(tx, userId, input));
    }

    throw error;
  }
}
