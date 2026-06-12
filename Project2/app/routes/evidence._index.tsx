import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getCurrentUser } from "~/services/user.server";
import { getEvidencesByUser, getEvidenceStats } from "~/services/evidence.server";
import PageHeader from "~/components/PageHeader";
import Card from "~/components/Card";
import Button from "~/components/Button";
import Badge from "~/components/Badge";
import StatCard from "~/components/StatCard";
import {
  FileCheck2,
  ShieldCheck,
  ExternalLink,
  Calendar,
  Hash,
  ArrowRight,
  Link as LinkIcon
} from "lucide-react";

export const loader: LoaderFunction = async () => {
  const user = await getCurrentUser();
  const [evidences, stats] = await Promise.all([
    getEvidencesByUser(user.id),
    getEvidenceStats(user.id)
  ]);

  return json({ evidences, stats });
};

export default function Evidence() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader
        title="证据中心"
        description="侵权证据已自动截取并上链存证，生成具备法律效力的电子证据凭证。"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <StatCard
          title="证据总数"
          value={data.stats.total}
          icon={<FileCheck2 className="w-6 h-6 text-white" />}
          gradient="from-primary-600 to-primary-800"
        />
        <StatCard
          title="区块链已确认"
          value={data.stats.confirmed}
          icon={<ShieldCheck className="w-6 h-6 text-white" />}
          gradient="from-emerald-500 to-emerald-700"
          trend={{ value: "100% 已上链", positive: true }}
        />
        <StatCard
          title="存证成功率"
          value="100%"
          icon={<Hash className="w-6 h-6 text-white" />}
          gradient="from-dark-700 to-dark-900"
        />
      </div>

      <Card padding="sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
          <h3 className="font-semibold text-dark-800">证据列表</h3>
          <Badge variant="success">全部已上链存证</Badge>
        </div>

        {data.evidences.length === 0 ? (
          <div className="text-center py-16">
            <FileCheck2 className="w-16 h-16 mx-auto text-dark-300 mb-4" />
            <h3 className="text-lg font-medium text-dark-800">暂无证据记录</h3>
            <p className="mt-1 text-dark-500">在侵权监测页面发现侵权后，可固定证据并存证至区块链</p>
            <Link to="/monitor">
              <Button className="mt-5">前往侵权监测</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-200 bg-dark-50">
                  <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">证据编号</th>
                  <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">关联作品</th>
                  <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">侵权来源</th>
                  <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">相似度</th>
                  <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">固定时间</th>
                  <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">状态</th>
                  <th className="text-right text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {data.evidences.map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-dark-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm text-dark-700">
                        {ev.id.substring(0, 8).toUpperCase()}...
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link to={`/works/${ev.work.id}`} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                        {ev.work.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={ev.infringement.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-dark-600 hover:text-primary-600 flex items-center gap-1 truncate max-w-xs"
                      >
                        <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{ev.infringement.sourceUrl}</span>
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={ev.infringement.similarity >= 80 ? "danger" : ev.infringement.similarity >= 50 ? "warning" : "success"}>
                        {ev.infringement.similarity}%
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-dark-600">
                      {new Date(ev.timestamp).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="success">区块链已确认</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/evidence/${ev.id}`}>
                        <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                          查看详情
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
