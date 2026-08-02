"use client";

import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";

type ForgotPasswordForm = { email: string };

interface Props {
  open: boolean;
  onClose: () => void;
}

// TODO(API): nối POST /api/v1/auth/password (API_ENDPOINTS.AUTH.RECOVERY_PASSWORD)
export default function ForgotPasswordModal({ open, onClose }: Props) {
  const { register, handleSubmit, reset } = useForm<ForgotPasswordForm>();

  const onSubmit = (values: ForgotPasswordForm) => {
    toast.info(`Backend chưa có module auth — chưa gửi được mail tới ${values.email}`);
    reset();
    onClose();
  };

  return (
    <Modal open={open} title="Quên mật khẩu" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-foreground-secondary">
          Nhập email đăng ký, hệ thống sẽ gửi liên kết đặt lại mật khẩu.
        </p>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email", { required: true })}
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Gửi liên kết
        </button>
      </form>
    </Modal>
  );
}
