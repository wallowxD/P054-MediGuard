"use client";

import { Save, ShieldCheck, Sparkles, User } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { useAddHealthCondition, useDeleteHealthCondition, useHealthProfile, useUpdateHealthProfile } from "@/queries/interactions";

const CONDITIONS: { code: TConditionCode; diseaseName: string; label: string }[] = [
  { code: "mang-thai", diseaseName: "Mang thai", label: "Đang mang thai" },
  { code: "cho-con-bu", diseaseName: "Phụ nữ cho con bú", label: "Đang cho con bú" },
];

export { CONDITIONS };

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
  const displayedSex = selectedSex ?? profile?.sex ?? "";

  const submit = (formData: FormData) =>
    update.mutate({
      dateOfBirth: String(formData.get("dateOfBirth") || "") || null,
      sex: displayedSex || null,
      weightKg: formData.get("weightKg") ? Number(formData.get("weightKg")) : null,
      heightCm: formData.get("heightCm") ? Number(formData.get("heightCm")) : null,
      consent: formData.get("consent") === "on",
    });

  return (
    <section className="rounded-3xl liquid-glass p-5 sm:p-7" aria-labelledby="health-profile-title">
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            <span>Cá nhân hóa an toàn</span>
          </div>
          <h2 id="health-profile-title" className="font-heading text-lg font-bold text-foreground">
            Hồ sơ sức khoẻ tự khai
          </h2>
          <p className="mt-0.5 text-xs text-foreground-secondary">
            Thông tin đã lưu chỉ tạo gợi ý. Bạn vẫn chủ động chọn điều kiện áp dụng cho từng lượt tra cứu.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-4 text-xs text-foreground-muted">Đang tải hồ sơ…</p>
      ) : (
        <form key={profile?.consentedAt ?? "empty"} action={submit} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-xs font-medium text-foreground-secondary">
              Ngày sinh
              <input
                name="dateOfBirth"
                type="date"
                defaultValue={profile?.dateOfBirth ?? ""}
                className="block w-full rounded-2xl liquid-glass-input px-3.5 py-2 text-xs text-foreground outline-none"
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-foreground-secondary">
              Giới tính
              <select
                name="sex"
                value={displayedSex}
                onChange={(event) => {
                  const nextSex = (event.target.value || null) as IHealthProfileUpdate["sex"];
                  setSelectedSex(nextSex);
                  if (nextSex !== "nu") onAppliedChange([]);
                }}
                className="block w-full rounded-2xl liquid-glass-input px-3.5 py-2 text-xs text-foreground outline-none"
              >
                <option value="">Chưa chọn</option>
                <option value="nu">Nữ</option>
                <option value="nam">Nam</option>
                <option value="khac">Khác</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-medium text-foreground-secondary">
              Cân nặng (kg)
              <input
                name="weightKg"
                type="number"
                min="1"
                max="300"
                step="0.1"
                defaultValue={profile?.weightKg ?? ""}
                placeholder="VD: 60"
                className="block w-full rounded-2xl liquid-glass-input px-3.5 py-2 text-xs text-foreground outline-none"
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-foreground-secondary">
              Chiều cao (cm)
              <input
                name="heightCm"
                type="number"
                min="1"
                max="250"
                step="0.1"
                defaultValue={profile?.heightCm ?? ""}
                placeholder="VD: 165"
                className="block w-full rounded-2xl liquid-glass-input px-3.5 py-2 text-xs text-foreground outline-none"
              />
            </label>
          </div>

          <label className="flex items-start gap-2.5 text-xs text-foreground-secondary">
            <input
              name="consent"
              type="checkbox"
              defaultChecked={Boolean(profile?.consentedAt)}
              required
              className="mt-0.5 rounded text-primary focus:ring-primary"
            />
            <span>Tôi đồng ý lưu dữ liệu sức khoẻ tự khai để dùng lại. Tôi có thể xoá từng tình trạng bất kỳ lúc nào.</span>
          </label>

          <div className="pt-1">
            <Button type="submit" variant="glass" size="sm" disabled={update.isPending}>
              <Save className="h-4 w-4" aria-hidden />
              {update.isPending ? "Đang lưu…" : "Lưu hồ sơ sức khỏe"}
            </Button>
          </div>
          {update.isError ? <p className="text-xs text-error">Không thể lưu hồ sơ. Vui lòng kiểm tra lại.</p> : null}
        </form>
      )}

      {displayedSex === "nu" ? (
        <div className="mt-6 border-t border-border/60 pt-5">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
            Tình trạng đặc biệt
          </h3>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Chỉ áp dụng khi bạn chủ động kích hoạt cho lượt tra cứu hiện tại.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {CONDITIONS.map((condition) => {
              const saved = profile?.conditions?.find((item) => item.conditionCode === condition.code);
              const active = applied.includes(condition.code);
              return (
                <div
                  key={condition.code}
                  className={`flex flex-col justify-between rounded-2xl p-3.5 transition-all ${
                    active
                      ? "liquid-glass border-primary/40 shadow-sm ring-1 ring-primary/20"
                      : "liquid-glass-subtle"
                  }`}
                >
                  <label className="flex items-start gap-2.5 text-xs font-semibold text-foreground cursor-pointer">
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
                      className="mt-0.5 rounded text-primary focus:ring-primary"
                    />
                    <span>
                      {condition.label}
                      <span className="mt-0.5 block text-[10px] font-normal text-foreground-muted">
                        {saved ? "Đã lưu trong hồ sơ • sẵn sàng tra cứu" : "Chưa lưu trong hồ sơ"}
                      </span>
                    </span>
                  </label>
                  <button
                    type="button"
                    disabled={!profile?.consentedAt || addCondition.isPending || deleteCondition.isPending}
                    onClick={() => (saved ? deleteCondition.mutate(saved.id) : addCondition.mutate(condition.code))}
                    className="mt-2 self-start text-[11px] font-semibold text-primary hover:opacity-80 disabled:opacity-40"
                  >
                    {saved ? "Xoá khỏi hồ sơ" : "+ Lưu vào hồ sơ"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
