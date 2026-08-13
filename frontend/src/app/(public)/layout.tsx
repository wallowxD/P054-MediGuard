import SkipLink from "@/components/ui/SkipLink";

/** Không check session ở đây — middleware đã quyết định ai vào được. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  // Landing is intentionally light regardless of the operating-system colour preference.
  return (
    <div className="landing-theme min-h-screen bg-background text-foreground">
      <SkipLink />
      {children}
    </div>
  );
}
