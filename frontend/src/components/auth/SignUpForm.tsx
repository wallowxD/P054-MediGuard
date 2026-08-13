"use client";

import { Eye, EyeOff, LockKeyhole, Mail, UserRoundPen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { useRegister } from "@/queries/auth";
import GoogleMark from "./GoogleMark";
import GoogleSignInButton from "./GoogleSignInButton";

type SignUpFormValues = {
  name: string;
  email: string;
  password: string;
};

const INPUT_CLASSES =
  "w-full rounded-2xl border border-border bg-input py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] placeholder:text-foreground-muted focus:border-primary focus:ring-4 focus:ring-primary/10";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const registerAccount = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({ mode: "onBlur" });

  const onSubmit = async (values: SignUpFormValues) => {
    try {
      await registerAccount.mutateAsync({
        email: values.email.trim(),
        password: values.password,
        name: values.name.trim(),
      });
      toast.success("Đăng ký thành công. Vui lòng đăng nhập.");
      router.push(ROUTES.SIGNIN);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Không thể đăng ký. Vui lòng thử lại.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Họ và tên
        </label>
        <div className="relative mt-2">
          <UserRoundPen
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden
          />
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Nhập họ và tên"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name", {
              required: "Vui lòng nhập họ và tên",
              maxLength: { value: 120, message: "Họ và tên không được quá 120 ký tự" },
            })}
            className={INPUT_CLASSES}
          />
        </div>
        {errors.name ? (
          <p id="name-error" role="alert" className="mt-1.5 text-xs text-error">
            {errors.name.message}
          </p>
        ) : null}
      </div>

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
            autoComplete="new-password"
            placeholder="Tạo mật khẩu tối thiểu 8 ký tự"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password", {
              required: "Vui lòng nhập mật khẩu",
              minLength: { value: 8, message: "Mật khẩu cần ít nhất 8 ký tự" },
              validate: {
                hasLetter: (value) => /[A-Za-z]/.test(value) || "Mật khẩu phải có ít nhất một chữ cái",
                hasNumber: (value) => /\d/.test(value) || "Mật khẩu phải có ít nhất một chữ số",
              },
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

      <Button type="submit" className="w-full" disabled={registerAccount.isPending}>
        {registerAccount.isPending ? "Đang đăng ký..." : "Đăng ký"}
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
