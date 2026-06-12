import { prisma } from "./prisma.server";

export async function getRoyaltyIncome(userId: string) {
  const settlements = await prisma.royaltySettlement.findMany({
    where: {
      license: { licensorId: userId }
    },
    orderBy: { createdAt: "desc" },
    include: {
      work: { select: { id: true, title: true, type: true, author: true } },
      license: {
        include: {
          licensee: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });

  const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
  const totalFee = settlements.reduce((sum, s) => sum + s.platformFee, 0);
  const totalNet = settlements.reduce((sum, s) => sum + s.netAmount, 0);

  return {
    settlements,
    summary: {
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalFee: Math.round(totalFee * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      count: settlements.length
    }
  };
}

export async function getRoyaltyExpenses(userId: string) {
  const settlements = await prisma.royaltySettlement.findMany({
    where: {
      license: { licenseeId: userId }
    },
    orderBy: { createdAt: "desc" },
    include: {
      work: { select: { id: true, title: true, type: true, author: true } },
      license: {
        include: {
          licensor: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });

  const total = settlements.reduce((sum, s) => sum + s.amount, 0);

  return {
    settlements,
    summary: {
      total: Math.round(total * 100) / 100,
      count: settlements.length
    }
  };
}

export async function getRoyaltyStats(userId: string, role: string) {
  if (role === "CREATOR") {
    const result = await prisma.royaltySettlement.aggregate({
      where: { license: { licensorId: userId } },
      _sum: { netAmount: true, amount: true, platformFee: true },
      _count: true
    });

    return {
      totalEarned: result._sum.netAmount || 0,
      totalGross: result._sum.amount || 0,
      totalFees: result._sum.platformFee || 0,
      transactionCount: result._count
    };
  } else {
    const result = await prisma.royaltySettlement.aggregate({
      where: { license: { licenseeId: userId } },
      _sum: { amount: true },
      _count: true
    });

    return {
      totalSpent: result._sum.amount || 0,
      transactionCount: result._count
    };
  }
}

export async function getMonthlyRoyaltyData(userId: string, months: number = 6) {
  const now = new Date();
  const data: { month: string; income: number; expense: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const [incomeResult, expenseResult] = await Promise.all([
      prisma.royaltySettlement.aggregate({
        where: {
          license: { licensorId: userId },
          createdAt: { gte: date, lt: nextMonth }
        },
        _sum: { netAmount: true }
      }),
      prisma.royaltySettlement.aggregate({
        where: {
          license: { licenseeId: userId },
          createdAt: { gte: date, lt: nextMonth }
        },
        _sum: { amount: true }
      })
    ]);

    data.push({
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      income: Math.round((incomeResult._sum.netAmount || 0) * 100) / 100,
      expense: Math.round((expenseResult._sum.amount || 0) * 100) / 100
    });
  }

  return data;
}
