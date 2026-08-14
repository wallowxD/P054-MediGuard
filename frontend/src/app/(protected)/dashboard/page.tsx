import { FeatureCard, RecentSearches, WelcomeHero } from "@/components/dashboard";
import { PRIMARY_NAV_ITEMS } from "@/components/navigation/nav-items";
import { ROUTES } from "@/constants/routes";

// Hai nhóm tra cứu chính — bỏ mục đầu ("Trang chủ") vì đang đứng ở chính trang này.
const FEATURE_ITEMS = PRIMARY_NAV_ITEMS.slice(1);

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  [ROUTES.DRUG_INFORMATION]: "Xem thông tin có dẫn nguồn từ tờ hướng dẫn sử dụng theo tên thuốc.",
  [ROUTES.INTERACTIONS_DRUG_DRUG]:
    "Đối chiếu thuốc, bệnh nền và các lưu ý thực phẩm trong một lượt có trích dẫn nguồn.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <WelcomeHero />

      <section aria-label="Tính năng tra cứu" className="grid gap-4 sm:grid-cols-2">
        {FEATURE_ITEMS.map(({ href, label, Icon }) => (
          <FeatureCard
            key={href}
            href={href}
            icon={Icon}
            title={label}
            description={FEATURE_DESCRIPTIONS[href]}
          />
        ))}
      </section>

      <RecentSearches />
    </div>
  );
}
