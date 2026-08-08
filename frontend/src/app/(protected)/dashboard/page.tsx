import { FeatureCard, RecentSearches, WelcomeHero } from "@/components/dashboard";
import { PRIMARY_NAV_ITEMS } from "@/components/navigation/nav-items";
import { ROUTES } from "@/constants/routes";

// 4 tính năng tra cứu chính — bỏ mục đầu ("Trang chủ") vì đang đứng ở chính trang này.
const FEATURE_ITEMS = PRIMARY_NAV_ITEMS.slice(1);

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  [ROUTES.DRUG_INFORMATION]: "Xem thông tin có dẫn nguồn từ tờ hướng dẫn sử dụng theo tên thuốc.",
  [ROUTES.INTERACTIONS_DRUG_DRUG]:
    "Tra cứu tương tác giữa các thuốc đang dùng, có trích dẫn nguồn.",
  [ROUTES.INTERACTIONS_DRUG_FOOD]: "Xem thực phẩm có thể ảnh hưởng tới tác dụng của thuốc.",
  [ROUTES.INTERACTIONS_DRUG_DISEASE]: "Tra cứu tương tác giữa thuốc và bệnh nền.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <WelcomeHero />

      <section aria-label="Tính năng tra cứu" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURE_ITEMS.map(({ href, label, Icon, unsupported }) => (
          <FeatureCard
            key={href}
            href={href}
            icon={Icon}
            title={label}
            description={FEATURE_DESCRIPTIONS[href]}
            unsupported={unsupported}
          />
        ))}
      </section>

      <RecentSearches />
    </div>
  );
}
