# Kế hoạch kỹ thuật — chuẩn hóa toàn bộ condition mention

Repository read-only lấy toàn bộ distinct `disease_name_unaccent`, chọn một raw name đại diện và đếm số
interaction. Domain chứa taxonomy, regex alias, generic suppression, qualifier extraction và rule mapping;
không phụ thuộc framework hoặc I/O.

CLI chạy ngoài request path, flatten mỗi component thành một dòng CSV. Mention không map vẫn có một dòng
riêng. Báo cáo cuối lệnh gồm tổng mention, tổng dòng, số mention đã map và chưa map. Giới hạn mặc định
5.000 và trần 10.000 để không vô tình cắt corpus hiện tại.

Google GenAI vẫn đi qua `LLMClient`, nhận catalog kiểm soát và structured output. Model không được tạo
canonical code mới; code lạ, sai fragment hoặc thiếu/thừa ID làm batch fallback sang deterministic rules.
Chế độ `--no-ai` không truyền dữ liệu ra ngoài.

Revision 0007 giữ catalog cũ với `version=v1`, thêm metadata canonical vào `diseases` và tạo
`disease_aliases`. Importer đọc CSV, validate taxonomy/duplicate/boolean, tạo UUID v5 tất định và upsert
toàn bộ catalog/alias v2 trong một transaction. Mặc định importer chỉ dry-run; `--apply` mới ghi dữ liệu.

Autocomplete chỉ đọc `diseases.version='v2'`. Exact interaction lookup join
`drug_disease_interactions.disease_name_unaccent = disease_aliases.raw_name_unaccent` rồi lọc bằng
canonical `disease_id`. Alias có qualifier hoặc nhiều thành phần được trả dưới dạng cảnh báo liên quan và
giữ nguyên raw condition trong item; không suy diễn qualifier thành tình trạng người dùng đã xác nhận.
