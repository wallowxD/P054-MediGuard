import { FileQuestion } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center">
      <div className="text-foreground-muted">
        {icon ?? <FileQuestion className="h-10 w-10" aria-hidden />}
      </div>
      <p className="text-base font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-foreground-secondary">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
