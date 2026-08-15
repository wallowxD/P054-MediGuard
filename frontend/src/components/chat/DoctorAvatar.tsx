/**
 * Avatar bác sĩ (animated SVG tải từ LottieFiles) cắt tròn.
 *
 * `Doctor.svg` dựng theo viewBox dọc 1080×1920 nhưng nhân vật chỉ nằm ở dải y 660–1460,
 * nên ảnh được phóng 135% và kéo lên 34.4% để khung tròn ôm đúng phần đầu và vai.
 * File asset giữ nguyên như lúc tải về — mọi việc cắt cúp làm bằng CSS ở đây.
 */
export default function DoctorAvatar({ className = "" }: { className?: string }) {
  return (
    <span className={`relative block overflow-hidden rounded-full ${className}`}>
      <img
        src="/icons/Doctor.svg"
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-0 w-[135%] max-w-none -translate-x-1/2 -translate-y-[34.4%] select-none"
      />
    </span>
  );
}
