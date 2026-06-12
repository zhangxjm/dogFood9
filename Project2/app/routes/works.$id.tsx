import { json, type LoaderFunction, type ActionFunction, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getCurrentUser } from "~/services/user.server";
import { getWorkById } from "~/services/work.server";
import { fixEvidence } from "~/services/evidence.server";
import { scanSingleWork } from "~/services/monitor.server";
import PageHeader from "~/components/PageHeader";
import Card from "~/components/Card";
import Button from "~/components/Button";
import Badge from "~/components/Badge";
import {
  ArrowLeft,
  Music,
  Video,
  FileText,
  Hash,
  Link as LinkIcon,
  Award,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  FileCheck2,
  ScanLine
} from "lucide-react";
import type { WorkType, WorkStatus, RiskLevel } from "~/types";

export const loader: LoaderFunction = async ({ params, request }) => {
  const user = await getCurrentUser();
  const work = await getWorkById(params.id!);

  if (!work || work.userId !== user.id) {
    return redirect("/works");
  }

  const url = new URL(request.url);
  const registered = url.searchParams.get("registered") === "true";

  return json({ work, registered });
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const action = String(formData.get("_action") || "");

  if (action === "scan") {
    await scanSingleWork(params.id!);
    return json({ ok: true, scanned: true });
  }

  if (action === "fix_evidence") {
    const infringementId = String(formData.get("infringementId") || "");
    await fixEvidence(infringementId, params.id!);
    return json({ ok: true, evidenceFixed: true });
  }

  return json({ ok: true });
};

const workTypeIcons = {
  MUSIC: Music,
  VIDEO: Video,
  TEXT: FileText
};

const workTypeLabels = {
  MUSIC: "音乐作品",
  VIDEO: "视频作品",
  TEXT: "文字作品"
};

const statusLabels: Record<WorkStatus, string> = {
  PENDING: "确权中",
  CONFIRMED: "已确权",
  REJECTED: "已驳回"
};

const statusVariants: Record<WorkStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  REJECTED: "danger"
};

const riskLabels = { HIGH: "高风险", MEDIUM: "中风险", LOW: "低风险" };
const riskVariants = { HIGH: "danger", MEDIUM: "warning", LOW: "success" } as const;

export default function WorkDetail() {
  const data = useLoaderData<typeof loader>();
  const { work, registered } = data;
  const Icon = workTypeIcons[work.type as WorkType];

  return (
    <div>
      {registered && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-medium text-emerald-800">版权确权成功！</h4>
            <p className="text-sm text-emerald-700 mt-0.5">
              您的作品已成功上链存证，获得唯一区块链凭证，系统已自动启动全网侵权监测。
            </p>
          </div>
        </div>
      )}

      <Link to="/works" className="inline-flex items-center gap-2 text-dark-500 hover:text-dark-700 mb-5 text-sm">
        <ArrowLeft className="w-4 h-4" />
        返回作品列表
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                work.type === "MUSIC" ? "bg-purple-100" :
                work.type === "VIDEO" ? "bg-blue-100" :
                "bg-emerald-100"
              }`}>
                <Icon className={`w-8 h-8 ${
                  work.type === "MUSIC" ? "text-purple-600" :
                  work.type === "VIDEO" ? "text-blue-600" :
                  "text-emerald-600"
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-dark-900">{work.title}</h1>
                    <p className="mt-1 text-dark-500">作者：{work.author}</p>
                  </div>
                  <Badge size="md" variant={statusVariants[work.status as WorkStatus]}>
                    {statusLabels[work.status as WorkStatus]}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <Badge variant="info">{workTypeLabels[work.type as WorkType]}</Badge>
                  {work.certificateNo && (
                    <Badge variant="accent">证书编号：{work.certificateNo}</Badge>
                  )}
                </div>
                {work.description && (
                  <p className="mt-4 text-dark-600 leading-relaxed">{work.description}</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-dark-100 flex items-center gap-3 flex-wrap">
              <form method="post">
                <input type="hidden" name="_action" value="scan" />
                <Button icon={<ScanLine className="w-4 h-4" />} type="submit">
                  启动侵权扫描
                </Button>
              </form>
              <Link to={`/license`}>
                <Button variant="secondary">设置授权方案</Button>
              </Link>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-dark-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                侵权监测记录
              </h3>
              <Badge variant={work.infringements.length > 0 ? "warning" : "default"}>
                {work.infringements.length} 条记录
              </Badge>
            </div>

            {work.infringements.length === 0 ? (
              <div className="text-center py-10 text-dark-400">
                <p>暂无侵权记录</p>
                <p className="text-sm mt-1">系统将持续监测网络中可能的侵权行为</p>
              </div>
            ) : (
              <div className="space-y-3">
                {work.infringements.map((inf: any) => (
                  <div key={inf.id} className="p-4 border border-dark-200 rounded-xl bg-dark-50/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-dark-800">{inf.sourceTitle}</p>
                          <Badge variant={riskVariants[inf.riskLevel as keyof typeof riskVariants]}>
                            {riskLabels[inf.riskLevel as keyof typeof riskLabels]}
                          </Badge>
                          {inf.evidence && <Badge variant="success">已固定证据</Badge>}
                        </div>
                        <a
                          href={inf.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 truncate"
                        >
                          <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          {inf.sourceUrl}
                        </a>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-dark-400">相似度</p>
                        <p className="text-lg font-bold text-dark-800">{inf.similarity}%</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-dark-200 flex items-center justify-between">
                      <span className="text-xs text-dark-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        发现于 {new Date(inf.detectedAt).toLocaleString("zh-CN")}
                      </span>
                      {!inf.evidence && (
                        <form method="post">
                          <input type="hidden" name="_action" value="fix_evidence" />
                          <input type="hidden" name="infringementId" value={inf.id} />
                          <Button size="sm" variant="primary" icon={<FileCheck2 className="w-3.5 h-3.5" />}>
                            固定证据
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-accent-600" />
              <h3 className="font-semibold text-dark-800">区块链确权凭证</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-dark-500 mb-1">证书编号</p>
                <p className="font-mono text-sm text-dark-800 bg-dark-50 p-2.5 rounded-lg break-all">
                  {work.certificateNo || "生成中..."}
                </p>
              </div>

              <div>
                <p className="text-xs text-dark-500 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  内容指纹 (SHA-256)
                </p>
                <p className="font-mono text-xs text-dark-800 bg-dark-50 p-2.5 rounded-lg break-all">
                  {work.contentHash}
                </p>
              </div>

              <div>
                <p className="text-xs text-dark-500 mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" />
                  区块链交易哈希
                </p>
                <p className="font-mono text-xs text-dark-800 bg-dark-50 p-2.5 rounded-lg break-all">
                  {work.blockchainTxHash || "等待上链..."}
                </p>
              </div>

              <div>
                <p className="text-xs text-dark-500 mb-1">区块高度</p>
                <p className="font-mono text-sm text-dark-800">
                  {work.blockchainBlockNumber?.toLocaleString() || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-dark-500 mb-1">上链时间</p>
                <p className="text-sm text-dark-800">
                  {new Date(work.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-dark-800 mb-4">作品元数据</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-500">作品类型</span>
                <span className="text-dark-800">{workTypeLabels[work.type as WorkType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">作者</span>
                <span className="text-dark-800">{work.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">登记时间</span>
                <span className="text-dark-800">{new Date(work.createdAt).toLocaleDateString("zh-CN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">授权记录</span>
                <span className="text-dark-800">{work.licenses.length} 条</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
