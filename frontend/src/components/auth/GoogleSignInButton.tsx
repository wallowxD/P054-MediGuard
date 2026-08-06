"use client";

/**
 * Nút đăng nhập/đăng ký Google, giữ nguyên style hệ thống (Button + GoogleMark).
 *
 * Google Identity Services (GIS) không cho tự style nút của họ, nên nút GIS THẬT được
 * render ở dạng ẩn (`hiddenContainerRef`); bấm nút hiển thị (custom) sẽ forward click
 * sang nút ẩn đó. Đây vẫn là một click thật do người dùng thực hiện — xảy ra đồng bộ
 * trong cùng lời gọi hàm — nên không bị trình duyệt chặn như khi tự ý mở popup.
 *
 * `authorize()` ở `lib/auth.ts` là nơi DUY NHẤT gọi backend; component này chỉ lấy
 * idToken rồi giao cho `signIn("google", { idToken })`.
 */

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import GoogleMark from "./GoogleMark";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

type GoogleSignInButtonProps = {
  label: string;
};

export default function GoogleSignInButton({ label }: GoogleSignInButtonProps) {
  const router = useRouter();
  const hiddenContainerRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCredential = useCallback(
    async (idToken: string) => {
      setIsSubmitting(true);
      const result = await signIn("google", { idToken, redirect: false });
      setIsSubmitting(false);

      if (!result || result.error) {
        toast.error(result?.error || "Đăng nhập bằng Google thất bại. Vui lòng thử lại.");
        return;
      }
      router.push(ROUTES.DASHBOARD);
    },
    [router]
  );

  // `onReady`: chạy sau khi script load xong VÀ mỗi lần component này mount lại — cần
  // thiết vì signin/signup đều dùng component này, mount lại phải render lại nút ẩn vào
  // container ref mới (next/script chỉ tải script một lần, không tự lặp `onLoad`).
  const initializeGoogle = useCallback(() => {
    if (!window.google || !hiddenContainerRef.current || !GOOGLE_CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        void handleCredential(response.credential);
      },
    });
    window.google.accounts.id.renderButton(hiddenContainerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
    });
  }, [handleCredential]);

  const handleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("Đăng nhập Google chưa được cấu hình (thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID).");
      return;
    }
    const realButton = hiddenContainerRef.current?.querySelector<HTMLElement>('div[role="button"]');
    if (!realButton) {
      toast.error("Google chưa sẵn sàng, thử lại sau vài giây.");
      return;
    }
    realButton.click();
  };

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={initializeGoogle} />
      <div
        ref={hiddenContainerRef}
        className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
        aria-hidden
      />
      <Button type="button" variant="outline" className="w-full" onClick={handleClick} disabled={isSubmitting}>
        <GoogleMark />
        {isSubmitting ? "Đang đăng nhập..." : label}
      </Button>
    </>
  );
}
