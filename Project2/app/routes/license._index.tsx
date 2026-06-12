import { useState } from "react";
import { json, type LoaderFunction, type ActionFunction, redirect } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { getCurrentUser, DEFAULT_LICENSEE_ID, getAllUsers } from "~/services/user.server";
import { getAllWorksForMarket } from "~/services/work.server";
import { getLicensesByLicensor, getLicensesByLicensee, purchaseLicense, getLicenseStats } from "~/services/license.server";
import PageHeader from "~/components/PageHeader";
import Card from "~/components/Card";
import Button from "~/components/Button";
import Badge from "~/components/Badge";
import StatCard from "~/components/StatCard";
import Modal from "~/components/Modal";
import { TextInput, SelectInput } from "~/components/FormInputs";
import {
  HandCoins,
  Music,
  Video,
  FileText,
  ShoppingCart,
  ArrowRight,
  ExternalLink,
  Calendar,
  Tag,
  Crown,
  Users,
  Clock,
  Check
} from "lucide-react";
import type { WorkType, LicenseType, LicenseStatus } from "~/types";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getCurrentUser();
  const users = await getAllUsers();
  const url = new URL(request.url);
  const type = url.searchParams.get("type") as WorkType | undefined;

  const [works, soldLicenses, purchasedLicenses, stats] = await Promise.all([
    getAllWorksForMarket({ type }),
    getLicensesByLicensor(user.id),
    getLicensesByLicensee(user.id),
    getLicenseStats(user.id, user.role as "CREATOR" | "LICENSEE")
  ]);

  return json({ user, users, works, soldLicenses, purchasedLicenses, stats, defaultLicenseeId: DEFAULT_LICENSEE_ID });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const workId = String(formData.get("workId") || "");
  const type = String(formData.get("type") || "NON_EXCLUSIVE") as LicenseType;
  const price = parseFloat(String(formData.get("price") || "0"));
  const durationDays = parseInt(String(formData.get("durationDays") || "365"));
  const user = await getCurrentUser();

  if (!workId || price <= 0) {
    return json({ error: "请填写有效的授权信息" });
  }

  try {
    const result = await purchaseLicense(workId, user.id, type, price, durationDays);
    return redirect(`/license/${result.id}?purchased=true`);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "购买失败" });
  }
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

const licenseTypeLabels = {
  EXCLUSIVE: "独家授权",
  NON_EXCLUSIVE: "非独家授权"
};

const licenseTypeVariants = {
  EXCLUSIVE: "accent",
  NON_EXCLUSIVE: "info"
} as const;

const licenseStatusLabels = {
  ACTIVE: "有效中",
  EXPIRED: "已过期",
  TERMINATED: "已终止"
};

const licenseStatusVariants = {
  ACTIVE: "success",
  EXPIRED: "warning",
  TERMINATED: "danger"
} as const;

interface PurchaseModalState {
  isOpen: boolean;
  workId: string;
  workTitle: string;
  workType: string;
  workAuthor: string;
}

