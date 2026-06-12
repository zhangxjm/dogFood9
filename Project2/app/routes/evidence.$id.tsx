import { json, type LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getCurrentUser } from "~/services/user.server";
import { getEvidenceById } from "~/services/evidence.server";
import PageHeader from "~/components/PageHeader";
import Card from "~/components/Card";
import Badge from "~/components/Badge";
import {
  ArrowLeft,
  FileCheck2,
  ShieldCheck,
  Hash,
  Link as LinkIcon,
  Calendar,
  KeyRound,
  Award,
  FileText
} from "lucide-react";

export const loader: LoaderFunction = async ({ params }) => {
  const user = await getCurrentUser();
  const evidence = await getEvidenceById(params.id!);

  if (!evidence || evidence.work.userId !== user.id) {
    return redirect("/evidence");
  }

  return json({ evidence });
};

export default function EvidenceDetail() {
  const data = useLoaderData<typeof loader>();
  const { evidence } = data;

  let snapshotData: any = {};
  try {
    snapshotData = JSON.parse(evidence.contentSnapshot);
  } catch {}

  return (
    <div>
      <Link to="/evidence" className="inline-flex items-center gap-2 text-dark-500 hover:text-dark-700 mb-5 text-sm">
        <ArrowLeft className="w-4 h-4" />
        返回证据列表
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
          <FileCheck2 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark-900">证据详情</h1>
          <p className="mt-1 text-dark-500 flex items-center gap-2">
            证据编号：<span className="font-mono">{evidence.id}</span>
            <Badge variant="success" size="sm">区块链已确认</Badge>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            证据基本信息
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-dark-500 mb-1">关联作品</p>
              <Link to={`/works/${evidence.work.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                {evidence.work.title}
              </Link>
              <p className="text-sm text-dark-500 mt-0.5">作者：{evidence.work.author}</p>
            </div>
            <div>
              <p className="text-xs text-dark-500 mb-1">侵权来源</p>
              <p className="font-medium text-dark-800">{evidence.infringement.sourceTitle}</p>
              <a
                href={evidence.infringement.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-0.5 break-all"
              >
                <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                {evidence.infringement.sourceUrl}
              </a>
            </div>
            <div>
              <p className="text-xs text-dark-500 mb-1">内容相似度</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-2 bg-dark-200 rounded-full overflow-hidden max-w-xs">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${evidence.infringement.similarity}%` }}
                  />
                </div>
                <Badge variant={evidence.infringement.similarity >= 80 ? "danger" : evidence.infringement.similarity >= 50 ? "warning" : "success"}>
                  {evidence.infringement.similarity}%
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-dark-500 mb-1">风险等级</p>
              <Badge variant={evidence.infringement.riskLevel === "HIGH" ? "danger" : evidence.infringement.riskLevel === "MEDIUM" ? "warning" : "success"}>
                {evidence.infringement.riskLevel === "HIGH" ? "高风险" : evidence.infringement.riskLevel === "MEDIUM" ? "中风险" : "低风险"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            存证时间信息
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-dark-50 rounded-xl border border-dark-100">
              <p className="text-xs text-dark-500 mb-1">证据固定时间</p>
              <p className="font-mono text-sm text-dark-800">
                {new Date(evidence.timestamp).toLocaleString("zh-CN")}
              </p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl border border-dark-100">
              <p className="text-xs text-dark-500 mb-1">UTC 标准时间</p>
              <p className="font-mono text-sm text-dark-800">
                {new Date(evidence.timestamp).toISOString()}
              </p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl border border-dark-100">
              <p className="text-xs text-dark-500 mb-1">Unix 时间戳</p>
              <p className="font-mono text-sm text-dark-800">
                {Math.floor(new Date(evidence.timestamp).getTime() / 1000)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary-600" />
            证据哈希值
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-dark-500 mb-1">内容哈希 (SHA-256)</p>
              <div className="p-3 bg-dark-900 rounded-lg">
                <p className="font-mono text-xs text-emerald-400 break-all">{evidence.evidenceHash}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-dark-500 mb-1">数字签名 (HMAC-SHA256)</p>
              <div className="p-3 bg-dark-900 rounded-lg">
                <p className="font-mono text-xs text-amber-400 break-all">{evidence.digitalSignature}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
            区块链存证凭证
          </h3>
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-5 border border-primary-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-primary-800">区块链存证证书</p>
                <p className="text-sm text-primary-600">已写入分布式账本，不可篡改</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-primary-600 mb-1">交易哈希 (Transaction Hash)</p>
                <p className="font-mono text-xs text-primary-800 bg-white/60 p-2 rounded-lg break-all">
                  {evidence.blockchainTxHash}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white/60 rounded-lg">
                  <p className="text-xs text-primary-600">存证状态</p>
                  <p className="font-medium text-primary-800 mt-0.5">已确认</p>
                </div>
                <div className="p-3 bg-white/60 rounded-lg">
                  <p className="text-xs text-primary-600">合法性</p>
                  <p className="font-medium text-primary-800 mt-0.5">可用于司法</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary-600" />
            证据内容快照（已加密存储）
          </h3>
          <div className="p-4 bg-dark-900 rounded-lg font-mono text-xs text-dark-300 overflow-x-auto">
            <pre className="whitespace-pre-wrap break-all">{JSON.stringify(snapshotData, null, 2)}</pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
