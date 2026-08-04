import { AuthShell, SignInForm } from "@/components/auth";

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Chào mừng trở lại"
      title="Đăng nhập"
      description="Truy cập không gian tra cứu thuốc và theo dõi trạng thái cảnh báo của bạn."
    >
      <SignInForm />
    </AuthShell>
  );
}
