import { prisma } from "./prisma.server";
import { searchSimilarWorks, ensureIndexExists } from "./meilisearch.server";
import type { RiskLevel } from "~/types";

const MOCK_INFRINGEMENT_SOURCES = [
  { url: "https://pirate-site-a.com/content/123", title: "热门音乐合辑 - 免费下载" },
  { url: "https://video-sharing-b.net/watch/abc", title: "精彩视频合集 - 无版权声明" },
  { url: "https://document-site.c.cn/article/xyz", title: "原创文章转载 - 未注明出处" },
  { url: "https://mp3-download-d.com/music/789", title: "无损音乐免费下载站" },
  { url: "https://stream-e.org/play/456", title: "在线影视播放 - 无授权" },
  { url: "https://book-pirate-f.com/novel/321", title: "小说全文免费阅读" },
  { url: "https://clip-sharing-g.tv/v/654", title: "短视频搬运合集" },
  { url: "https://audio-hub-h.com/audio/987", title: "播客音频免费获取" }
];

function determineRiskLevel(similarity: number): RiskLevel {
  if (similarity >= 80) return "HIGH";
  if (similarity >= 50) return "MEDIUM";
  return "LOW";
}

export async function scanAllWorksForInfringements() {
  const works = await prisma.work.findMany({
    where: { status: "CONFIRMED" }
  });

  await ensureIndexExists();

  let totalDetected = 0;

  for (const work of works) {
    const searchResults = await searchSimilarWorks(
      `${work.title} ${work.description} ${work.content}`,
      work.id,
      10
    );

    if (searchResults.length > 0) {
      for (const result of searchResults) {
        if (result.similarity >= 30) {
          const mockSource = MOCK_INFRINGEMENT_SOURCES[
            Math.floor(Math.random() * MOCK_INFRINGEMENT_SOURCES.length)
          ];

          const existing = await prisma.infringementRecord.findFirst({
            where: {
              workId: work.id,
              sourceUrl: mockSource.url
            }
          });

          if (!existing) {
            await prisma.infringementRecord.create({
              data: {
                workId: work.id,
                sourceUrl: mockSource.url,
                sourceTitle: `${mockSource.title} - 涉嫌复制《${work.title}》`,
                similarity: result.similarity,
                riskLevel: determineRiskLevel(result.similarity),
                status: "DETECTED"
              }
            });
            totalDetected++;
          }
        }
      }
    }

    if (Math.random() > 0.5) {
      const mockSource = MOCK_INFRINGEMENT_SOURCES[
        Math.floor(Math.random() * MOCK_INFRINGEMENT_SOURCES.length)
      ];
      const similarity = Math.floor(30 + Math.random() * 65);

      const existing = await prisma.infringementRecord.findFirst({
        where: {
          workId: work.id,
          sourceUrl: mockSource.url
        }
      });

      if (!existing) {
        await prisma.infringementRecord.create({
          data: {
            workId: work.id,
            sourceUrl: mockSource.url,
            sourceTitle: `${mockSource.title} - 涉嫌复制《${work.title}》`,
            similarity,
            riskLevel: determineRiskLevel(similarity),
            status: "DETECTED"
          }
        });
        totalDetected++;
      }
    }
  }

  return { totalScanned: works.length, newInfringements: totalDetected };
}

export async function getInfringementsByUser(userId: string, options?: {
  riskLevel?: RiskLevel;
  status?: string;
}) {
  const where: any = {
    work: { userId }
  };

  if (options?.riskLevel) where.riskLevel = options.riskLevel;
  if (options?.status) where.status = options.status;

  return prisma.infringementRecord.findMany({
    where,
    orderBy: { detectedAt: "desc" },
    include: {
      work: { select: { id: true, title: true, type: true, author: true } },
      evidence: true
    }
  });
}

export async function getInfringementById(id: string) {
  return prisma.infringementRecord.findUnique({
    where: { id },
    include: {
      work: { select: { id: true, title: true, type: true, author: true, userId: true } },
      evidence: true
    }
  });
}

export async function getInfringementStats(userId: string) {
  const [total, high, medium, low, fixed] = await Promise.all([
    prisma.infringementRecord.count({ where: { work: { userId } } }),
    prisma.infringementRecord.count({ where: { work: { userId }, riskLevel: "HIGH" } }),
    prisma.infringementRecord.count({ where: { work: { userId }, riskLevel: "MEDIUM" } }),
    prisma.infringementRecord.count({ where: { work: { userId }, riskLevel: "LOW" } }),
    prisma.infringementRecord.count({ where: { work: { userId }, status: "EVIDENCE_FIXED" } })
  ]);

  return { total, high, medium, low, fixed };
}

export async function scanSingleWork(workId: string) {
  const work = await prisma.work.findUnique({ where: { id: workId } });
  if (!work) throw new Error("Work not found");

  await ensureIndexExists();
  const results = await searchSimilarWorks(
    `${work.title} ${work.description} ${work.content}`,
    work.id,
    10
  );

  let detected = 0;

  for (const result of results) {
    if (result.similarity >= 30) {
      const mockSource = MOCK_INFRINGEMENT_SOURCES[
        Math.floor(Math.random() * MOCK_INFRINGEMENT_SOURCES.length)
      ];

      const existing = await prisma.infringementRecord.findFirst({
        where: { workId, sourceUrl: mockSource.url }
      });

      if (!existing) {
        await prisma.infringementRecord.create({
          data: {
            workId,
            sourceUrl: mockSource.url,
            sourceTitle: `${mockSource.title} - 涉嫌复制《${work.title}》`,
            similarity: result.similarity,
            riskLevel: determineRiskLevel(result.similarity),
            status: "DETECTED"
          }
        });
        detected++;
      }
    }
  }

  return { detected };
}
