# Quickstart chuẩn hóa toàn bộ condition mention

Chạy từ repository root. Lệnh an toàn dưới đây chỉ đọc Supabase, không gọi Gemini và không ghi database:

```powershell
$env:UV_CACHE_DIR='D:\Work\VinUni\P-054\.uv-cache-condition-normalization'
$env:PYTHONIOENCODING='utf-8'
uv run --project backend python -m medsafe.ingestion.condition_normalization --limit 5000 --no-ai
```

Artifact được ghi tại `dataset/condition_normalization_candidates.csv`. Một raw mention có thể có nhiều
dòng nếu chứa nhiều component. Các cột quan trọng:

- `proposed_concept_code`, `proposed_name_vi`, `body_system`: đề xuất canonical;
- `match_status=matched|unmapped`: rule có nhận diện được hay không;
- `severity`, `course`, `stage`, `dialysis`, `criteria_text`: qualifier giữ ngoài canonical name;
- `ai_status=not_requested`: xác nhận Gemini không được gọi;
- `mapping_status=needs_review`: chưa được phép áp dụng vào database.

Reviewer điền `review_decision=approve|reject`. Nếu cần sửa, chỉnh các cột đề xuất, ghi lý do vào
`review_note` rồi đặt `review_decision=approve`; importer từ chối giá trị `edit` để không phải suy đoán nội
dung sửa từ ghi chú tự do.

Sau migration 0007, kiểm tra import không ghi dữ liệu:

```powershell
uv run --project backend python -m medsafe.ingestion.condition_normalization_import
```

Áp catalog và alias v2 trong một transaction:

```powershell
uv run --project backend alembic -c backend/alembic.ini upgrade head
uv run --project backend python -m medsafe.ingestion.condition_normalization_import --apply
```

Chạy lại `--apply` là idempotent và không reset `review_status` đã được con người thay đổi. Nếu cần loại
cả alias cũ không còn trong CSV và đồng bộ lại nguyên snapshot, dùng `--apply --replace`; cờ này xóa alias
v2 và deactivate canonical disease v2 trước khi upsert lại, nhưng không sửa dữ liệu v1 hoặc interaction raw.

Nếu chỉ muốn chạy một phần để kiểm tra nhanh, giảm `--limit`. Bỏ `--no-ai` sẽ truyền raw mention tới
Google GenAI nên chỉ được thực hiện sau khi có chấp thuận rõ ràng.
