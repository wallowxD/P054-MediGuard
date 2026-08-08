"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import Chip from "@/components/ui/Chip";

interface BasketItem {
  id: string;
  label: string;
}

interface BasketInputFieldProps {
  label: string;
  placeholder: string;
  emptyHint: string;
  items: BasketItem[];
  onAdd: (value: string) => void;
  onRemove: (id: string) => void;
}

/**
 * Ô nhập + danh sách chip dùng chung cho giỏ thuốc và giỏ thực phẩm ở
 * `/interactions/drug-food`. Chỉ quản lý UI cục bộ — logic thêm/xoá do trang cha
 * quyết định (đi qua Redux drug basket), component này không tự biết về store.
 */
export default function BasketInputField({
  label,
  placeholder,
  emptyHint,
  items,
  onAdd,
  onRemove,
}: BasketInputFieldProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={`basket-input-${label}`}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={`basket-input-${label}`}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          aria-label={`Thêm vào ${label.toLowerCase()}`}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium text-foreground-secondary hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Thêm
        </button>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {items.map((item) => (
            <Chip key={item.id} label={item.label} onRemove={() => onRemove(item.id)} />
          ))}
        </div>
      ) : (
        <p className="pt-0.5 text-xs text-foreground-muted">{emptyHint}</p>
      )}
    </div>
  );
}
