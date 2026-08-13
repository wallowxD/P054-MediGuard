/**
 * `id` của vùng nội dung chính trên mọi layout. Mỗi `<main>` phải mang đúng id này,
 * nếu không skip link sẽ trỏ vào hư không.
 */
export const MAIN_CONTENT_ID = "noi-dung-chinh";

/**
 * Link đầu tiên trong tab order, chỉ hiện khi được focus.
 *
 * Người dùng bàn phím và screen reader không nên phải Tab qua toàn bộ header/sidebar
 * ở mỗi trang mới tới được nội dung.
 */
export default function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Bỏ qua đến nội dung chính
    </a>
  );
}
