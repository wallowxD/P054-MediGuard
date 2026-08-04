/**
 * Tiêu đề section kèm gạch chân nhấn — mô típ lấy từ web bệnh viện tham khảo,
 * dùng lại cho mọi section để trang có một nhịp thị giác thống nhất.
 */
export default function SectionHeading({
  title,
  subtitle,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const centered = align === "center";

  return (
    <div className={centered ? "text-center" : "text-left"}>
      <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <span
        aria-hidden
        className={`mt-3 block h-1 w-14 rounded-full bg-primary ${centered ? "mx-auto" : ""}`}
      />
      {subtitle ? (
        <p
          className={`mt-4 text-sm text-foreground-secondary sm:text-base ${
            centered ? "mx-auto max-w-2xl" : "max-w-2xl"
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
