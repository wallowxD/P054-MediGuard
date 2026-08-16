"use client";

import { ChevronDown, Save, ShieldCheck } from "lucide-react";
import { useId, useState } from "react";
import Button from "@/components/ui/Button";
import {
  useAddHealthCondition,
  useDeleteHealthCondition,
  useHealthProfile,
  useUpdateHealthProfile,
} from "@/queries/interactions";

const CONDITIONS: { code: TConditionCode; diseaseName: string; label: string }[] = [
  { code: "mang-thai", diseaseName: "Mang thai", label: "Đang mang thai" },
  { code: "cho-con-bu", diseaseName: "Phụ nữ cho con bú", label: "Đang cho con bú" },
];

export { CONDITIONS };

const SEX_LABELS: Record<NonNullable<IHealthProfileUpdate["sex"]>, string> = {
  nu: "Nữ",
  nam: "Nam",
  khac: "Khác",
};

export default function HealthProfilePanel({
  applied,
  onAppliedChange,
}: {
  applied: TConditionCode[];
  onAppliedChange: (codes: TConditionCode[]) => void;
}) {
  const { data: profile, isLoading } = useHealthProfile();
  const update = useUpdateHealthProfile();
  const addCondition = useAddHealthCondition();
  const deleteCondition = useDeleteHealthCondition();
  const [selectedSex, setSelectedSex] = useState<IHealthProfileUpdate["sex"]>();
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const displayedSex = selectedSex ?? profile?.sex ?? "";
  const profileSummary = [
    profile?.dateOfBirth
      ? `Sinh ngày ${new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")}`
      : null,
    profile?.sex ? SEX_LABELS[profile.sex] : null,
    profile?.weightKg ? `${profile.weightKg} kg` : null,
    profile?.heightCm ? `${profile.heightCm} cm` : null,
  ].filter(Boolean);

  const submit = (formData: FormData) =>
    update.mutate({
      dateOfBirth: String(formData.get("dateOfBirth") || "") || null,
      sex: displayedSex || null,
      weightKg: formData.get("weightKg") ? Number(formData.get("weightKg")) : null,
      heightCm: formData.get("heightCm") ? Number(formData.get("heightCm")) : null,
      consent: formData.get("consent") === "on",
    });

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border/80 bg-background-elevated"
      aria-labelledby="health-profile-title"
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-surface/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span id="health-profile-title" className="text-sm font-semibold text-foreground">
              Hồ sơ sức khỏe tự khai
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                profile?.consentedAt
                  ? "bg-success/10 text-success"
                  : "bg-surface text-foreground-muted"
              }`}
            >
              {profile?.consentedAt ? "Đã lưu" : "Chưa thiết lập"}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-xs leading-5 text-foreground-muted">
            {isLoading
              ? "Đang tải hồ sơ..."
              : profileSummary.length > 0
                ? profileSummary.join(", ")
                : "Thêm thông tin để hỗ trợ lựa chọn điều kiện tra cứu."}
          </span>
        </span>
        <span className="hidden text-xs font-semibold text-primary sm:inline">
          {expanded ? "Thu gọn" : "Chỉnh sửa"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-foreground-muted transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {displayedSex === "nu" ? (
        <div className="border-t border-border/70 bg-surface/20 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Áp dụng cho lần tra cứu này</p>
              <p className="mt-0.5 text-[11px] leading-4 text-foreground-muted">
                Chỉ bật tình trạng đúng với bạn ở thời điểm hiện tại.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((condition) => {
                const saved = profile?.conditions?.find(
                  (item) => item.conditionCode === condition.code
                );
                const active = applied.includes(condition.code);
                return (
                  <label
                    key={condition.code}
                    className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-colors ${
                      active
                        ? "border-primary/35 bg-primary/10 text-primary"
                        : "border-border/80 bg-background-elevated text-foreground-secondary hover:border-primary/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() =>
                        onAppliedChange(
                          active
                            ? applied.filter((value) => value !== condition.code)
                            : [...applied, condition.code]
                        )
                      }
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>{condition.label}</span>
                    {saved ? <span className="sr-only">Đã lưu trong hồ sơ</span> : null}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {expanded ? (
        <div id={contentId} className="border-t border-border/70 px-4 pb-5 pt-4 sm:px-5">
          {isLoading ? (
            <p className="text-xs text-foreground-muted">Đang tải hồ sơ...</p>
          ) : (
            <form key={profile?.consentedAt ?? "empty"} action={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1.5 text-xs font-medium text-foreground-secondary">
                  Ngày sinh
                  <input
                    name="dateOfBirth"
                    type="date"
                    defaultValue={profile?.dateOfBirth ?? ""}
                    className="block min-h-11 w-full rounded-xl border border-border bg-input px-3.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-medium text-foreground-secondary">
                  Giới tính
                  <select
                    name="sex"
                    value={displayedSex}
                    onChange={(event) => {
                      const nextSex = (event.target.value || null) as IHealthProfileUpdate["sex"];
                      setSelectedSex(nextSex);
                      if (nextSex !== "nu") onAppliedChange([]);
                    }}
                    className="block min-h-11 w-full rounded-xl border border-border bg-input px-3.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                  >
                    <option value="">Chưa chọn</option>
                    <option value="nu">Nữ</option>
                    <option value="nam">Nam</option>
                    <option value="khac">Khác</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-xs font-medium text-foreground-secondary">
                  Cân nặng (kg)
                  <input
                    name="weightKg"
                    type="number"
                    min="1"
                    max="300"
                    step="0.1"
                    defaultValue={profile?.weightKg ?? ""}
                    placeholder="Ví dụ: 60"
                    className="block min-h-11 w-full rounded-xl border border-border bg-input px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-medium text-foreground-secondary">
                  Chiều cao (cm)
                  <input
                    name="heightCm"
                    type="number"
                    min="1"
                    max="250"
                    step="0.1"
                    defaultValue={profile?.heightCm ?? ""}
                    placeholder="Ví dụ: 165"
                    className="block min-h-11 w-full rounded-xl border border-border bg-input px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>
              </div>

              <label className="flex items-start gap-2.5 text-xs leading-5 text-foreground-secondary">
                <input
                  name="consent"
                  type="checkbox"
                  defaultChecked={Boolean(profile?.consentedAt)}
                  required
                  className="mt-1 rounded text-primary focus:ring-primary"
                />
                <span>
                  Tôi đồng ý lưu dữ liệu sức khỏe tự khai để dùng lại. Tôi có thể xóa từng
                  tình trạng bất kỳ lúc nào.
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" variant="outline" size="sm" disabled={update.isPending}>
                  <Save className="h-4 w-4" aria-hidden />
                  {update.isPending ? "Đang lưu..." : "Lưu hồ sơ sức khỏe"}
                </Button>
                {update.isSuccess ? (
                  <p role="status" className="text-xs font-medium text-success">
                    Đã lưu thay đổi.
                  </p>
                ) : null}
                {update.isError ? (
                  <p className="text-xs text-error">Không thể lưu hồ sơ. Vui lòng kiểm tra lại.</p>
                ) : null}
              </div>
            </form>
          )}

          {displayedSex === "nu" ? (
            <div className="mt-4 border-t border-border/70 pt-4">
              <p className="text-xs font-semibold text-foreground">Lưu tình trạng trong hồ sơ</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                {CONDITIONS.map((condition) => {
                  const saved = profile?.conditions?.find(
                    (item) => item.conditionCode === condition.code
                  );
                  return (
                    <button
                      key={condition.code}
                      type="button"
                      disabled={
                        !profile?.consentedAt ||
                        addCondition.isPending ||
                        deleteCondition.isPending
                      }
                      onClick={() =>
                        saved
                          ? deleteCondition.mutate(saved.id)
                          : addCondition.mutate(condition.code)
                      }
                      className="text-xs font-semibold text-primary transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {saved
                        ? `Xóa ${condition.label.toLowerCase()}`
                        : `Lưu ${condition.label.toLowerCase()}`}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
