import Chip from "@/components/ui/Chip";

interface SelectedDrugListProps {
  label: string;
  drugs: IDrugItem[];
  onRemove: (id: string) => void;
  emptyHint: string;
}

/**
 * Danh sách thuốc đã xác nhận từ danh mục — chỉ hiển thị `IDrugItem` thật, không
 * nhận text tự do. Hiện luôn rỗng vì `DrugCatalogPicker` chưa có cách xác nhận
 * thuốc thật (catalog search chưa nối); component đã sẵn sàng nhận dữ liệu khi
 * backend mở.
 */
export default function SelectedDrugList({ label, drugs, onRemove, emptyHint }: SelectedDrugListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">{label}</h3>
      {drugs.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {drugs.map((drug) => (
            <Chip
              key={drug.id}
              label={drug.brandName}
              onRemove={() => onRemove(drug.id)}
              removeLabel={`Xoá ${drug.brandName} khỏi danh sách`}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-foreground-muted">{emptyHint}</p>
      )}
    </div>
  );
}
