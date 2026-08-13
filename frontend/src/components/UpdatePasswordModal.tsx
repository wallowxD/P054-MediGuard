"use client";

import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";

type UpdatePasswordForm = {
  currentPassword: string;
  password: string;
  confirmPassword: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

// TODO(API): nối PATCH /api/v1/auth/password (API_ENDPOINTS.AUTH.UPDATE_PASSWORD)
export default function UpdatePasswordModal({ open, onClose }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdatePasswordForm>();

  const onSubmit = () => {
    toast.info("Backend chưa có module auth");
    reset();
    onClose();
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <Modal open={open} title="Đổi mật khẩu" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Mật khẩu hiện tại"
          {...register("currentPassword", { required: true })}
          className={inputClass}
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Mật khẩu mới"
          {...register("password", { required: true, minLength: 8 })}
          className={inputClass}
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu mới"
          {...register("confirmPassword", {
            required: true,
            // formValues thay cho watch() — xem ghi chú ở ResetPasswordModal
            validate: (v, formValues) =>
              v === formValues.password || "Mật khẩu nhập lại không khớp",
          })}
          className={inputClass}
        />
        {errors.confirmPassword ? (
          <p role="alert" className="text-xs text-error">
            {errors.confirmPassword.message}
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Cập nhật
        </button>
      </form>
    </Modal>
  );
}
