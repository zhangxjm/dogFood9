import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { getCurrentUser } from "~/services/user.server";
import { getInfringementsByUser, getInfringementStats, scanAllWorksForInfringements } from "~/services/monitor.server";
import { fixEvidence } from "~/services/evidence.server";
import PageHeader from "~/components/PageHeader";
import Card from "~/components/Card";
import Button from "~/components/Button";
import Badge from "~/components/Badge";
import StatCard from "~/components/StatCard";
import {
  ShieldAlert,
  ShieldCheck,
  ScanLine,
  Link as LinkIcon,
  Calendar,
  FileCheck2,
  AlertTriangle,
  AlertCircle,
  Info,
  PieChart,
  PieChartIcon
} from "lucide-react";
import type { RiskLevel, InfringementStatus } from "~/types";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getCurrentUser();
  const url = new URL(request.url);
  const riskLevel = url.searchParams.get("riskLevel") as RiskLevel | undefined;

  const [infringements, stats] = await Promise.all([
    getInfringementsByUser(user.id, { riskLevel }),
    getInfringementStats(user.id)
  ]);

  return json({ infringements, stats });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const action = String(formData.get("_action") || "");

  if (action === "scan") {
    const result = await scanAllWorksForInfringements();
    return json({ ok: true, scanned: result });
  }

  if (action === "fix_evidence") {
    const infringementId = String(formData.get("infringementId") || "");
    const workId = String(formData.get("workId") || "");
    await fixEvidence(infringementId, workId);
    return json({ ok: true, evidenceFixed: true });
  }

  return json({ ok: true });
};

const riskLabels = { HIGH: "高风险", MEDIUM: "中风险", LOW: "低风险" };
const riskVariants = { HIGH: "danger", MEDIUM: "warning", LOW: "success" } as const;
const riskIcons = { HIGH: AlertTriangle, MEDIUM: AlertCircle, LOW: Info };
const RISK_COLORS = { HIGH: "#EF4444", MEDIUM: "#F59E0B", LOW: "#10B981" };

const infringementStatusLabels = {
  DETECTED: "已发现",
  EVIDENCE_FIXED: "证据已固定",
  ACTION_TAKEN: "已采取行动"
};
const infringementStatusVariants = {
  DETECTED: "warning",
  EVIDENCE_FIXED: "success",
  ACTION_TAKEN: "info"
} as const;

