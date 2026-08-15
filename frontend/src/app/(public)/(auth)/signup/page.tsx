import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuthShell, SignUpForm } from "@/components/auth";
import { dashboardForRoles } from "@/constants/routes";
import { authOptions } from "@/lib/auth";

export default async function SignUpPage() {
  const session = await getServerSession(authOptions);
  const dashboardRoute = dashboardForRoles(session?.user?.roles);

  if (dashboardRoute) redirect(dashboardRoute);

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
