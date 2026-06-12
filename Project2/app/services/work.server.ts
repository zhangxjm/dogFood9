import { prisma } from "./prisma.server";
import {
  calculateContentHash,
  createCopyrightCertificate
} from "./blockchain.server";
import { indexWork, ensureIndexExists } from "./meilisearch.server";
import type { WorkType } from "~/types";

export interface CreateWorkInput {
  title: string;
  type: WorkType;
  author: string;
  description: string;
  content: string;
  userId: string;
}

export async function createWork(input: CreateWorkInput) {
  const contentHash = calculateContentHash(input.content);

  const work = await prisma.work.create({
    data: {
      title: input.title,
      type: input.type,
      author: input.author,
      description: input.description,
      content: input.content,
      contentHash,
      status: "PENDING",
      userId: input.userId
    }
  });

  const cert = await createCopyrightCertificate(contentHash, input.title, input.author);

  const confirmedWork = await prisma.work.update({
    where: { id: work.id },
    data: {
      blockchainTxHash: cert.blockchainTxHash,
      blockchainBlockNumber: cert.blockNumber,
      certificateNo: cert.certificateNo,
      status: "CONFIRMED"
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  await ensureIndexExists();
  await indexWork({
    id: confirmedWork.id,
    title: confirmedWork.title,
    type: confirmedWork.type,
    author: confirmedWork.author,
    description: confirmedWork.description,
    content: confirmedWork.content,
    contentHash: confirmedWork.contentHash,
    status: confirmedWork.status,
    userId: confirmedWork.userId,
    createdAt: confirmedWork.createdAt.getTime()
  });

  return { work: confirmedWork, certificate: cert };
}

export async function getWorkById(id: string) {
  return prisma.work.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      infringements: {
        orderBy: { detectedAt: "desc" },
        take: 10
      },
      licenses: {
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });
}

export async function getWorksByUser(userId: string, options?: {
  type?: WorkType;
  status?: string;
  search?: string;
}) {
  const where: any = { userId };

  if (options?.type) where.type = options.type;
  if (options?.status) where.status = options.status;
  if (options?.search) {
    where.OR = [
      { title: { contains: options.search } },
      { author: { contains: options.search } },
      { description: { contains: options.search } }
    ];
  }

  return prisma.work.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { infringements: true, licenses: true }
      }
    }
  });
}

export async function getAllWorksForMarket(options?: {
  type?: WorkType;
  search?: string;
}) {
  const where: any = { status: "CONFIRMED" };

  if (options?.type) where.type = options.type;
  if (options?.search) {
    where.OR = [
      { title: { contains: options.search } },
      { author: { contains: options.search } }
    ];
  }

  return prisma.work.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      licenses: {
        where: { status: "ACTIVE" },
        take: 1
      }
    }
  });
}

export async function getWorkStats(userId: string) {
  const [total, confirmed, pending, withInfringements] = await Promise.all([
    prisma.work.count({ where: { userId } }),
    prisma.work.count({ where: { userId, status: "CONFIRMED" } }),
    prisma.work.count({ where: { userId, status: "PENDING" } }),
    prisma.work.count({
      where: {
        userId,
        infringements: { some: {} }
      }
    })
  ]);

  return { total, confirmed, pending, withInfringements };
}
