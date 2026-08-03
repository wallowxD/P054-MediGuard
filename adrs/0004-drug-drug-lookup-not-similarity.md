# ADR 0004 — Thuốc–thuốc dùng exact lookup, không dùng similarity để kết luận

- **Trạng thái:** Bị thay thế bởi ADR 0012 về nguồn dữ liệu; ranh giới exact lookup được giữ nguyên
- **Ngày:** 2026-08-02

## Bối cảnh

Similarity search có thể trả bản ghi gần nghĩa nhưng sai định danh. Ví dụ truy vấn
“Warfarin + Tamoxifen” có thể trả “Acenocoumarol + Tamoxifen”; trích dẫn vẫn thật nhưng
cảnh báo sai cặp thuốc.

## Quyết định

- Drug-drug existence và severity chỉ dùng canonical exact-pair lookup.
- Similarity search không được tạo, thay thế hoặc phân loại bản ghi drug-drug.
- Drug-food được phép dùng semantic retrieval vì không có structured relation.
- Tên thuốc gõ sai dùng fuzzy normalization, không dùng embedding làm nguồn định danh.

## Hệ quả

- ✅ Chặn lỗi “citation thật nhưng sai cặp”.
- ✅ Kết quả exact lookup xác định và kiểm thử offline được.
- ❌ Cặp không có trong structured relation phải trả “chưa có dữ liệu”.
- ❌ Ingestion phải chuẩn hóa và tạo canonical pair đáng tin cậy.
