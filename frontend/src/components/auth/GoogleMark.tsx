import Image from "next/image";

export default function GoogleMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <Image
      src="/images/google-logo.svg"
      alt=""
      width={24}
      height={24}
      aria-hidden
      className={className}
    />
  );
}
