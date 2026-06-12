import { json, type LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getCurrentUser } from "~/services/user.server";
import { getLicenseById } from "~/services/license.server";
import PageHeader from "~/components/PageHeader";
import Card from "~/components/Card";
import Badge from "~/components/Badge";
import {
  ArrowLeft,
  HandCoins,
  Calendar,
  User,
  Hash,
  Award,
  FileText,
  Wallet
} from "lucide-react";
import type { LicenseType, LicenseStatus } from "~/types";

export const loader: LoaderFunction = async ({ params, request }) => {
  const user = await getCurrentUser();
  const license = await getLicenseById(params.id!);

  if (!license || (license.licensorId !== user.id && license.licenseeId !== user.id)) {
    return redirect("/license");
  }

  const url = new URL(request.url);
  const purchased = url.searchParams.get("purchased") === "true";

  return json({ license, purchased });
};

const workTypeLabels = {
  MUSIC: "音乐作品",
  VIDEO: "视频作品",
  TEXT: "文字作品"
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

export default function LicenseDetail() {
  const data = useLoaderData<typeof loader>();
  const { license, purchased } = data;
  const settlement = license.settlements[0];

  return (
    <div>
      {purchased && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <HandCoins className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-medium text-emerald-800">授权购买成功！</h4>
            <p className="text-sm text-emerald-700 mt-0.5">
              版税已自动结算至创作者账户，您可以在下方查看授权协议详情。
            </p>
          </div>
        </div>
      )}

      <Link to="/license" className="inline-flex items-center gap-2 text-dark-500 hover:text-dark-700 mb-5 text-sm">
        <ArrowLeft className="w-4 h-4" />
        返回授权交易
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg">
          <HandCoins className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark-900">授权协议详情</h1>
          <p className="mt-1 text-dark-500 flex items-center gap-2">
            协议编号：<span className="font-mono">{license.id}</span>
            <Badge variant={licenseStatusVariants[license.status as LicenseStatus]} size="sm">
              {licenseStatusLabels[license.status as LicenseStatus]}
            </Badge>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            授权作品信息
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-dark-500 mb-1">作品名称</p>
              <Link to={`/works/${license.work.id}`} className="text-primary-600 hover:text-primary-700 font-medium text-lg">
                {license.work.title}
              </Link>
            </div>
            <div>
              <p className="text-xs text-dark-500 mb-1">作品类型</p>
              <Badge variant="info">{workTypeLabels[license.work.type as keyof typeof workTypeLabels]}</Badge>
            </div>
            <div>
              <p className="text-xs text-dark-500 mb-1">作者</p>
              <p className="font-medium text-dark-800">{license.work.author}</p>
            </div>
            {license.work.description && (
              <div>
                <p className="text-xs text-dark-500 mb-1">作品描述</p>
                <p className="text-dark-700 text-sm leading-relaxed">{license.work.description}</p>
              </div>
            )}
            {license.work.certificateNo && (
              <div>
                <p className="text-xs text-dark-500 mb-1">版权证书编号</p>
                <p className="font-mono text-sm text-dark-800 bg-dark-50 p-2.5 rounded-lg">{license.work.certificateNo}</p>
              </div>
            )}
            {license.work.contentHash && (
              <div>
                <p className="text-xs text-dark-500 mb-1">内容指纹 (SHA-256)</p>
                <p className="font-mono text-xs text-dark-800 bg-dark-50 p-2.5 rounded-lg break-all">{license.work.contentHash}</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" />
            协议双方信息
          </h3>
          <div className="space-y-5">
            <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
              <p className="text-xs text-primary-600 mb-1">授权方（版权所有者）</p>
              <p className="font-semibold text-primary-800 text-lg">{license.licensor.name}</p>
              <p className="text-sm text-primary-600 mt-0.5">{license.licensor.email}</p>
            </div>
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-dark-200 flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-dark-500 rotate-180" />
              </div>
            </div>
            <div className="p-4 bg-accent-50 rounded-xl border border-accent-100">
              <p className="text-xs text-accent-600 mb-1">被授权方（使用者）</p>
              <p className="font-semibold text-accent-800 text-lg">{license.licensee.name}</p>
              <p className="text-sm text-accent-600 mt-0.5">{license.licensee.email}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            授权条款
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-dark-50 rounded-lg">
                <p className="text-xs text-dark-500 mb-1">授权类型</p>
                <Badge variant={licenseTypeVariants[license.type as LicenseType]}>{licenseTypeLabels[license.type as LicenseType]}</Badge>
              </div>
              <div className="p-3 bg-dark-50 rounded-lg">
                <p className="text-xs text-dark-500 mb-1">授权期限</p>
                <p className="font-medium text-dark-800">{license.duration} 天</p>
              </div>
            </div>
            <div className="p-4 bg-dark-50 rounded-lg">
              <p className="text-xs text-dark-500 mb-1">授权有效期</p>
              <p className="font-medium text-dark-800">
                {new Date(license.startDate).toLocaleString("zh-CN")}
                <span className="mx-2 text-dark-400">—</span>
                {new Date(license.endDate).toLocaleString("zh-CN")}
              </p>
            </div>
            <div className="p-4 bg-accent-50 rounded-xl border border-accent-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-accent-600 mb-1">授权金额</p>
                  <p className="text-3xl font-bold text-accent-700">¥{license.price.toFixed(2)}</p>
                </div>
                <Wallet className="w-10 h-10 text-accent-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" />
            版税结算信息
          </h3>
          {settlement ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600">结算状态</p>
                  <p className="font-semibold text-emerald-800 mt-0.5">已自动完成结算</p>
                </div>
                <Badge variant="success">已结算</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-dark-100">
                  <span className="text-dark-500">授权总金额</span>
                  <span className="font-medium text-dark-800">¥{settlement.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dark-100">
                  <span className="text-dark-500">平台服务费 (10%)</span>
                  <span className="font-medium text-red-600">-¥{settlement.platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-dark-700 font-medium">创作者实得</span>
                  <span className="font-bold text-emerald-600 text-lg">¥{settlement.netAmount.toFixed(2)}</span>
                </div>
              </div>
              {settlement.settledAt && (
                <div className="pt-3 mt-3 border-t border-dark-100">
                  <p className="text-xs text-dark-500">结算时间</p>
                  <p className="text-sm text-dark-700 mt-0.5">{new Date(settlement.settledAt).toLocaleString("zh-CN")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-400">
              暂无结算记录
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary-600" />
            授权协议编号
          </h3>
          <div className="p-4 bg-dark-900 rounded-lg">
            <p className="font-mono text-xs text-emerald-400 break-all">{license.id}</p>
          </div>
          <p className="mt-3 text-sm text-dark-500">
            此授权协议受系统智能合约自动执行，所有交易记录已在区块链上存证，具备法律效力。
          </p>
        </Card>
      </div>
    </div>
  );
}
