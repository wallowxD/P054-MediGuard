import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuthShell, SignInForm } from "@/components/auth";
import { dashboardForRoles } from "@/constants/routes";
import { authOptions } from "@/lib/auth";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  const dashboardRoute = dashboardForRoles(session?.user?.roles);

  if (dashboardRoute) redirect(dashboardRoute);

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
