import { useState } from "react";
import { json, type ActionFunction, redirect } from "@remix-run/node";
import { useActionData, useNavigation, Link } from "@remix-run/react";
import { getCurrentUser } from "~/services/user.server";
import { createWork } from "~/services/work.server";
import PageHeader from "~/components/PageHeader";
import Card from "~/components/Card";
import Button from "~/components/Button";
import Badge from "~/components/Badge";
import { TextInput, TextAreaInput, SelectInput } from "~/components/FormInputs";
import {
  Upload,
  CheckCircle2,
  Lock,
  ArrowRight,
  FileText,
  ShieldCheck,
  Award
} from "lucide-react";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const user = await getCurrentUser();

  const title = String(formData.get("title") || "");
  const type = String(formData.get("type") || "TEXT");
  const author = String(formData.get("author") || user.name);
  const description = String(formData.get("description") || "");
  const content = String(formData.get("content") || "");

  if (!title || !content) {
    return json({ error: "作品标题和内容不能为空", success: false });
  }

  try {
    const result = await createWork({
      title,
      type: type as any,
      author,
      description,
      content,
      userId: user.id
    });

    return redirect(`/works/${result.work.id}?registered=true`);
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : "登记失败",
      success: false
    });
  }
};

const steps = [
  { key: "upload", label: "上传作品", icon: Upload },
  { key: "chain", label: "区块链确权", icon: Lock },
  { key: "complete", label: "完成", icon: CheckCircle2 }
];

export default function Register() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [step, setStep] = useState(0);

  return (
    <div>
      <PageHeader
        title="作品登记"
        description="上传您的原创作品，系统将自动生成数字指纹并存证至区块链，完成版权确权。"
        actions={
          <Link to="/works">
            <Button variant="secondary">查看我的作品</Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = idx === step;
            const isDone = idx < step;

            return (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isDone
                        ? "bg-primary-600 border-primary-600 text-white"
                        : isActive
                        ? "bg-primary-50 border-primary-600 text-primary-700"
                        : "bg-dark-50 border-dark-200 text-dark-400"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      isActive || isDone ? "text-dark-700" : "text-dark-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      isDone ? "bg-primary-600" : "bg-dark-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <form method="post" onSubmit={() => setStep(1)}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextInput
                  label="作品标题"
                  name="title"
                  placeholder="请输入作品标题"
                  required
                />
                <SelectInput
                  label="作品类型"
                  name="type"
                  required
                  options={[
                    { value: "TEXT", label: "文字作品" },
                    { value: "MUSIC", label: "音乐作品" },
                    { value: "VIDEO", label: "视频作品" }
                  ]}
                />
              </div>

              <TextInput
                label="作者姓名"
                name="author"
                placeholder="请输入作者姓名"
                required
              />

              <TextAreaInput
                label="作品描述"
                name="description"
                placeholder="简要描述您的作品内容、创作背景等信息"
                rows={3}
              />

              <TextAreaInput
                label="作品内容"
                name="content"
                placeholder="请输入作品内容文本，或粘贴作品主要内容用于生成数字指纹"
                rows={10}
                required
                hint="内容将用于生成SHA-256数字指纹，确保作品唯一性可验证"
              />

              {actionData?.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {actionData.error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Link to="/">
                  <Button variant="secondary" type="button">
                    取消
                  </Button>
                </Link>
                <Button
                  type="submit"
                  icon={<ShieldCheck className="w-4 h-4" />}
                  loading={isSubmitting}
                >
                  {isSubmitting ? "正在确权上链..." : "提交并自动确权"}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h4 className="font-medium text-dark-800">区块链存证</h4>
                <p className="mt-1 text-sm text-dark-500">
                  系统自动生成SHA-256数字指纹，写入模拟区块链网络，获得唯一交易哈希。
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <h4 className="font-medium text-dark-800">自动确权证书</h4>
                <p className="mt-1 text-sm text-dark-500">
                  确权成功后自动生成版权证书，包含证书编号、区块链凭证，具备法律效力。
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-medium text-dark-800">全网监测启动</h4>
                <p className="mt-1 text-sm text-dark-500">
                  已确权作品自动进入监测库，Meilisearch引擎将持续进行侵权内容秒级检索。
                </p>
              </div>
            </div>
          </Card>

          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="accent">全自动化</Badge>
            </div>
            <p className="text-white/90 text-sm">
              零人工审批，提交后自动完成所有确权流程，预计30秒内获得区块链凭证。
            </p>
            <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
              <ArrowRight className="w-4 h-4" />
              <span>确权完成后自动进入授权市场</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
