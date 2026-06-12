import { prisma } from "./prisma.server";
import type { LicenseType } from "~/types";

export interface CreateLicenseInput {
  workId: string;
  licensorId: string;
  licenseeId: string;
  type: LicenseType;
  price: number;
  durationDays: number;
}

export async function createLicense(input: CreateLicenseInput) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + input.durationDays);

  const license = await prisma.license.create({
    data: {
      workId: input.workId,
      licensorId: input.licensorId,
      licenseeId: input.licenseeId,
      type: input.type,
      price: input.price,
      duration: input.durationDays,
      startDate,
      endDate,
      status: "ACTIVE"
    },
    include: {
      work: { select: { id: true, title: true, type: true, author: true } },
      licensor: { select: { id: true, name: true, email: true } },
      licensee: { select: { id: true, name: true, email: true } }
    }
  });

  const platformFee = Math.round(input.price * 0.1 * 100) / 100;
  const netAmount = Math.round((input.price - platformFee) * 100) / 100;

  await prisma.royaltySettlement.create({
    data: {
      licenseId: license.id,
      workId: input.workId,
      amount: input.price,
      platformFee,
      netAmount,
      status: "SETTLED",
      settledAt: new Date()
    }
  });

  await prisma.user.update({
    where: { id: input.licensorId },
    data: { balance: { increment: netAmount } }
  });

  return license;
}

export async function getLicensesByLicensor(licensorId: string) {
  return prisma.license.findMany({
    where: { licensorId },
    orderBy: { createdAt: "desc" },
    include: {
      work: { select: { id: true, title: true, type: true, author: true } },
      licensee: { select: { id: true, name: true, email: true } },
      settlements: true
    }
  });
}

export async function getLicensesByLicensee(licenseeId: string) {
  return prisma.license.findMany({
    where: { licenseeId },
    orderBy: { createdAt: "desc" },
    include: {
      work: { select: { id: true, title: true, type: true, author: true } },
      licensor: { select: { id: true, name: true, email: true } },
      settlements: true
    }
  });
}

export async function getLicenseById(id: string) {
  return prisma.license.findUnique({
    where: { id },
    include: {
      work: { select: { id: true, title: true, type: true, author: true, description: true, contentHash: true, certificateNo: true } },
      licensor: { select: { id: true, name: true, email: true } },
      licensee: { select: { id: true, name: true, email: true } },
      settlements: true
    }
  });
}

export async function getLicenseStats(userId: string, role: string) {
  if (role === "CREATOR") {
    const [sold, activeLicenses] = await Promise.all([
      prisma.license.count({ where: { licensorId: userId } }),
      prisma.license.count({ where: { licensorId: userId, status: "ACTIVE" } })
    ]);
    return { total: sold, active: activeLicenses, as: "licensor" };
  } else {
    const [purchased, activeLicenses] = await Promise.all([
      prisma.license.count({ where: { licenseeId: userId } }),
      prisma.license.count({ where: { licenseeId: userId, status: "ACTIVE" } })
    ]);
    return { total: purchased, active: activeLicenses, as: "licensee" };
  }
}

export async function purchaseLicense(
  workId: string,
  licenseeId: string,
  type: LicenseType,
  price: number,
  durationDays: number
) {
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: { userId: true }
  });

  if (!work) throw new Error("Work not found");

  return createLicense({
    workId,
    licensorId: work.userId,
    licenseeId,
    type,
    price,
    durationDays
  });
}
