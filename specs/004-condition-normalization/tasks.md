# Phân rã kỹ thuật — chuẩn hóa condition mention

- [x] T001 Ghi ADR và đặc tả ranh giới raw mention/canonical condition.
- [x] T002 Thêm pilot taxonomy, scope matcher và deterministic fallback cho thận/gan.
- [x] T003 Thêm read-only repository lấy distinct mention.
- [x] T004 Thêm structured prompt, batch runner và CSV exporter.
- [x] T005 Thêm CLI, cấu hình và chế độ `--no-ai`.
- [x] T006 Thêm unit test cho mapping, compound mention và model fallback.
- [x] T007 Chạy baseline pilot thận/gan trên Supabase.
- [x] T008 Mở repository sang toàn bộ corpus và tăng giới hạn an toàn.
- [x] T009 Mở rộng taxonomy/rule cho mọi nhóm condition có trong corpus.
- [x] T010 Thêm generic suppression, `unmapped`, body system và thống kê coverage.
- [x] T011 Chạy toàn bộ corpus bằng `--no-ai` và xuất artifact review.
- [x] T012 Thiết kế schema canonical/alias v2 và importer transaction sau khi chủ sản phẩm yêu cầu import.
- [x] T013 Đổi autocomplete và exact drug–disease lookup sang catalog/alias v2.
- [x] T014 Áp migration/import lên Supabase và smoke test catalog/alias v2.
- [ ] T015 Human review toàn bộ mapping `pending_review` sau import.
- [ ] T016 Chạy Gemini tùy chọn sau khi có chấp thuận rõ việc truyền mention ra provider bên ngoài.
- [x] T017 Trả cảnh báo có qualifier/compound với raw condition đầy đủ, chống trùng item và resolve exact
  ingredient alias của TDF.
