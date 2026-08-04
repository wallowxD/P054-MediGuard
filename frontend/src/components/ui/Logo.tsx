/**
 * Logo dạng SVG inline — không dùng file ảnh để khỏi phải tải thêm request,
 * và tự đổi màu theo theme vì ăn `currentColor`.
 * Hình: chữ thập y tế lồng trong viên thuốc nghiêng.
 */
export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="MediGuard"
      className={className}
    >
      <rect x="1" y="1" width="30" height="30" rx="9" fill="currentColor" opacity="0.12" />
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.28"
      />
      <path
        d="M13.6 7.4h4.8a1 1 0 0 1 1 1v4.2h4.2a1 1 0 0 1 1 1v4.8a1 1 0 0 1-1 1h-4.2v4.2a1 1 0 0 1-1 1h-4.8a1 1 0 0 1-1-1v-4.2H8.4a1 1 0 0 1-1-1v-4.8a1 1 0 0 1 1-1h4.2V8.4a1 1 0 0 1 1-1Z"
        fill="currentColor"
      />
    </svg>
  );
}