export default function Monitor() {
  const data = useLoaderData<typeof loader>();

  const pieData = [
    { name: "高风险", value: data.stats.high, color: RISK_COLORS.HIGH },
    { name: "中风险", value: data.stats.medium, color: RISK_COLORS.MEDIUM },
    { name: "低风险", value: data.stats.low, color: RISK_COLORS.LOW }
  ].filter(d => d.value > 0);

  return (
    <div>
      <PageHeader
        title="侵权监测"
        description="基于Meilisearch高性能搜索引擎的侵权内容秒级检索，实时监测全网侵权行为。"
        actions={
          <Form method="post">
            <input type="hidden" name="_action" value="scan" />
            <Button icon={<ScanLine className="w-4 h-4" />} type="submit">
              启动全网扫描
            </Button>
          </Form>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          title="监测总数"
          value={data.stats.total}
          icon={<ShieldAlert className="w-6 h-6 text-white" />}
          gradient="from-dark-700 to-dark-900"
        />
        <StatCard
          title="高风险侵权"
          value={data.stats.high}
          icon={<AlertTriangle className="w-6 h-6 text-white" />}
          gradient="from-red-500 to-red-700"
        />
        <StatCard
          title="中风险侵权"
          value={data.stats.medium}
          icon={<AlertCircle className="w-6 h-6 text-white" />}
          gradient="from-amber-500 to-amber-700"
        />
        <StatCard
          title="证据已固定"
          value={data.stats.fixed}
          icon={<ShieldCheck className="w-6 h-6 text-white" />}
          gradient="from-emerald-500 to-emerald-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <Card>
          <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary-600" />
            风险等级分布
          </h3>
          {pieData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} 项`, ""]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-dark-400 text-sm">
              暂无数据
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-dark-800 mb-4">监测引擎状态</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-dark-50 rounded-xl border border-dark-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-dark-700">Meilisearch 引擎</span>
              </div>
              <p className="text-xs text-dark-500">高性能搜索引擎运行中，支持秒级检索</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl border border-dark-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-dark-700">自动监测服务</span>
              </div>
              <p className="text-xs text-dark-500">持续监测全网内容，自动匹配相似作品</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl border border-dark-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-dark-700">相似度算法</span>
              </div>
              <p className="text-xs text-dark-500">基于内容指纹+全文检索的双重匹配</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl border border-dark-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-dark-700">区块链存证</span>
              </div>
              <p className="text-xs text-dark-500">侵权证据自动上链，具备法律效力</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
          <h3 className="font-semibold text-dark-800">侵权记录列表</h3>
          <div className="flex items-center gap-2">
            <Form method="get" className="flex gap-2">
              <select
                name="riskLevel"
                className="px-3 py-1.5 border border-dark-300 rounded-lg text-sm bg-white"
                defaultValue=""
              >
                <option value="">全部风险等级</option>
                <option value="HIGH">高风险</option>
                <option value="MEDIUM">中风险</option>
                <option value="LOW">低风险</option>
              </select>
              <Button size="sm" variant="secondary" type="submit">筛选</Button>
            </Form>
          </div>
        </div>

        {data.infringements.length === 0 ? (
          <div className="text-center py-16">
            <ShieldCheck className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
            <h3 className="text-lg font-medium text-dark-800">暂无侵权记录</h3>
            <p className="mt-1 text-dark-500">系统正在持续监测中，启动全网扫描以检测侵权内容</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-100">
            {data.infringements.map((inf: any) => {
              const RiskIcon = riskIcons[inf.riskLevel as RiskLevel];
              return (
                <div key={inf.id} className="p-5 hover:bg-dark-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      inf.riskLevel === "HIGH" ? "bg-red-100" :
                      inf.riskLevel === "MEDIUM" ? "bg-amber-100" :
                      "bg-emerald-100"
                    }`}>
                      <RiskIcon className={`w-6 h-6 ${
                        inf.riskLevel === "HIGH" ? "text-red-600" :
                        inf.riskLevel === "MEDIUM" ? "text-amber-600" :
                        "text-emerald-600"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-dark-800">{inf.sourceTitle}</h4>
                            <Badge variant={riskVariants[inf.riskLevel as RiskLevel]}>
                              {riskLabels[inf.riskLevel as RiskLevel]}
                            </Badge>
                            <Badge variant={infringementStatusVariants[inf.status as keyof typeof infringementStatusVariants]}>
                              {infringementStatusLabels[inf.status as keyof typeof infringementStatusLabels]}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-sm text-dark-500">
                            <span>关联作品：<Link to={`/works/${inf.work.id}`} className="text-primary-600 hover:text-primary-700 font-medium">{inf.work.title}</Link></span>
                            <a
                              href={inf.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary-600 truncate max-w-xs"
                            >
                              <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                              {inf.sourceUrl}
                            </a>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-dark-400">内容相似度</p>
                          <div className="mt-1 flex items-center gap-3">
                            <div className="w-24 h-2 bg-dark-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  inf.similarity >= 80 ? "bg-red-500" :
                                  inf.similarity >= 50 ? "bg-amber-500" :
                                  "bg-emerald-500"
                                }`}
                                style={{ width: `${inf.similarity}%` }}
                              />
                            </div>
                            <span className="text-lg font-bold text-dark-800 w-12 text-right">{inf.similarity}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-dark-100 flex items-center justify-between">
                        <span className="text-xs text-dark-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          发现于 {new Date(inf.detectedAt).toLocaleString("zh-CN")}
                        </span>
                        <div className="flex items-center gap-2">
                          {inf.evidence && (
                            <Link to={`/evidence/${inf.evidence.id}`}>
                              <Button variant="secondary" size="sm">查看证据</Button>
                            </Link>
                          )}
                          {!inf.evidence && inf.status === "DETECTED" && (
                            <Form method="post">
                              <input type="hidden" name="_action" value="fix_evidence" />
                              <input type="hidden" name="infringementId" value={inf.id} />
                              <input type="hidden" name="workId" value={inf.workId} />
                              <Button size="sm" icon={<FileCheck2 className="w-3.5 h-3.5" />}>
                                固定证据并上链
                              </Button>
                            </Form>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