export default function License() {
  const data = useLoaderData<typeof loader>();
  const [tab, setTab] = useState<"market" | "sold" | "purchased">("market");
  const [purchaseModal, setPurchaseModal] = useState<PurchaseModalState | null>(null);
  const [purchasePrice, setPurchasePrice] = useState(500);
  const [purchaseType, setPurchaseType] = useState<LicenseType>("NON_EXCLUSIVE");
  const [purchaseDuration, setPurchaseDuration] = useState(365);

  const openPurchaseModal = (work: any) => {
    setPurchaseModal({
      isOpen: true,
      workId: work.id,
      workTitle: work.title,
      workType: work.type,
      workAuthor: work.author
    });
    setPurchasePrice(work.type === "MUSIC" ? 800 : work.type === "VIDEO" ? 1500 : 300);
  };

  return (
    <div>
      <PageHeader
        title="授权交易"
        description="浏览版权授权市场，购买作品使用权，或管理您已售出/购买的授权。"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <StatCard
          title="市场作品数"
          value={data.works.length}
          icon={<Tag className="w-6 h-6 text-white" />}
          gradient="from-primary-600 to-primary-800"
        />
        <StatCard
          title={data.user.role === "CREATOR" ? "已售出授权" : "已购买授权"}
          value={(data.stats as any).total ?? 0}
          icon={<HandCoins className="w-6 h-6 text-white" />}
          gradient="from-accent-500 to-accent-700"
        />
        <StatCard
          title="进行中授权"
          value={(data.stats as any).active ?? 0}
          icon={<Clock className="w-6 h-6 text-white" />}
          gradient="from-emerald-500 to-emerald-700"
        />
      </div>

      <Card className="mb-5" padding="sm">
        <div className="flex gap-1 p-1">
          {[
            { key: "market", label: "授权市场", icon: ShoppingCart },
            { key: "sold", label: "我售出的", icon: Users },
            { key: "purchased", label: "我购买的", icon: Crown }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  tab === t.key
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-dark-600 hover:bg-dark-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </Card>

      {tab === "market" && (
        <>
          <Form method="get" className="mb-5">
            <div className="flex gap-3">
              <select
                name="type"
                className="px-4 py-2.5 border border-dark-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                defaultValue=""
              >
                <option value="">全部作品类型</option>
                <option value="MUSIC">音乐作品</option>
                <option value="VIDEO">视频作品</option>
                <option value="TEXT">文字作品</option>
              </select>
              <Button type="submit" variant="secondary">筛选</Button>
            </div>
          </Form>

          {data.works.length === 0 ? (
            <Card>
              <div className="text-center py-16">
                <ShoppingCart className="w-16 h-16 mx-auto text-dark-300 mb-4" />
                <h3 className="text-lg font-medium text-dark-800">授权市场暂无作品</h3>
                <p className="mt-1 text-dark-500">先登记作品，确权后即可在授权市场展示</p>
                <Link to="/register">
                  <Button className="mt-5">登记作品</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.works.map((work: any) => {
                const Icon = workTypeIcons[work.type as WorkType];
                const suggestedPrice = work.type === "MUSIC" ? 800 : work.type === "VIDEO" ? 1500 : 300;
                return (
                  <Card key={work.id} hover className="flex flex-col">
                    <div className={`w-full h-36 rounded-lg flex items-center justify-center mb-4 ${
                      work.type === "MUSIC" ? "bg-gradient-to-br from-purple-100 to-purple-200" :
                      work.type === "VIDEO" ? "bg-gradient-to-br from-blue-100 to-blue-200" :
                      "bg-gradient-to-br from-emerald-100 to-emerald-200"
                    }`}>
                      <Icon className={`w-14 h-14 ${
                        work.type === "MUSIC" ? "text-purple-600" :
                        work.type === "VIDEO" ? "text-blue-600" :
                        "text-emerald-600"
                      }`} />
                    </div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-dark-800 line-clamp-1">{work.title}</h3>
                      <Badge variant="info">{workTypeLabels[work.type as WorkType]}</Badge>
                    </div>
                    <p className="text-sm text-dark-500">作者：{work.author}</p>
                    {work.description && (
                      <p className="mt-2 text-sm text-dark-500 line-clamp-2">{work.description}</p>
                    )}
                    <div className="mt-4 pt-4 border-t border-dark-100 flex items-end justify-between flex-1">
                      <div>
                        <p className="text-xs text-dark-400">建议授权价格</p>
                        <p className="text-2xl font-bold text-accent-600">¥{suggestedPrice}</p>
                      </div>
                      <Button
                        size="sm"
                        icon={<ShoppingCart className="w-3.5 h-3.5" />}
                        onClick={() => openPurchaseModal(work)}
                      >
                        购买授权
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "sold" && (
        <Card padding="sm">
          {data.soldLicenses.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto text-dark-300 mb-4" />
              <h3 className="text-lg font-medium text-dark-800">暂无售出记录</h3>
              <p className="mt-1 text-dark-500">您的作品被购买授权后将在此处显示</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-200 bg-dark-50">
                    <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">作品</th>
                    <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">授权方</th>
                    <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">类型</th>
                    <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">金额</th>
                    <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">有效期</th>
                    <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">状态</th>
                    <th className="text-right text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-100">
                  {data.soldLicenses.map((lic: any) => (
                    <tr key={lic.id} className="hover:bg-dark-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-dark-800">{lic.work.title}</p>
                        <p className="text-xs text-dark-500 mt-0.5">{workTypeLabels[lic.work.type as WorkType]}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-dark-600">{lic.licensee.name}</td>
                      <td className="px-5 py-4">
                        <Badge variant={licenseTypeVariants[lic.type as LicenseType]}>{licenseTypeLabels[lic.type as LicenseType]}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-accent-600">¥{lic.price}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-dark-600">
                        {new Date(lic.startDate).toLocaleDateString("zh-CN")} - {new Date(lic.endDate).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={licenseStatusVariants[lic.status as LicenseStatus]}>{licenseStatusLabels[lic.status as LicenseStatus]}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link to={`/license/${lic.id}`}>
                          <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>查看</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "purchased" && (
        <Card padding="sm">
          {data.purchasedLicenses.length === 0 ? (
            <div className="text-center py-16">
              <Crown className="w-16 h-16 mx-auto text-dark-300 mb-4" />
              <h3 className="text-lg font-medium text-dark-800">暂无购买记录</h3>
              <p className="mt-1 text-dark-500">在授权市场购买作品使用权限</p>
              <Button className="mt-5" onClick={() => setTab("market")}>浏览市场</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-200 bg-dark-50">
                    <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">作品</th>
                    <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">版权方</th>
                    <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">类型</th>
                    <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">金额</th>
                    <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">有效期</th>
                    <th className="text-left text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">状态</th>
                    <th className="text-right text-xs font-medium text-dark-500 uppercase tracking-wider px-5 py-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-100">
                  {data.purchasedLicenses.map((lic: any) => (
                    <tr key={lic.id} className="hover:bg-dark-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-dark-800">{lic.work.title}</p>
                        <p className="text-xs text-dark-500 mt-0.5">{workTypeLabels[lic.work.type as WorkType]}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-dark-600">{lic.licensor.name}</td>
                      <td className="px-5 py-4">
                        <Badge variant={licenseTypeVariants[lic.type as LicenseType]}>{licenseTypeLabels[lic.type as LicenseType]}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-accent-600">¥{lic.price}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-dark-600">
                        {new Date(lic.startDate).toLocaleDateString("zh-CN")} - {new Date(lic.endDate).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={licenseStatusVariants[lic.status as LicenseStatus]}>{licenseStatusLabels[lic.status as LicenseStatus]}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link to={`/license/${lic.id}`}>
                          <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>查看</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Modal
        isOpen={!!purchaseModal?.isOpen}
        onClose={() => setPurchaseModal(null)}
        title="购买版权授权"
      >
        {purchaseModal && (
          <Form method="post">
            <input type="hidden" name="workId" value={purchaseModal.workId} />

            <div className="mb-5 p-4 bg-dark-50 rounded-xl border border-dark-100">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  purchaseModal.workType === "MUSIC" ? "bg-purple-100" :
                  purchaseModal.workType === "VIDEO" ? "bg-blue-100" :
                  "bg-emerald-100"
                }`}>
                  {(() => {
                    const Icon = workTypeIcons[purchaseModal.workType as WorkType];
                    return <Icon className={`w-6 h-6 ${
                      purchaseModal.workType === "MUSIC" ? "text-purple-600" :
                      purchaseModal.workType === "VIDEO" ? "text-blue-600" :
                      "text-emerald-600"
                    }`} />;
                  })()}
                </div>
                <div>
                  <p className="font-semibold text-dark-800">{purchaseModal.workTitle}</p>
                  <p className="text-sm text-dark-500">作者：{purchaseModal.workAuthor} · {workTypeLabels[purchaseModal.workType as WorkType]}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SelectInput
                label="授权类型"
                name="type"
                required
                options={[
                  { value: "NON_EXCLUSIVE", label: "非独家授权 - 可被多人同时使用" },
                  { value: "EXCLUSIVE", label: "独家授权 - 仅授权给您一人" }
                ]}
                value={purchaseType}
                onChange={e => setPurchaseType(e.target.value as LicenseType)}
              />

              <TextInput
                label="授权价格 (元)"
                name="price"
                type="number"
                min="1"
                step="1"
                required
                value={purchasePrice}
                onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)}
              />

              <SelectInput
                label="授权期限"
                name="durationDays"
                required
                options={[
                  { value: "30", label: "30 天" },
                  { value: "90", label: "90 天" },
                  { value: "180", label: "180 天" },
                  { value: "365", label: "1 年" },
                  { value: "730", label: "2 年" },
                  { value: "3650", label: "永久授权 (10年)" }
                ]}
                value={purchaseDuration}
                onChange={e => setPurchaseDuration(parseInt(e.target.value))}
              />

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-emerald-700">
                    <p className="font-medium">购买即自动完成版税结算</p>
                    <p className="mt-1 text-emerald-600">
                      平台收取 10% 服务费，创作者将获得 ¥{Math.round((purchasePrice * 0.9) * 100) / 100}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-5 border-t border-dark-100">
              <Button variant="secondary" type="button" onClick={() => setPurchaseModal(null)}>
                取消
              </Button>
              <Button icon={<ShoppingCart className="w-4 h-4" />} type="submit">
                确认购买 ¥{purchasePrice}
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
}
