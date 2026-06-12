import { prisma } from "./prisma.server";

export const DEFAULT_CREATOR_ID = "default-creator-uuid";
export const DEFAULT_LICENSEE_ID = "default-licensee-uuid";

export async function getOrCreateDefaultUsers() {
  let creator = await prisma.user.findUnique({
    where: { id: DEFAULT_CREATOR_ID }
  });

  if (!creator) {
    creator = await prisma.user.create({
      data: {
        id: DEFAULT_CREATOR_ID,
        name: "张明",
        email: "creator@copyright.com",
        role: "CREATOR",
        balance: 0
      }
    });
  }

  let licensee = await prisma.user.findUnique({
    where: { id: DEFAULT_LICENSEE_ID }
  });

  if (!licensee) {
    licensee = await prisma.user.create({
      data: {
        id: DEFAULT_LICENSEE_ID,
        name: "李华",
        email: "licensee@copyright.com",
        role: "LICENSEE",
        balance: 10000
      }
    });
  }

  return { creator, licensee };
}

export async function getCurrentUser() {
  const { creator } = await getOrCreateDefaultUsers();
  return creator;
}

export async function switchUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function getAllUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
