"use client";

import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import GoogleSignInButton from "./GoogleSignInButton";

type SignInFormValues = {
  email: string;
  password: string;
};

const INPUT_CLASSES =
  "w-full rounded-2xl border border-border bg-input py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] placeholder:text-foreground-muted focus:border-primary focus:ring-4 focus:ring-primary/10";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({ mode: "onBlur" });

  const onSubmit = async (values: SignInFormValues) => {
    try {
      const result = await signIn("credentials", {
        email: values.email.trim(),
        password: values.password,
        redirect: false,
      });

      if (!result?.ok) {
        toast.error(
          result?.error === "CredentialsSignin"
            ? "Email hoặc mật khẩu không đúng."
            : result?.error || "Không thể đăng nhập. Vui lòng thử lại."
        );
        return;
      }

      toast.success("Đăng nhập thành công.");
      router.replace(ROUTES.DASHBOARD);
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Không thể đăng nhập. Vui lòng thử lại."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <div className="relative mt-2">
          <Mail
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden
          />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Nhập email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email", {
              required: "Vui lòng nhập email",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Email không đúng định dạng",
              },
            })}
            className={INPUT_CLASSES}
          />
        </div>
        {/* role="alert" để screen reader đọc ngay lỗi vừa xuất hiện; không có nó thì
            người dùng chỉ nghe lỗi khi tình cờ Tab lại vào đúng ô đó. */}
        {errors.email ? (
          <p id="email-error" role="alert" className="mt-1.5 text-xs text-error">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Mật khẩu
        </label>
        <div className="relative mt-2">
          <LockKeyhole
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden
          />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password", {
              required: "Vui lòng nhập mật khẩu",
              minLength: { value: 8, message: "Mật khẩu cần ít nhất 8 ký tự" },
            })}
            className={`${INPUT_CLASSES} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={showPassword}
            className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-foreground-muted transition-colors duration-300 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="password-error" role="alert" className="mt-1.5 text-xs text-error">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>

      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-foreground-muted">hoặc tiếp tục với</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleSignInButton label="Đăng nhập bằng Google" />

      <Button href={ROUTES.SIGNUP} variant="ghost" className="w-full text-center">
        Chưa có tài khoản? Đăng ký
      </Button>
    </form>
  );
}
