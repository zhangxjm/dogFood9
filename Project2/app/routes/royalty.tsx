import { useState } from "react";
import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getCurrentUser } from "~/services/user.server";
import { getRoyaltyIncome, getRoyaltyExpenses, getRoyaltyStats, getMonthlyRoyaltyData } from "~/services/royalty.server";
import PageHeader from "~/components/PageHeader";
import Card from "~/components/Card";
import Badge from "~/components/Badge";
import StatCard from "~/components/StatCard";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileText,
  User
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export const loader: LoaderFunction = async () => {
  const user = await getCurrentUser();
  const [income, expenses, stats, monthlyData] = await Promise.all([
    getRoyaltyIncome(user.id),
    getRoyaltyExpenses(user.id),
    getRoyaltyStats(user.id, user.role as "CREATOR" | "LICENSEE"),
    getMonthlyRoyaltyData(user.id, 6)
  ]);

  return json({ user, income, expenses, stats, monthlyData });
};

export default function Royalty() {
  const data = useLoaderData<typeof loader>();
  const [tab, setTab] = useState<"income" | "expense">("income");

  const isCreator = data.user.role === "CREATOR";
  const totalEarned = (data.stats as any).totalEarned ?? 0;
  const totalGross = (data.stats as any).totalGross ?? 0;
  const totalFees = (data.stats as any).totalFees ?? 0;
  const totalSpent = (data.stats as any).totalSpent ?? 0;

  return (
    <div>
      <PageHeader
        title="版税结算"
        description="系统自动完成版税计算与结算，实时查看您的收入明细和支出记录。"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {isCreator ? (
          <>
            <StatCard
              title="累计净收入"
              value={`¥${totalEarned.toFixed(2)}`}
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              gradient="from-emerald-500 to-emerald-700"
            />
            <StatCard
              title="交易毛收入"
              value={`¥${totalGross.toFixed(2)}`}
              icon={<Wallet className="w-6 h-6 text-white" />}
              gradient="from-primary-600 to-primary-800"
            />
            <StatCard
              title="平台服务费"
              value={`¥${totalFees.toFixed(2)}`}
              icon={<PiggyBank className="w-6 h-6 text-white" />}
              gradient="from-dark-700 to-dark-900"
            />
            <StatCard
              title="结算笔数"
              value={(data.stats as any).transactionCount ?? 0}
              icon={<FileText className="w-6 h-6 text-white" />}
              gradient="from-accent-500 to-accent-700"
            />
          </>
        ) : (
          <>
            <StatCard
              title="累计支出"
              value={`¥${totalSpent.toFixed(2)}`}
              icon={<TrendingDown className="w-6 h-6 text-white" />}
              gradient="from-red-500 to-red-700"
            />
            <StatCard
              title="账户余额"
              value={`¥${data.user.balance.toFixed(2)}`}
              icon={<Wallet className="w-6 h-6 text-white" />}
              gradient="from-primary-600 to-primary-800"
            />
            <StatCard
              title="已购授权"
              value={(data.stats as any).transactionCount ?? 0}
              icon={<FileText className="w-6 h-6 text-white" />}
              gradient="from-accent-500 to-accent-700"
            />
            <StatCard
              title="本月支出"
              value={`¥${data.monthlyData[data.monthlyData.length - 1]?.expense.toFixed(2) || "0.00"}`}
              icon={<ArrowDownRight className="w-6 h-6 text-white" />}
              gradient="from-dark-700 to-dark-900"
            />
          </>
        )}
      </div>

      <Card className="mb-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-dark-800">版税收支趋势</h3>
          <Badge variant="info">最近6个月</Badge>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  fontSize: "12px"
                }}
                formatter={(value: number) => [`¥${value}`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area
                type="monotone"
                dataKey="income"
                name="版税收入"
                stroke="#0D9488"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="授权支出"
                stroke="#D97706"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card padding="sm" className="mb-5">
        <div className="flex gap-1 p-1">
          <button
            onClick={() => setTab("income")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              tab === "income"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-dark-600 hover:bg-dark-100"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            收入明细
            <Badge variant={tab === "income" ? "default" : "success"}>{data.income.summary.count}</Badge>
          </button>
          <button
            onClick={() => setTab("expense")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              tab === "expense"
                ? "bg-red-600 text-white shadow-sm"
                : "text-dark-600 hover:bg-dark-100"
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            支出记录
            <Badge variant={tab === "expense" ? "default" : "danger"}>{data.expenses.summary.count}</Badge>
          </button>
        </div>
      </Card>

      {tab === "income" && (
        <Card padding="sm">
          {data.income.settlements.length === 0 ? (
            <div className="text-center py-16">
              <Wallet className="w-16 h-16 mx-auto text-dark-300 mb-4" />
              <h3 className="text-lg font-medium text-dark-800">暂无收入记录</h3>
              <p className="mt-1 text-dark-500">您的作品被购买授权后，系统将自动完成版税结算</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-dark-100 bg-dark-50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-dark-500">累计毛收入</p>
                    <p className="text-xl font-bold text-dark-800">¥{data.income.summary.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-500">平台服务费</p>
                    <p className="text-xl font-bold text-red-600">-¥{data.income.summary.totalFee.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-500">实际净收入</p>
                    <p className="text-xl font-bold text-emerald-600">¥{data.income.summary.totalNet.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-200">
                      <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">作品</th>
                      <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">被授权方</th>
                      <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">毛收入</th>
                      <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">服务费</th>
                      <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">净收入</th>
                      <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">结算时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100">
                    {data.income.settlements.map((s: any) => (
                      <tr key={s.id} className="hover:bg-dark-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-dark-800">{s.work.title}</p>
                          <p className="text-xs text-dark-500 mt-0.5">{s.work.author}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-dark-400" />
                            <span className="text-sm text-dark-600">{s.license.licensee.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-medium text-dark-800">¥{s.amount.toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-red-600">-¥{s.platformFee.toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-emerald-600">¥{s.netAmount.toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 text-sm text-dark-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(s.createdAt).toLocaleString("zh-CN")}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}

      {tab === "expense" && (
        <Card padding="sm">
          {data.expenses.settlements.length === 0 ? (
            <div className="text-center py-16">
              <TrendingDown className="w-16 h-16 mx-auto text-dark-300 mb-4" />
              <h3 className="text-lg font-medium text-dark-800">暂无支出记录</h3>
              <p className="mt-1 text-dark-500">购买版权授权后将在此处显示支出记录</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-dark-100 bg-dark-50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark-500">累计支出</p>
                  <p className="text-xl font-bold text-accent-600">¥{data.expenses.summary.total.toFixed(2)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-200">
                      <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">作品</th>
                      <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">授权方</th>
                      <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">支出金额</th>
                      <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">购买时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100">
                    {data.expenses.settlements.map((s: any) => (
                      <tr key={s.id} className="hover:bg-dark-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-dark-800">{s.work.title}</p>
                          <p className="text-xs text-dark-500 mt-0.5">{s.work.author}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-dark-400" />
                            <span className="text-sm text-dark-600">{s.license.licensor.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-accent-600">¥{s.amount.toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 text-sm text-dark-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(s.createdAt).toLocaleString("zh-CN")}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
