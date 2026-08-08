"use client";

import { Send } from "lucide-react";
import { useId, useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

/**
 * CTA "Gửi tương tác cho bác sĩ" — dành cho vùng kết quả khi có interaction thật.
 * Hiện chưa có màn kết quả nào gắn component này (xem InteractionResultsPlaceholder
 * ở drug-drug/drug-food): không tạo API, không gửi dữ liệu thật. Bấm vào chỉ mở
 * modal giải thích tính năng chưa hỗ trợ.
 */
export default function SendToDoctorButton() {
  const [open, setOpen] = useState(false);
  const descId = useId();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-describedby={descId}
      >
        <Send className="h-4 w-4" aria-hidden />
        Gửi tương tác cho bác sĩ
      </Button>
      <p id={descId} className="sr-only">
        Tính năng gửi tương tác cho bác sĩ hiện chưa được hỗ trợ.
      </p>

      <Modal open={open} title="Chưa hỗ trợ" onClose={() => setOpen(false)}>
        <p className="text-sm text-foreground-secondary">
          Tính năng gửi tương tác cho bác sĩ hiện chưa được hỗ trợ. Vui lòng trao đổi trực tiếp
          với bác sĩ hoặc dược sĩ về kết quả tra cứu này.
        </p>
      </Modal>
    </>
  );
}
