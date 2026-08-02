"use client";

import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";

type ResetPasswordForm = { password: string; confirmPassword: string };

interface Props {
  open: boolean;
  token?: string;
  onClose: () => void;
}

// TODO(API): nối PUT /api/v1/auth/password (API_ENDPOINTS.AUTH.RESET_PASSWORD)
export default function ResetPasswordModal({ open, token, onClose }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordForm>();

  const onSubmit = () => {
    toast.info(`Backend chưa có module auth (token: ${token ?? "—"})`);
    reset();
    onClose();
  };

  return (
    <Modal open={open} title="Đặt lại mật khẩu" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Mật khẩu mới"
          {...register("password", { required: true, minLength: 8 })}
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          {...register("confirmPassword", {
            required: true,
            // Dùng formValues (tham số thứ 2 của validate) thay cho watch():
            // watch() trả về hàm không memoize được → React Compiler bỏ qua cả component.
            validate: (v, formValues) =>
              v === formValues.password || "Mật khẩu nhập lại không khớp",
          })}
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.confirmPassword ? (
          <p className="text-xs text-error">{errors.confirmPassword.message}</p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Đặt lại mật khẩu
        </button>
      </form>
    </Modal>
  );
}
