"use client";

import { Apple, Trash2 } from "lucide-react";
import { DrugCatalogPicker, SelectedDrugList } from "@/components/drugs";
import { BasketInputField, InteractionResultsPlaceholder } from "@/components/interactions";
import { PrescriptionImageUpload } from "@/components/prescription";
import Button from "@/components/ui/Button";
import { addFood, clearBasket, removeDrug, removeFood } from "@/store/reducers/drug-basket";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectBasketDrugs, selectBasketFoods } from "@/store/selectors";

// TODO(API): ráp useCheckInteractions() (src/queries/interactions.ts) khi backend mở
// POST /api/v1/interactions/check cho kind "drug-food". Giỏ thuốc/thực phẩm chỉ là
// client state — kết quả tra cứu thật KHÔNG được lưu vào Redux (xem docs/frontend.md).
// DrugCatalogPicker chưa có cách xác nhận thuốc thật nên danh sách thuốc luôn rỗng và
// nút tra cứu luôn disabled — đúng trạng thái hiện tại. Thực phẩm vẫn nhập text tự do
// vì không có bảng danh mục tương ứng.
export default function DrugFoodInteractionsPage() {
  const dispatch = useAppDispatch();
  const drugs = useAppSelector(selectBasketDrugs);
  const foods = useAppSelector(selectBasketFoods);
  const canCheck = drugs.length >= 1 && foods.length >= 1;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Tra cứu thuốc – thực phẩm</h1>
        <p className="text-sm text-foreground-secondary">
          Thông tin tham khảo, không thay thế đánh giá của bác sĩ. Chỉ nội dung có trích dẫn
          nguồn từ tờ hướng dẫn sử dụng mới được hiển thị.
        </p>
      </header>

      <PrescriptionImageUpload />

      <div className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-5">
        <DrugCatalogPicker label="Chọn thuốc từ danh mục bệnh viện" />

        <SelectedDrugList
          label="Thuốc đã chọn"
          drugs={drugs}
          onRemove={(id) => dispatch(removeDrug(id))}
          emptyHint="Chưa có thuốc nào được xác nhận từ danh mục bệnh viện."
        />

        <BasketInputField
          label="Thực phẩm cần đối chiếu"
          placeholder="Nhập tên thực phẩm rồi bấm Thêm…"
          emptyHint="Chưa có thực phẩm nào được thêm."
          items={foods.map((f) => ({ id: f, label: f }))}
          onAdd={(food) => dispatch(addFood(food))}
          onRemove={(food) => dispatch(removeFood(food))}
        />

        {drugs.length > 0 || foods.length > 0 ? (
          <button
            type="button"
            onClick={() => dispatch(clearBasket())}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-error"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Xoá toàn bộ danh sách
          </button>
        ) : null}

        <div className="space-y-1.5">
          <Button variant="solid" size="sm" disabled={!canCheck}>
            <Apple className="h-4 w-4" aria-hidden />
            Tra cứu tương tác
          </Button>
          {!canCheck ? (
            <p className="text-xs text-foreground-muted">
              Cần ít nhất một thuốc đã xác nhận từ danh mục bệnh viện và một thực phẩm để tra
              cứu.
            </p>
          ) : null}
        </div>
      </div>

      <section aria-label="Kết quả tra cứu" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Kết quả</h2>
        <InteractionResultsPlaceholder
          title="Chưa đủ dữ liệu để tra cứu"
          description="Thêm ít nhất một thuốc đã xác nhận và một thực phẩm để tra cứu."
        />
      </section>
    </div>
  );
}
