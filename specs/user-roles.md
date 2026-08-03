# Vai trò và quyền

## Hai role

| Role | Constant | Người dùng |
|---|---|---|
| Patient/carer | `ROLES.PATIENT` | Người tra thuốc cho bản thân/người chăm sóc |
| Doctor/pharmacist | `ROLES.PHARMACIST` | Nhân sự chuyên môn review warning |

Nếu thêm role mới, không tự tạo route tree thứ ba; dùng permission guard phù hợp và cập
nhật ADR/contract authorization.

## Ba tầng truy cập

| Tier | Route group | URL | Quyền |
|---|---|---|---|
| Public | `(public)` | `/`, signin/signup, legal | Mọi người |
| Protected | `(protected)` | dashboard, interactions, settings | Patient + Pharmacist |
| Clinical review | `(review)` | `/review/**` | Chỉ Pharmacist |

## Luồng bệnh nhân

1. Check interaction: nhập/search hoặc OCR candidate → xác nhận danh sách → check → warning
   có nguồn hoặc unavailable.
2. Tra thông tin thuốc: chọn thuốc → đọc thông tin có nguồn.
3. Drug-condition từng xuất hiện trong GATE flow nhưng PRD xếp ngoài phạm vi; không
   implement nếu chưa có quyết định mới.

## Luồng dược sĩ

Nhận queue → mở request/evidence version → kiểm quote/source → approve, reject hoặc tạo
corrected version theo contract được duyệt.

## Ma trận quyền

| Hành động | Patient | Pharmacist |
|---|:---:|:---:|
| Chạy interaction check | ✅ | ✅ |
| Xem pending warning | ✅ | ✅ |
| Gửi review request | ✅ | ✅ |
| Vào `/review/**` | ❌ | ✅ |
| Approve/reject evidence | ❌ | ✅ |
| Tạo corrected evidence version | ❌ | ✅ |

Frontend guard chỉ phục vụ UX. Backend phải enforce permission trên mọi endpoint.
