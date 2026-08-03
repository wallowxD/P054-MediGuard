# ADR 0012 — Drug-drug dùng bản ghi exact pair có evidence từ leaflet

- **Trạng thái:** Được chấp nhận; thay nguồn `drugtodrug.json` của ADR 0004
- **Ngày:** 2026-08-03

## Bối cảnh

`drugtodrug.json` đã bị loại bỏ theo quyết định của leader. Ranh giới an toàn exact lookup
vẫn cần giữ, vì vector/model không được quyết định drug-drug existence.

## Quyết định

Trong ingestion:

1. Trích candidate passage từ leaflet gốc.
2. Chuẩn hóa hai active ingredient và tạo canonical unordered pair.
3. Validate pair identity, citation, source coordinate và evidence version.
4. Persist structured interaction record ở trạng thái review phù hợp.

Trong request path, drug-drug chỉ tra exact key từ structured relation. Không fallback sang
similarity hoặc model knowledge. Drug-food tiếp tục retrieval trên leaflet đã chọn.

## Hệ quả

- ✅ Không phụ thuộc dataset JSON đã loại bỏ.
- ✅ Mọi exact pair có nguồn và identity được kiểm chứng.
- ✅ Giữ regression “Warfarin + Tamoxifen không được trả Acenocoumarol + Tamoxifen”.
- ❌ Ingestion/review phức tạp hơn import JSON.
- ❌ Coverage chỉ tăng khi leaflet được xử lý và evidence đủ điều kiện.
