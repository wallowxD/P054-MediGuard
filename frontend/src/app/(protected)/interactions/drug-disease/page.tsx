import type { Metadata } from "next";
import { HeartPulse, Plus, Search } from "lucide-react";
import { PrescriptionImageUpload } from "@/components/prescription";
import Button from "@/components/ui/Button";
import { buildPrivateMetadata } from "@/utils/metadata-utils";

export const metadata: Metadata = buildPrivateMetadata(
  "Tra cứu thuốc – bệnh nền",
  "Tra cứu thuốc–bệnh nền đang được phát triển, chưa khả dụng."
);

const SCOPE_NOTE = "Tra cứu thuốc – bệnh nền đang được phát triển, chưa khả dụng.";

/**
 * Tính năng ĐÃ trong phạm vi theo ADR 0017, nhưng CHƯA có backend: bảng
 * `drug_disease_interactions` chưa tồn tại trong database (xem VMEC-72) và hồ sơ
 * bệnh nền của người dùng chưa có API (VMEC-71).
 *
 * Trang này CHỦ ĐÍCH là Server Component tĩnh: không state, không Redux, không hook,
 * mọi control đều disabled sẵn trong markup. Chỉ mở khoá khi cả hai ticket trên xong —
 * bật sớm sẽ cho ra một màn tra cứu luôn trả rỗng, mà với sản phẩm cảnh báo an toàn
 * thuốc thì "không có kết quả" dễ bị đọc nhầm thành "không có tương tác".
 */
export default function DrugDiseaseInteractionsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Tra cứu thuốc – bệnh nền</h1>
        <p className="text-sm text-foreground-secondary">
          Thông tin tham khảo, không thay thế đánh giá của bác sĩ.
        </p>
      </header>

      <PrescriptionImageUpload
        disabled
        disabledDescription="Không thể xử lý đơn thuốc vì tra cứu thuốc – bệnh nền đang được phát triển, chưa khả dụng."
      />

      <div className="space-y-5 rounded-xl border border-border bg-card p-4 opacity-70 sm:p-5">
        <div className="space-y-2">
          <label htmlFor="drug-disease-drugs" className="text-sm font-medium text-foreground">
            Thuốc đang dùng
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
            <input
              id="drug-disease-drugs"
              type="text"
              disabled
              readOnly
              title={SCOPE_NOTE}
              placeholder="Tìm tên thuốc trong danh mục bệnh viện…"
              className="flex-1 bg-transparent text-sm text-foreground-muted outline-none placeholder:text-foreground-muted disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="drug-disease-conditions" className="text-sm font-medium text-foreground">
            Bệnh nền
          </label>
          <div className="flex gap-2">
            <input
              id="drug-disease-conditions"
              type="text"
              disabled
              readOnly
              title={SCOPE_NOTE}
              placeholder="Nhập tên bệnh nền…"
              className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground-muted outline-none placeholder:text-foreground-muted disabled:cursor-not-allowed"
            />
            <button
              type="button"
              disabled
              title={SCOPE_NOTE}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium text-foreground-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Thêm
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Button variant="solid" size="sm" disabled title={SCOPE_NOTE}>
            Tra cứu
          </Button>
          <p className="flex items-start gap-2 text-xs text-foreground-muted">
            <HeartPulse className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {SCOPE_NOTE}
          </p>
        </div>
      </div>
    </div>
  );
}
