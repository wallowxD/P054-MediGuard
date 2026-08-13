"use client";

import { Save, ShieldCheck } from "lucide-react";
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
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="health-profile-title">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-hero-tint p-2 text-primary"><ShieldCheck className="h-5 w-5" aria-hidden /></span>
        <div>
          <h2 id="health-profile-title" className="font-semibold text-foreground">Hồ sơ sức khoẻ tự khai</h2>
          <p className="mt-1 text-sm text-foreground-secondary">Thông tin đã lưu chỉ tạo gợi ý. Bạn vẫn phải chọn lại điều kiện áp dụng cho từng lượt tra cứu.</p>
        </div>
      </div>
      {isLoading ? <p className="mt-4 text-sm text-foreground-muted">Đang tải hồ sơ…</p> : (
        <form key={profile?.consentedAt ?? "empty"} action={submit} className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-xs text-foreground-secondary">Ngày sinh<input name="dateOfBirth" type="date" defaultValue={profile?.dateOfBirth ?? ""} className="block w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground" /></label>
            <label className="space-y-1 text-xs text-foreground-secondary">Giới tính<select name="sex" value={displayedSex} onChange={(event) => { const nextSex = (event.target.value || null) as IHealthProfileUpdate["sex"]; setSelectedSex(nextSex); if (nextSex !== "nu") onAppliedChange([]); }} className="block w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"><option value="">Chưa chọn</option><option value="nu">Nữ</option><option value="nam">Nam</option><option value="khac">Khác</option></select></label>
            <label className="space-y-1 text-xs text-foreground-secondary">Cân nặng (kg)<input name="weightKg" type="number" min="1" max="300" step="0.1" defaultValue={profile?.weightKg ?? ""} className="block w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground" /></label>
            <label className="space-y-1 text-xs text-foreground-secondary">Chiều cao (cm)<input name="heightCm" type="number" min="1" max="250" step="0.1" defaultValue={profile?.heightCm ?? ""} className="block w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground" /></label>
          </div>
          <label className="flex items-start gap-2 text-xs text-foreground-secondary"><input name="consent" type="checkbox" defaultChecked={Boolean(profile?.consentedAt)} required className="mt-0.5" /><span>Tôi đồng ý lưu dữ liệu sức khoẻ tự khai để dùng lại. Tôi có thể xoá từng tình trạng khỏi hồ sơ.</span></label>
          <Button type="submit" size="sm" disabled={update.isPending}><Save className="h-4 w-4" aria-hidden />{update.isPending ? "Đang lưu…" : "Lưu hồ sơ"}</Button>
          {update.isError ? <p className="text-xs text-error">Không thể lưu hồ sơ. Kiểm tra đồng ý và thử lại.</p> : null}
        </form>
      )}
      {displayedSex === "nu" ? <div className="mt-6 border-t border-border pt-5">
        <h3 className="text-sm font-medium text-foreground">Tình trạng đặc biệt</h3>
        <p className="mt-1 text-xs text-foreground-muted">Chỉ áp dụng khi bạn chủ động xác nhận cho lượt tra cứu hiện tại.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {CONDITIONS.map((condition) => {
            const saved = profile?.conditions?.find((item) => item.conditionCode === condition.code);
            const active = applied.includes(condition.code);
            return (
              <div key={condition.code} className="rounded-xl border border-border p-3">
                <label className="flex items-start gap-2 text-sm font-medium text-foreground"><input type="checkbox" checked={active} onChange={() => onAppliedChange(active ? applied.filter((value) => value !== condition.code) : [...applied, condition.code])} className="mt-0.5" /><span>{condition.label}<span className="mt-0.5 block text-xs font-normal text-foreground-muted">{saved ? "Có trong hồ sơ · chưa tự áp dụng" : "Chưa lưu trong hồ sơ"}</span></span></label>
                <button type="button" disabled={!profile?.consentedAt || addCondition.isPending || deleteCondition.isPending} onClick={() => saved ? deleteCondition.mutate(saved.id) : addCondition.mutate(condition.code)} className="mt-2 text-xs font-medium text-primary disabled:opacity-40">{saved ? "Xoá khỏi hồ sơ" : "Lưu vào hồ sơ"}</button>
              </div>
            );
          })}
        </div>
      </div> : null}
    </section>
  );
}
