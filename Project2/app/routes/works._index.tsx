import { useState } from "react";
import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getCurrentUser } from "~/services/user.server";
import { getWorksByUser } from "~/services/work.server";
import PageHeader from "~/components/PageHeader";
import Card from "~/components/Card";
import Button from "~/components/Button";
import Badge from "~/components/Badge";
import { TextInput, SelectInput } from "~/components/FormInputs";
import {
  FolderKanban,
  Music,
  Video,
  FileText,
  Search,
  Grid3X3,
  List,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import type { WorkType, WorkStatus } from "~/types";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getCurrentUser();
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const works = await getWorksByUser(user.id, {
    type: type as WorkType | undefined,
    status,
    search
  });

  return json({ works });
};

const workTypeIcons = {
  MUSIC: Music,
  VIDEO: Video,
  TEXT: FileText
};

const workTypeLabels = {
  MUSIC: "音乐",
  VIDEO: "视频",
  TEXT: "文字"
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

export default function Works() {
  const data = useLoaderData<typeof loader>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div>
      <PageHeader
        title="我的作品"
        description="管理您已登记的所有作品，查看确权状态和区块链凭证。"
        actions={
          <Link to="/register">
            <Button icon={<FolderKanban className="w-4 h-4" />}>
              登记新作品
            </Button>
          </Link>
        }
      />

      <Card className="mb-5">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <form className="flex flex-col sm:flex-row gap-3 w-full md:w-auto" method="get">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                name="search"
                placeholder="搜索作品标题、作者..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select
              name="type"
              className="px-3 py-2.5 border border-dark-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部类型</option>
              <option value="MUSIC">音乐作品</option>
              <option value="VIDEO">视频作品</option>
              <option value="TEXT">文字作品</option>
            </select>
            <Button type="submit" size="sm">筛选</Button>
          </form>

          <div className="flex items-center gap-1 bg-dark-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-white text-primary-600 shadow-sm" : "text-dark-500 hover:text-dark-700"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list" ? "bg-white text-primary-600 shadow-sm" : "text-dark-500 hover:text-dark-700"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {data.works.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-dark-100 flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-dark-400" />
            </div>
            <h3 className="text-lg font-medium text-dark-800">暂无作品</h3>
            <p className="mt-1 text-dark-500">开始登记您的第一件原创作品吧</p>
            <Link to="/register">
              <Button className="mt-5">立即登记作品</Button>
            </Link>
          </div>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.works.map((work: any) => {
            const Icon = workTypeIcons[work.type as WorkType];
            return (
              <Link key={work.id} to={`/works/${work.id}`}>
                <Card hover className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      work.type === "MUSIC" ? "bg-purple-100" :
                      work.type === "VIDEO" ? "bg-blue-100" :
                      "bg-emerald-100"
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        work.type === "MUSIC" ? "text-purple-600" :
                        work.type === "VIDEO" ? "text-blue-600" :
                        "text-emerald-600"
                      }`} />
                    </div>
                    <Badge variant={statusVariants[work.status as WorkStatus]}>
                      {statusLabels[work.status as WorkStatus]}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-dark-800 line-clamp-1">{work.title}</h3>
                  <p className="mt-1 text-sm text-dark-500">作者：{work.author}</p>
                  {work.description && (
                    <p className="mt-2 text-sm text-dark-500 line-clamp-2">{work.description}</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-dark-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-dark-500">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                        {work._count.infringements} 监测
                      </span>
                      <span>{work._count.licenses} 授权</span>
                    </div>
                    <div className="flex items-center text-primary-600 text-sm font-medium">
                      详情 <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-200">
                  <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">作品</th>
                  <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">类型</th>
                  <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">状态</th>
                  <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">监测/授权</th>
                  <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">登记时间</th>
                  <th className="text-right text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {data.works.map((work: any) => (
                  <tr key={work.id} className="hover:bg-dark-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-dark-800">{work.title}</p>
                      </div>
                      <p className="text-sm text-dark-500 mt-0.5">作者：{work.author}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="info">{workTypeLabels[work.type as WorkType]}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusVariants[work.status as WorkStatus]}>
                        {statusLabels[work.status as WorkStatus]}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-dark-600">
                      {work._count.infringements} / {work._count.licenses}
                    </td>
                    <td className="px-5 py-4 text-sm text-dark-500">
                      {new Date(work.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/works/${work.id}`}>
                        <Button variant="ghost" size="sm">查看详情</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
