import ProfilePage from "@/components/profile/ProfilePage";
import { buildPrivateMetadata } from "@/utils/metadata-utils";

export const metadata = buildPrivateMetadata(
  "Hồ sơ cá nhân",
  "Thông tin tài khoản và hồ sơ sức khoẻ tự khai của người dùng."
);

export default function SettingsPage() {
  return <ProfilePage />;
}
