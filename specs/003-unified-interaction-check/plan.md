# Kế hoạch kỹ thuật — VMEC-40

## Backend

FastAPI nhận `drugIds` và `diseaseIds`, batch nạp catalog rồi dựng các exact key. SQL chỉ
nằm trong repository. Citation resolver ưu tiên URL/FK trên interaction, sau đó mới tìm
evidence chunk có đúng thuốc và chứa quote nguyên văn. Gemini nhận tối đa 40 record mỗi
batch, concurrency 3, timeout 5 giây và không retry trên request path.

History dùng hai bảng: `interaction_checks` lưu input/tổng đếm và
`interaction_check_entries` lưu ordered JSONB snapshot. RLS được bật, không có PostgREST
policy; mọi repository query bắt buộc lọc `user_id`.

## Frontend

Component gọi API qua React Query hook. Màn `/interactions/drug-drug` gồm hồ sơ tự khai,
xác nhận tình trạng cho lượt hiện tại, autocomplete bệnh, picker thuốc, preview ảnh và
kết quả tổng hợp. `/history` và `/interaction-checks/[id]` đọc snapshot.

## An toàn

Model không được tạo interaction/severity/fact. Raw fields và citation luôn tồn tại cạnh
summary. Pending không bị chặn; rejected không đi ra API.

