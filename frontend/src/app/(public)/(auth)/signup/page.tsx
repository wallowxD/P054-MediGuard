import { AuthShell, SignUpForm } from "@/components/auth";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Bắt đầu cùng Vinmec"
      title="Tạo tài khoản"
      description="Tạo hồ sơ để chuẩn bị cho trải nghiệm tra cứu thuốc an toàn và minh bạch."
    >
      <SignUpForm />
    </AuthShell>
  );
}
