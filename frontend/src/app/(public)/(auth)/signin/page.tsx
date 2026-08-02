"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ROUTES } from "@/constants/routes";

type SignInForm = { email: string; password: string };

export default function SignInPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>();

  const onSubmit = async (values: SignInForm) => {
    setSubmitting(true);
    // TODO(API): backend chưa có module auth → authorize() đang throw.
    // Luồng vẫn đi đúng đường, chỉ là kết quả luôn là lỗi cho tới khi API sẵn sàng.
    const res = await signIn("credentials", { ...values, redirect: false });
    setSubmitting(false);

    if (res?.error) {
      toast.error(res.error);
      return;
    }
    router.push(ROUTES.DASHBOARD);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-foreground">Đăng nhập</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Medication Safety Copilot
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm text-foreground-secondary">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email", { required: "Vui lòng nhập email" })}
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-error">{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-foreground-secondary">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password", { required: "Vui lòng nhập mật khẩu" })}
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-error">{errors.password.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting ? <LoadingSpinner size="sm" /> : null}
            Đăng nhập
          </button>
        </form>
      </div>
    </main>
  );
}
