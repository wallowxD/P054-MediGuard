/** Không check session ở đây — middleware đã quyết định ai vào được. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
