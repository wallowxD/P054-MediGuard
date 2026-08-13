"use client";

/**
 * Nút đăng nhập/đăng ký do Google Identity Services (GIS) render trực tiếp.
 *
 * GIS không cung cấp API để khởi động button flow bằng code. Vì vậy nút Google phải
 * hiển thị thật và nhận click trực tiếp từ người dùng; không bọc bằng nút custom rồi gọi
 * `.click()` lên iframe ẩn.
 *
 * `authorize()` ở `lib/auth.ts` là nơi DUY NHẤT gọi backend; component này chỉ lấy
 * idToken rồi giao cho `signIn("google", { idToken })`.
 */

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ROUTES } from "@/constants/routes";

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
  const googleButtonRef = useRef<HTMLDivElement>(null);
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
  // thiết vì signin/signup đều dùng component này, mount lại phải render lại nút vào
  // container ref mới (next/script chỉ tải script một lần, không tự lặp `onLoad`).
  const initializeGoogle = useCallback(() => {
    if (!window.google || !googleButtonRef.current || !GOOGLE_CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        void handleCredential(response.credential);
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: label.startsWith("Đăng ký") ? "signup_with" : "signin_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: Math.min(googleButtonRef.current.clientWidth || 360, 400),
    });
  }, [handleCredential, label]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client?hl=vi"
        strategy="afterInteractive"
        onReady={initializeGoogle}
      />
      <div
        className={isSubmitting ? "pointer-events-none w-full opacity-60" : "w-full"}
        aria-busy={isSubmitting}
      >
        <div ref={googleButtonRef} className="flex min-h-10 w-full justify-center" />
      </div>
      <span className="sr-only" aria-live="polite">
        {isSubmitting ? "Đang đăng nhập bằng Google" : ""}
      </span>
    </>
  );
}
