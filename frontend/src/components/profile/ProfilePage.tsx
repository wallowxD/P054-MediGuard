"use client";

import { CalendarDays, HeartPulse, LogOut, Save, ShieldCheck, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";
import DiseaseAutocomplete from "@/components/interactions/DiseaseAutocomplete";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import {
  useAddHealthCondition,
  useAddPatientDisease,
  useDeleteHealthCondition,
  useDeletePatientDisease,
  useHealthProfile,
  useUpdateHealthProfile,
} from "@/queries/interactions";

const SPECIAL_CONDITIONS: {
  code: TConditionCode;
  label: string;
  description: string;
}[] = [
  {
    code: "mang-thai",
    label: "Đang mang thai",
    description: "Chỉ dùng trong lượt tra cứu khi bạn xác nhận lại",
  },
  {
    code: "cho-con-bu",
    label: "Đang cho con bú",
    description: "Chỉ dùng trong lượt tra cứu khi bạn xác nhận lại",
  },
];

const INPUT_CLASSES =
  "mt-1.5 block w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20";

const calculateAge = (dateOfBirth: string | null | undefined): number | null => {
  if (!dateOfBirth) return null;
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
};

const toDateInputValue = (value: Date): string =>
  [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");

function HealthProfileForm({ profile }: { profile: IHealthProfile }) {
  const update = useUpdateHealthProfile();
  const addCondition = useAddHealthCondition();
  const deleteCondition = useDeleteHealthCondition();
  const addDisease = useAddPatientDisease();
  const deleteDisease = useDeletePatientDisease();
  const [selectedSex, setSelectedSex] = useState<IHealthProfileUpdate["sex"]>(profile.sex);
  const age = calculateAge(profile.dateOfBirth);
  const maxBirthDate = toDateInputValue(new Date());
  const conditionMutationPending = addCondition.isPending || deleteCondition.isPending;
  const diseaseMutationPending = addDisease.isPending || deleteDisease.isPending;
  const selectedDiseases: IDiseaseItem[] = (profile.diseases ?? []).map((item) => ({
    id: item.diseaseId,
    name: item.name,
  }));

  const changeDiseases = (next: IDiseaseItem[]) => {
    const added = next.find(
      (item) => !(profile.diseases ?? []).some((saved) => saved.diseaseId === item.id)
    );
    if (added) {
      addDisease.mutate(added.id);
      return;
    }

    const removed = (profile.diseases ?? []).find(
      (saved) => !next.some((item) => item.id === saved.diseaseId)
    );
    if (removed) deleteDisease.mutate(removed.id);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    update.mutate({
      dateOfBirth: String(formData.get("dateOfBirth") || "") || null,
      sex: selectedSex || null,
      weightKg: formData.get("weightKg") ? Number(formData.get("weightKg")) : null,
      heightCm: formData.get("heightCm") ? Number(formData.get("heightCm")) : null,
      consent: formData.get("consent") === "on",
    });
  };

  return (
    <section
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
      aria-labelledby="health-title"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hero-tint text-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 id="health-title" className="font-heading text-lg font-semibold text-foreground">
            Hồ sơ sức khoẻ tự khai
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Bạn kiểm soát các thông tin này. Hệ thống không tự dùng hồ sơ để tạo cảnh báo
            hoặc đưa bệnh nền vào một lượt tra cứu.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-foreground-secondary">
            Ngày sinh
            <input
              name="dateOfBirth"
              type="date"
              defaultValue={profile.dateOfBirth ?? ""}
              max={maxBirthDate}
              className={INPUT_CLASSES}
            />
          </label>
          <div className="rounded-xl bg-surface px-4 py-3">
            <p className="text-xs font-medium text-foreground-muted">Tuổi hiện tại</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
              {age === null ? "Chưa có ngày sinh" : `${age} tuổi`}
            </p>
          </div>
          <label className="text-sm font-medium text-foreground-secondary">
            Giới tính
            <select
              name="sex"
              value={selectedSex ?? ""}
              onChange={(event) =>
                setSelectedSex((event.target.value || null) as IHealthProfileUpdate["sex"])
              }
              className={INPUT_CLASSES}
            >
              <option value="">Chưa chọn</option>
              <option value="nu">Nữ</option>
              <option value="nam">Nam</option>
              <option value="khac">Khác</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-foreground-secondary">
              Cân nặng (kg)
              <input
                name="weightKg"
                type="number"
                min="1"
                max="300"
                step="0.1"
                defaultValue={profile.weightKg ?? ""}
                className={INPUT_CLASSES}
              />
            </label>
            <label className="text-sm font-medium text-foreground-secondary">
              Chiều cao (cm)
              <input
                name="heightCm"
                type="number"
                min="1"
                max="250"
                step="0.1"
                defaultValue={profile.heightCm ?? ""}
                className={INPUT_CLASSES}
              />
            </label>
          </div>
        </div>

        <label className="flex items-start gap-2 rounded-xl border border-border p-3 text-xs leading-5 text-foreground-secondary">
          <input
            name="consent"
            type="checkbox"
            defaultChecked={Boolean(profile.consentedAt)}
            required
            className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
          />
          <span>
            Tôi đồng ý lưu dữ liệu sức khoẻ tự khai để dùng lại và hiểu rằng tôi có thể
            chỉnh sửa các thông tin này.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={update.isPending}>
            <Save className="h-4 w-4" aria-hidden />
            {update.isPending ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
          {update.isSuccess ? (
            <p role="status" className="text-sm font-medium text-success">
              Hồ sơ đã được cập nhật.
            </p>
          ) : null}
          {update.isError ? (
            <p role="alert" className="text-sm text-error">
              {update.error instanceof Error ? update.error.message : "Không thể lưu hồ sơ."}
            </p>
          ) : null}
        </div>
      </form>

      <div className="mt-7 border-t border-border pt-6">
        <div className="flex items-start gap-3">
          <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tình trạng đặc biệt</h3>
            <p className="mt-1 text-xs leading-5 text-foreground-muted">
              Hai tình trạng này được lưu riêng và vẫn cần bạn xác nhận lại khi tra cứu.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SPECIAL_CONDITIONS.map((condition) => {
            const saved = profile.conditions?.find((item) => item.conditionCode === condition.code);
            const sexMismatch = selectedSex !== "nu" || profile.sex !== "nu";
            const disabled = !profile.consentedAt || conditionMutationPending || (sexMismatch && !saved);

            return (
              <div
                key={condition.code}
                className="rounded-xl border border-border p-3.5"
              >
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(saved)}
                    disabled={disabled}
                    onChange={() =>
                      saved
                        ? deleteCondition.mutate(saved.id)
                        : addCondition.mutate(condition.code)
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)] disabled:cursor-not-allowed"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">{condition.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-foreground-muted">
                    {sexMismatch && !saved
                      ? "Chọn giới tính nữ và lưu hồ sơ trước khi thêm"
                      : condition.description}
                  </span>
                  </span>
                </label>
              </div>
            );
          })}
        </div>
        {!profile.consentedAt ? (
          <p className="mt-3 text-xs text-warning">Lưu đồng ý trước khi thêm tình trạng sức khoẻ.</p>
        ) : null}
        {addCondition.isError || deleteCondition.isError ? (
          <p role="alert" className="mt-3 text-xs text-error">
            Không thể cập nhật tình trạng. Vui lòng thử lại.
          </p>
        ) : null}

        <div className="mt-6 border-t border-border pt-6">
          <DiseaseAutocomplete
            selected={selectedDiseases}
            onChange={changeDiseases}
            disabled={!profile.consentedAt || diseaseMutationPending}
            label="Bệnh nền đã biết"
            helpText="Chỉ lưu bệnh bạn chủ động chọn từ danh mục. Hồ sơ không tự đưa bệnh vào lượt tra cứu."
          />
          {addDisease.isError || deleteDisease.isError ? (
            <p role="alert" className="mt-3 text-xs text-error">
              Không thể cập nhật bệnh nền. Vui lòng thử lại.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: profile, isLoading, isError, error } = useHealthProfile();
  const name = session?.user?.name || "Người dùng";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Tài khoản</p>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          Hồ sơ cá nhân
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-foreground-secondary">
          Xem thông tin tài khoản, cập nhật hồ sơ sức khoẻ và quản lý phiên đăng nhập của bạn.
        </p>
      </header>

      <section
        className="rounded-2xl border border-border bg-card p-5 sm:p-6"
        aria-labelledby="account-title"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-hero-tint font-heading text-xl font-semibold text-primary">
            {initials || "ND"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" aria-hidden />
              <h2 id="account-title" className="font-heading text-lg font-semibold text-foreground">
                Thông tin cá nhân
              </h2>
            </div>
            <p className="mt-2 truncate text-base font-semibold text-foreground">{name}</p>
            <p className="mt-0.5 truncate text-sm text-foreground-secondary">
              {session?.user?.email ?? "Chưa có email"}
            </p>
          </div>
          <div className="rounded-xl bg-surface px-4 py-3 sm:text-right">
            <p className="text-xs font-medium text-foreground-muted">Vai trò</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {session?.user?.roles?.includes("PHARMACIST") ? "Dược sĩ" : "Người dùng"}
            </p>
          </div>
        </div>
        <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-foreground-muted">
          Tên và email được đồng bộ từ tài khoản đăng nhập. Hồ sơ sức khoẻ bên dưới có thể
          chỉnh sửa độc lập.
        </p>
      </section>

      {isLoading ? (
        <section className="rounded-2xl border border-border bg-card p-6" aria-label="Đang tải hồ sơ">
          <div className="h-6 w-48 animate-pulse rounded bg-surface" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-xl bg-surface" />
            ))}
          </div>
        </section>
      ) : isError ? (
        <section role="alert" className="rounded-2xl border border-error/30 bg-error/5 p-5">
          <p className="font-semibold text-foreground">Không thể tải hồ sơ sức khoẻ</p>
          <p className="mt-1 text-sm text-foreground-secondary">
            {error instanceof Error ? error.message : "Vui lòng tải lại trang."}
          </p>
        </section>
      ) : profile ? (
        <HealthProfileForm profile={profile} />
      ) : null}

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Giao diện</h2>
          <p className="mt-1 text-sm leading-6 text-foreground-secondary">
            Chuyển chế độ hiển thị cho khu vực đã đăng nhập.
          </p>
          <div className="mt-4">
            <ThemeToggle showLabel />
          </div>
        </div>
        <div className="border-t border-border pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <h2 className="font-heading text-lg font-semibold text-foreground">Phiên đăng nhập</h2>
          <p className="mt-1 text-sm leading-6 text-foreground-secondary">
            Đăng xuất khỏi MediGuard trên thiết bị này.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: ROUTES.SIGNIN })}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Đăng xuất
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
