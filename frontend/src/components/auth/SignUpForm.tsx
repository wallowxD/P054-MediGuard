"use client";

import { Eye, EyeOff, LockKeyhole, UserRound, UserRoundPen } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import GoogleSignInButton from "./GoogleSignInButton";

type SignUpFormValues = {
  fullName: string;
  username: string;
  password: string;
};

const INPUT_CLASSES =
  "w-full rounded-2xl border border-border bg-input py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] placeholder:text-foreground-muted focus:border-primary focus:ring-4 focus:ring-primary/10";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({ mode: "onBlur" });

  const onSubmit = () => {
    toast.info("Đăng ký sẽ hoạt động khi API xác thực được kết nối.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="fullName" className="text-sm font-medium text-foreground">
          Họ và tên
        </label>
        <div className="relative mt-2">
          <UserRoundPen
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden
          />
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Nhập họ và tên"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "full-name-error" : undefined}
            {...register("fullName", { required: "Vui lòng nhập họ và tên" })}
            className={INPUT_CLASSES}
          />
        </div>
        {errors.fullName ? (
          <p id="full-name-error" className="mt-1.5 text-xs text-error">
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="username" className="text-sm font-medium text-foreground">
          Tên đăng nhập
        </label>
        <div className="relative mt-2">
          <UserRound
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden
          />
          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="Chọn tên đăng nhập"
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? "username-error" : undefined}
            {...register("username", {
              required: "Vui lòng nhập tên đăng nhập",
              minLength: { value: 3, message: "Tên đăng nhập cần ít nhất 3 ký tự" },
            })}
            className={INPUT_CLASSES}
          />
        </div>
        {errors.username ? (
          <p id="username-error" className="mt-1.5 text-xs text-error">
            {errors.username.message}
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
            autoComplete="new-password"
            placeholder="Tạo mật khẩu tối thiểu 8 ký tự"
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
          <p id="password-error" className="mt-1.5 text-xs text-error">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full">
        Đăng ký
      </Button>

      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-foreground-muted">hoặc tiếp tục với</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleSignInButton label="Đăng ký bằng Google" />

      <Button href={ROUTES.SIGNIN} variant="ghost" className="w-full text-center">
        Đã có tài khoản? Đăng nhập
      </Button>
    </form>
  );
}
