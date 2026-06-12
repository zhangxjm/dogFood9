import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  FilePlus2,
  ShieldAlert,
  HandCoins,
  Wallet,
  ArrowRight,
  ScanLine
} from "lucide-react";
import { getCurrentUser } from "~/services/user.server";
import { getWorkStats } from "~/services/work.server";
import { getInfringementStats } from "~/services/monitor.server";
import { getLicenseStats } from "~/services/license.server";
import { getRoyaltyStats, getMonthlyRoyaltyData } from "~/services/royalty.server";
import { getEvidencesByUser } from "~/services/evidence.server";
import { getLicensesByLicensor } from "~/services/license.server";
import StatCard from "~/components/StatCard";
import PageHeader from "~/components/PageHeader";
import Card from "~/components/Card";
import Button from "~/components/Button";
import Badge from "~/components/Badge";
import Timeline from "~/components/Timeline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export const loader: LoaderFunction = async () => {
  const user = await getCurrentUser();
  const [workStats, infringementStats, licenseStats, royaltyStats, monthlyData, evidences, soldLicenses] = await Promise.all([
    getWorkStats(user.id),
    getInfringementStats(user.id),
    getLicenseStats(user.id, user.role as "CREATOR" | "LICENSEE"),
    getRoyaltyStats(user.id, user.role as "CREATOR" | "LICENSEE"),
    getMonthlyRoyaltyData(user.id, 6),
    getEvidencesByUser(user.id),
    getLicensesByLicensor(user.id)
  ]);

  const activities = [];

  if (evidences.length > 0) {
    activities.push({
      id: `ev-${evidences[0].id}`,
      type: "evidence" as const,
      title: "证据已成功上链存证",
      description: `侵权证据已固定，区块链存证哈希: ${evidences[0].evidenceHash.substring(0, 20)}...`,
      time: new Date(evidences[0].timestamp).toLocaleString("zh-CN")
    });
  }

  if (soldLicenses.length > 0) {
    activities.push({
      id: `lic-${soldLicenses[0].id}`,
      type: "license" as const,
      title: "新的版权授权交易",
      description: `作品《${soldLicenses[0].work.title}》已成功授权，金额 ¥${soldLicenses[0].price}`,
      time: new Date(soldLicenses[0].createdAt).toLocaleString("zh-CN")
    });
  }

  return json({
    user,
    workStats,
    infringementStats,
    licenseStats,
    royaltyStats,
    monthlyData,
    activities: activities.slice(0, 8)
  });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();

  const earnedTotal = (data.royaltyStats as any).totalEarned ?? 0;
  const totalSpent = (data.royaltyStats as any).totalSpent ?? 0;

  return (
    <div>
      <PageHeader
        title="系统首页"
        description={`欢迎回来，${data.user.name}！实时掌握您的数字版权资产状况。`}
        actions={
          <>
            <Link to="/register">
              <Button icon={<FilePlus2 className="w-4 h-4" />}>
                登记作品
              </Button>
            </Link>
            <Link to="/monitor">
              <Button variant="secondary" icon={<ScanLine className="w-4 h-4" />}>
                侵权扫描
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          title="已登记作品"
          value={data.workStats.total}
          icon={<FilePlus2 className="w-6 h-6 text-white" />}
          gradient="from-primary-600 to-primary-800"
          trend={{ value: `${data.workStats.confirmed} 件已确权`, positive: true }}
        />
        <StatCard
          title="侵权监测数"
          value={data.infringementStats.total}
          icon={<ShieldAlert className="w-6 h-6 text-white" />}
          gradient="from-red-500 to-red-700"
          trend={{ value: `${data.infringementStats.high} 项高危`, positive: false }}
        />
        <StatCard
          title="授权交易数"
          value={(data.licenseStats as any).total ?? 0}
          icon={<HandCoins className="w-6 h-6 text-white" />}
          gradient="from-accent-500 to-accent-700"
          trend={{ value: `${(data.licenseStats as any).active ?? 0} 项进行中`, positive: true }}
        />
        <StatCard
          title={data.user.role === "CREATOR" ? "版税总额" : "支出总额"}
          value={`¥${(data.user.role === "CREATOR" ? earnedTotal : totalSpent).toFixed(2)}`}
          icon={<Wallet className="w-6 h-6 text-white" />}
          gradient="from-emerald-500 to-emerald-700"
          trend={{ value: "自动结算已完成", positive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-dark-800">版税收支趋势</h3>
            <Badge variant="info">最近6个月</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                <Bar dataKey="income" name="版税收入" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="授权支出" fill="#D97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-dark-800">侵权风险分布</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-dark-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  高风险
                </span>
                <span className="font-semibold text-dark-800">{data.infringementStats.high}</span>
              </div>
              <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.infringementStats.total ? (data.infringementStats.high / data.infringementStats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-dark-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  中风险
                </span>
                <span className="font-semibold text-dark-800">{data.infringementStats.medium}</span>
              </div>
              <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.infringementStats.total ? (data.infringementStats.medium / data.infringementStats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-dark-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  低风险
                </span>
                <span className="font-semibold text-dark-800">{data.infringementStats.low}</span>
              </div>
              <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.infringementStats.total ? (data.infringementStats.low / data.infringementStats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-dark-100">
            <Link to="/monitor">
              <Button variant="ghost" className="w-full justify-between">
                查看详细监测报告
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-dark-800">最近活动动态</h3>
            <Badge variant="success">实时更新</Badge>
          </div>
          {data.activities.length > 0 ? (
            <Timeline items={data.activities} />
          ) : (
            <div className="text-center py-12 text-dark-400">
              <p>暂无活动记录</p>
              <p className="text-sm mt-1">登记作品或启动监测后将在此处显示动态</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
