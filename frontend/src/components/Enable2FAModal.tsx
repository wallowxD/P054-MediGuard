"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * TODO(API): nối POST /api/v1/auth/profiles/2fa (ACTIVATE_2FA) rồi VERIFY_2FA.
 *
 * Chưa cài `qrcode.react` — chỉ thêm khi thật sự cần.
 * Khi backend trả về otpauth:// URI thì cài rồi thay khối placeholder bên dưới.
 */
export default function Enable2FAModal({ open, onClose }: Props) {
  const [code, setCode] = useState("");

  const onVerify = () => {
    toast.info("Backend chưa có endpoint 2FA");
    setCode("");
    onClose();
  };

  return (
    <Modal open={open} title="Bật xác thực 2 lớp" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-foreground-muted">
          Mã QR sẽ hiển thị ở đây
        </div>
        <p className="text-sm text-foreground-secondary">
          Quét mã bằng ứng dụng xác thực rồi nhập mã 6 số.
        </p>
        <input
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-center tracking-[0.5em] text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={onVerify}
          disabled={code.length !== 6}
          className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          Xác nhận
        </button>
      </div>
    </Modal>
  );
}
