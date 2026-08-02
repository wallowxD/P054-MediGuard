// TODO(API): ráp `useInteraction(id)` khi backend có GET /api/v1/interactions/{id}.
export default async function InteractionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next 16: params là Promise, phải await.
  const { id } = await params;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Chi tiết cảnh báo</h1>
      <p className="text-sm text-foreground-secondary">
        Mã cảnh báo: <code className="text-foreground">{id}</code>
      </p>
      <p className="text-sm text-foreground-muted">
        Nội dung sẽ hiển thị khi backend mở endpoint chi tiết.
      </p>
    </div>
  );
}
