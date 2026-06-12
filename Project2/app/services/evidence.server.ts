import { prisma } from "./prisma.server";
import { calculateContentHash, calculateDigitalSignature, anchorEvidence } from "./blockchain.server";

export async function fixEvidence(infringementId: string, workId: string) {
  const infringement = await prisma.infringementRecord.findUnique({
    where: { id: infringementId },
    include: { work: true }
  });

  if (!infringement) {
    throw new Error("Infringement record not found");
  }

  const snapshotData = JSON.stringify({
    sourceUrl: infringement.sourceUrl,
    sourceTitle: infringement.sourceTitle,
    similarity: infringement.similarity,
    workTitle: infringement.work.title,
    detectedAt: infringement.detectedAt.toISOString(),
    capturedAt: new Date().toISOString()
  });

  const evidenceHash = calculateContentHash(snapshotData);
  const digitalSignature = calculateDigitalSignature(evidenceHash);

  const chainResult = await anchorEvidence(`${evidenceHash}:${infringementId}`);

  const evidence = await prisma.evidence.create({
    data: {
      infringementId,
      workId,
      evidenceHash,
      blockchainTxHash: chainResult.txHash,
      timestamp: chainResult.timestamp,
      contentSnapshot: snapshotData,
      digitalSignature,
      status: "CHAIN_CONFIRMED"
    }
  });

  await prisma.infringementRecord.update({
    where: { id: infringementId },
    data: { status: "EVIDENCE_FIXED" }
  });

  return evidence;
}

export async function getEvidencesByUser(userId: string) {
  return prisma.evidence.findMany({
    where: { work: { userId } },
    orderBy: { timestamp: "desc" },
    include: {
      work: { select: { id: true, title: true, type: true, author: true } },
      infringement: { select: { id: true, sourceUrl: true, sourceTitle: true, similarity: true, riskLevel: true } }
    }
  });
}

export async function getEvidenceById(id: string) {
  return prisma.evidence.findUnique({
    where: { id },
    include: {
      work: { select: { id: true, title: true, type: true, author: true, userId: true } },
      infringement: { select: { id: true, sourceUrl: true, sourceTitle: true, similarity: true, riskLevel: true, status: true } }
    }
  });
}

export async function getEvidenceStats(userId: string) {
  const [total, confirmed] = await Promise.all([
    prisma.evidence.count({ where: { work: { userId } } }),
    prisma.evidence.count({ where: { work: { userId }, status: "CHAIN_CONFIRMED" } })
  ]);

  return { total, confirmed };
}
