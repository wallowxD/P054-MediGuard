import { FileWarning } from "lucide-react";

const REASON_LABEL: Record<TUnavailableReason, string> = {
  "missing-record": "Chưa có bản ghi tương tác cho cặp này",
  "missing-citation": "Có bản ghi nhưng thiếu trích dẫn nguồn hợp lệ",
  "source-unavailable": "Nguồn tài liệu hiện chưa khả dụng",
};

interface UnavailableInteractionListProps {
  items: IUnavailableResult[];
}

/**
 * ★ Danh sách cặp KHÔNG có cảnh báo hiển thị được (ADR 0006). Luôn dùng wording
 * "chưa có dữ liệu hiện tại" — không bao giờ gọi unavailable là "an toàn" hay
 * "không có tương tác", vì thiếu dữ liệu không đồng nghĩa không có rủi ro.
 */
export default function UnavailableInteractionList({ items }: UnavailableInteractionListProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Chưa có dữ liệu hiện tại</h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-start gap-2 rounded-lg border border-border bg-background-elevated px-3 py-2 text-sm text-foreground-secondary"
          >
            <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden />
            <span>
              <strong className="font-medium text-foreground">
                {item.subject} × {item.object}
              </strong>
              : {REASON_LABEL[item.reason]}. Hệ thống không hiển thị cảnh báo khi không có trích
              dẫn nguồn hợp lệ.
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
