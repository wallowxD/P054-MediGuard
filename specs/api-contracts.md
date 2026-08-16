# Quy ước API contract

## Nguồn sự thật

```text
DB Models (SQLAlchemy) + Pydantic schema + FastAPI route
→ generated OpenAPI
→ frontend/src/lib/api/types.gen.ts
→ frontend service/query/component
```

Không sửa `types.gen.ts` bằng tay và không tạo handwritten type trùng generated contract.

## Quy ước phản hồi

- Success trả typed payload trực tiếp theo [ADR 0011](../adrs/0011-direct-api-responses.md).
- Error dùng HTTP status phù hợp và typed error body (`ErrorResponse` hoặc FastAPI `HTTPException`).
- Warning item bắt buộc có citation list không rỗng (khớp `verbatim_quote` từ `drug_drug_interactions`, `drug_food_interactions`, `drug_disease_interactions` hoặc `evidence_chunks`).
- Missing/invalid evidence nằm trong structured `unavailable`, không dùng `severity: unknown` thay thế.
- `review_status` trong DB có giá trị `pending_review`, `approved`, `rejected`. Tầng API chuyển đổi `pending_review` → `pending` cho client.
- `pending` và `approved` có thể trả cho patient; `rejected` bị loại ở backend.
- Phân trang chuẩn dùng query parameter `page` (tối thiểu 1, mặc định 1) và `limit` (mặc định 20, tối đa 100). Phản h�## Danh mục thuốc

## Chỉ mục contract

| Tính năng | Contract |
|---|---|
| Core interaction check | `specs/001-core-interaction-check/contracts/interaction-check.openapi.yaml` |
| Danh mục thuốc (duyệt A–Z, tìm kiếm) | cùng file trên — `listDrugs`, `searchDrugs` |
| Auth (đăng ký, token, hồ sơ) | `backend/src/medsafe/schemas/auth.py` → OpenAPI tại `/docs` |
| Tra cứu tổng hợp và history | `specs/003-unified-interaction-check/contracts/interaction-check.openapi.yaml` |
| Trích xuất ảnh đơn thuốc | `specs/005-prescription-image-extraction/contracts/openapi.yaml` |

## Trích xuất ảnh đơn thuốc

`POST /api/v1/prescriptions/extract` nhận multipart field `images` gồm 1–5 ảnh JPEG, PNG hoặc WEBP.
Response chỉ là candidate thuốc/bệnh chưa xác nhận; Gemini không trả stable ID. Backend đối chiếu
catalog rồi frontend yêu cầu người dùng bấm chọn trước khi thêm vào lượt tra cứu. Ảnh, filename và
model output không được persist.

## Danh mục thuốc

| Endpoint | Query | Trả về |
|---|---|---|
| `GET /api/v1/drugs` | `letter`, `q`, `page`, `pageSize` | `200` + `DrugListResponse` |
| `GET /api/v1/drugs/letters` | — | `200` + `DrugLetterIndexResponse` |
| `GET /api/v1/drugs/search` | `q`, `limit` | `200` + `DrugSearchResponse` |

Ba endpoint này khác nhau về **cơ chế khớp**, không phải về dữ liệu trả về:

- `/drugs` lọc **tất định** bằng chuỗi con — người dùng đang duyệt danh mục nên phải thấy
  đúng nội dung bảng `drugs`; gõ sai chính tả trả về rỗng chứ không đoán.
- `/drugs/letters` chỉ đếm, không trả nội dung thuốc.
- `/drugs/search` là **autocomplete theo tên biệt dược**: xếp hạng theo bậc tất định
  trước, fuzzy chỉ dùng để bắt lỗi chính tả.

### Xếp hạng của `/drugs/search`

| Bậc | Điểm | Điều kiện |
|---|---|---|
| Khớp tuyệt đối | 100 | Chuỗi chuẩn hoá bằng đúng tên biệt dược hoặc hoạt chất |
| Tiền tố biệt dược | 96 | Tên biệt dược bắt đầu bằng chuỗi người dùng gõ |
| Chuỗi con biệt dược | 93 | Từ 2 ký tự trở lên |
| Chuỗi con hoạt chất | 90 | Từ 2 ký tự trở lên |
| Fuzzy | ≥ 88 | Từ 4 ký tự trở lên, so với **từng token** của tên |

Ràng buộc độ dài không phải để tối ưu tốc độ mà để chặn kết quả rác: `token_set_ratio`
chấm điểm cao bất thường trên chuỗi ngắn — gõ `Ha` từng trả về `Viên Sáng Mắt`. Fuzzy so
với từng token thay vì cả chuỗi vì `fuzz.ratio("panadl", "panadol vien sui")` chỉ đạt
54.5 trong khi so với riêng token `panadol` đạt 92.3; so cả chuỗi thì fuzzy là code chết.

`requiresConfirmation` chỉ bằng `false` khi có **đúng một** ứng viên và ứng viên đó khớp
tuyệt đối. Khớp tiền tố hay chuỗi con không đủ để hệ thống tự chọn hộ — thuốc chọn sai đi
thẳng vào lượt kiểm tra tương tác. Không có ứng viên nào thì cũng là `false` vì không có
gì để xác nhận.

`/drugs/letters` luôn trả **đủ 27 nhóm** A–Z + `other` kể cả nhóm `count = 0`, để FE
disable đúng nút thay vì dẫn người dùng tới trang rỗng. Mỗi `count` bằng đúng `total` mà
`/drugs?letter=` trả về cho cùng chữ cái.

`letter` nhận `A`–`Z` (không phân biệt hoa thường) hoặc `other` cho tên không bắt đầu bằng
chữ cái Latin. **Không dùng ký tự `#`** dù UI hiển thị nhãn đó: `?letter=#` bị trình duyệt
cắt thành fragment nên tham số không bao giờ tới server, và lỗi này im lặng hoàn toàn.

`q` khớp không phân biệt hoa thường và không phân biệt dấu trên tên biệt dược
(`brand_name_unaccent`), khớp trên chuỗi gốc viết thường với hoạt chất. Ký tự `%` và `_`
người dùng nhập được escape, không phải wildcard.

`total` là tổng số dòng khớp bộ lọc, không phải số dòng của trang hiện tại. Trang vượt quá
phạm vi vẫn trả `200` với `items: []` và `total` giữ nguyên.

`DrugListItem` **không có citation** vì danh sách không hiển thị nội dung lâm sàng; nó chỉ
báo `hasLeaflet` để FE biết trang chi tiết có nguồn hay không. Nội dung có dẫn nguồn thuộc
về endpoint chi tiết.as/auth.py` | `User` (`users`), `OAuthIdentity` (`oauth_identities`) |
| Tra cứu & OCR đơn thuốc | `/api/v1/drugs` | `backend/src/medsafe/schemas/drug.py`, `ocr.py` | `Drug` (`drugs`), `EvidenceChunk` (`evidence_chunks`) |
| Kiểm tra & Lịch sử Tra cứu | `/api/v1/interactions` | `specs/001-core-interaction-check/contracts/interaction-check.openapi.yaml` | `DrugDrugInteraction`, `DrugFoodInteraction`, `DrugDiseaseInteraction`, `InteractionLookupHistory` (`interaction_lookup_history`) |
| Duyệt Chuyên môn (Dược sĩ/Bác sĩ) | `/api/v1/review` | `backend/src/medsafe/schemas/review.py` | `InteractionLookupHistory`, `DrugDrugInteraction`, `DrugDiseaseInteraction` |
| Quản trị hệ thống (Admin) | `/api/v1/admin` | `backend/src/medsafe/schemas/admin.py` | `User`, `Drug`, `EvidenceChunk` |

---
>>>>>>> Stashed changes

## 1. Auth & User Profiles (`/api/v1/auth`)

| Endpoint | Method | Body / Query | Trả về | Quyền | Mô tả |
|---|---|---|---|---|---|
| `/api/v1/auth/register` | `POST` | `{email, password, name}` | `201` + `AuthUserResponse` | Public | Đăng ký tài khoản bệnh nhân |
| `/api/v1/auth/login` | `POST` | `{email, password}` | `200` + `LoginResponse` | Public | Đăng nhập bằng email/password |
| `/api/v1/auth/google` | `POST` | `{idToken}` | `200` + `LoginResponse` | Public | Đăng nhập Google OIDC |
| `/api/v1/auth/refresh` | `POST` | `{refreshToken}` | `200` + `TokenPairResponse` | Public | Lấy cặp token mới bằng refresh token |
| `/api/v1/auth/profiles` | `GET` | — (Header `Bearer`) | `200` + `AuthUserResponse` | Protected | Lấy thông tin tài khoản & profile chi tiết |
| `/api/v1/auth/profiles` | `PATCH` | `UserProfileUpdateRequest` | `200` + `AuthUserResponse` | Protected | Cập nhật thông tin profile cá nhân |

### Cột bổ sung trong Bảng `users` (`User` Model):
- **Bệnh nhân (`PATIENT`)**: `date_of_birth` (Date), `age` (Integer), `gender` (`male` \| `female` \| `other`), `weight_kg` (Float), `underlying_conditions` (Array Text, ví dụ: `["Tăng huyết áp", "Suy thận"]`).
- **Bác sĩ / Dược sĩ (`PHARMACIST`)**: `specialty` (Text, ví dụ: `"Dược lâm sàng"`), `qualifications` (Text, ví dụ: `"Dược sĩ CKI"`).

### Schemas Auth & Profiles:
```typescript
interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  // Chi tiết Profile theo role:
  patientProfile?: {
    age?: number;
    dateOfBirth?: string;
    gender?: "male" | "female" | "other";
    weightKg?: number;
    underlyingConditions?: string[];
  };
  doctorProfile?: {
    specialty?: string;
    qualifications?: string;
  };
}

interface UserProfileUpdateRequest {
  name?: string;
  // Cho Patient:
  age?: number;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  weightKg?: number;
  underlyingConditions?: string[];
  // Cho Doctor/Pharmacist:
  specialty?: string;
  qualifications?: string;
}
```

---

## 2. Tra cứu Thuốc & OCR Đơn thuốc (`/api/v1/drugs`)

| Endpoint | Method | Params / Request | Trả về | Quyền | Mô tả |
|---|---|---|---|---|---|
| `/api/v1/drugs/search` | `GET` | Query `q`, `limit` | `200` + `DrugSearchResponse` | Public / Protected | Tìm kiếm danh mục thuốc (fuzzy match `brand_name_unaccent` & `canonical_ingredients`) |
| `/api/v1/drugs/{drug_id}` | `GET` | Path `drug_id` | `200` + `DrugDetailResponse` | Public / Protected | Chi tiết thông tin thuốc & các mục HDSD từ model `Drug` |
| `/api/v1/drugs/ocr-prescription` | `POST` | `multipart/form-data` (`file`) | `200` + `PrescriptionOCRResponse` | Protected | Trích xuất đơn thuốc từ ảnh/PDF -> danh sách candidate |

### Ánh xạ DB & Schemas:
- `DrugSearchResponse`: `{query: string, candidates: DrugCandidate[], requiresConfirmation: boolean}`
- `DrugCandidate`: `{drugId: UUID, brandName: string, ingredient: string, confidence: number}`
- `DrugDetailResponse` (Ánh xạ từ model `Drug`):
  ```typescript
  {
    drugId: string;
    brandName: string;
    ingredientRaw: string;
    canonicalIngredients: string[];
    dosageForm?: string;
    route?: string;
    manufacturer?: string;
    leafletUrl?: string;
    indications?: string;
    contraindications?: string;
    dosageAndAdmin?: string;
    warningsAndPrecautions?: string;
    sideEffects?: string;
    notes?: string;
  }
  ```
- `PrescriptionOCRResponse`: `{rawText: string, detectedItems: PrescribedItemCandidate[]}`
- `PrescribedItemCandidate`: `{originalText: string, matchedCandidate?: DrugCandidate, confidence: number}`

---

## 3. Kiểm tra Tương tác & Lịch sử Tra cứu (`/api/v1/interactions`)

| Endpoint | Method | Request Body / Query | Trả về | Quyền | Mô tả |
|---|---|---|---|---|---|
| `/api/v1/interactions/check` | `POST` | `InteractionCheckRequest` | `200` + `InteractionCheckResponse` | Protected | Tra cứu tương tác Thuốc-Thuốc, Thuốc-Thực phẩm, Thuốc-Bệnh nền (Tự động lưu lịch sử) |
| `/api/v1/interactions/history` | `GET` | Query `page`, `limit` | `200` + `PaginatedLookupHistory` | Patient | Xem danh sách lịch sử tra cứu của bệnh nhân |
| `/api/v1/interactions/history/{id}` | `GET` | Path `id` | `200` + `LookupHistoryDetailResponse` | Patient / Doctor | Xem chi tiết 1 bản ghi tra cứu lịch sử |
| `/api/v1/interactions/history/{id}/submit` | `POST` | `SubmitToDoctorRequest` | `200` + `LookupHistoryDetailResponse` | Patient | Gửi bản ghi tra cứu cho Bác sĩ phê duyệt & nhận xét |

### Bảng ORM mới: `interaction_lookup_history` (`InteractionLookupHistory` Model):
- `id` (UUID, PK)
- `user_id` (UUID, FK `users.id`)
- `query_drugs` (JSONB: mảng drug ID & tên thuốc đã tra)
- `query_foods` (JSONB: mảng thực phẩm)
- `query_conditions` (JSONB: mảng bệnh nền)
- `check_result` (JSONB: kết quả `items` & `unavailable`)
- `is_submitted_to_doctor` (Boolean, mặc định `False`)
- `submitted_at` (DateTime, optional)
- `patient_notes` (Text, optional: ghi chú của bệnh nhân khi gửi)
- `assigned_doctor_id` (UUID, FK `users.id`, optional)
- `doctor_status` (String: `pending_review` \| `reviewed` \| `approved` \| `rejected`, mặc định null/pending)
- `doctor_comment` (Text, optional: nhận xét & hướng dẫn chuyên môn của bác sĩ)
- `doctor_reviewed_at` (DateTime, optional)
- `created_at` (DateTime)

### Schemas chính:
```typescript
interface InteractionCheckRequest {
  drugIds: string[];
  foods?: string[];
  conditions?: string[];
}

interface LookupHistoryItemResponse {
  id: string;
  createdAt: string;
  queryDrugs: { drugId: string; brandName: string }[];
  queryFoods: string[];
  queryConditions: string[];
  checkResult: InteractionCheckResponse;
  isSubmittedToDoctor: boolean;
  submittedAt?: string;
  patientNotes?: string;
  doctorStatus?: "pending_review" | "reviewed" | "approved" | "rejected";
  doctorComment?: string;
  doctorReviewedAt?: string;
}

interface SubmitToDoctorRequest {
  patientNotes?: string;
  preferredDoctorId?: string;
}
```

---

## 4. Luồng Duyệt Chuyên môn Dược sĩ / Bác sĩ (`/api/v1/review`)

Dành riêng cho Bác sĩ / Dược sĩ chuyên môn (`ROLES.PHARMACIST` / Doctor) truy cập tầng `/review/**`.

| Endpoint | Method | Request / Query | Trả về | Quyền | Mô tả |
|---|---|---|---|---|---|
| `/api/v1/review/consultations` | `GET` | Query `page`, `limit`, `status` | `200` + `PaginatedLookupHistory` | Pharmacist / Doctor | Xem danh sách các bản ghi tra cứu do bệnh nhân submit |
| `/api/v1/review/consultations/{id}` | `GET` | Path `id` | `200` + `LookupHistoryDetailResponse` | Pharmacist / Doctor | Xem chi tiết bản ghi tra cứu kèm hồ sơ bệnh nhân |
| `/api/v1/review/consultations/{id}/action` | `POST` | `ConsultationReviewActionRequest` | `200` + `LookupHistoryDetailResponse` | Pharmacist / Doctor | Bác sĩ phê duyệt/từ chối bản ghi và gửi comment/khuyến cáo |
| `/api/v1/review/queue` | `GET` | Query `page`, `limit` | `200` + `ReviewQueueResponse` | Pharmacist / Doctor | Xem hàng chờ bằng chứng OCR/Leaflet cần kiểm tra |
| `/api/v1/review/evidences/{version_id}/action` | `POST` | `EvidenceReviewActionRequest` | `200` + `EvidenceVersionResponse` | Pharmacist / Doctor | Cập nhật `review_status`, `reviewer_id`, `reviewed_at` trong database |

### Schemas chính:
```typescript
interface ConsultationReviewActionRequest {
  action: "approve" | "reject" | "comment";
  doctorComment: string;
  recommendedAdjustments?: string;
}

interface EvidenceReviewActionRequest {
  action: "approve" | "reject" | "correct";
  professionalComment?: string;
  correctedQuote?: string;
  correctedSeverity?: string;
}
```

---

## 5. Quản trị Hệ thống Admin (`/api/v1/admin`)

Dành cho Quản trị viên hệ thống (`ROLES.ADMIN`) quản lý tài khoản người dùng và cơ sở dữ liệu dataset.

| Endpoint | Method | Request / Query | Trả về | Quyền | Mô tả |
|---|---|---|---|---|---|
| `/api/v1/admin/users` | `GET` | Query `page`, `limit`, `role`, `search` | `200` + `PaginatedUsersResponse` | Admin | Quản lý danh sách người dùng (`users` table) |
| `/api/v1/admin/users/{user_id}` | `PATCH` | `UpdateUserRoleStatusRequest` | `200` + `AuthUserResponse` | Admin | Cập nhật phân quyền (`role`: `PATIENT`, `PHARMACIST`, `ADMIN`) hoặc khóa/mở tài khoản (`is_active`) |
| `/api/v1/admin/datasets/import` | `POST` | `multipart/form-data` (`file`, `sourceName`) | `202` + `DatasetImportJobResponse` | Admin | Import/nạp mới tập dữ liệu thuốc vào `drugs`, `evidence_chunks` |
| `/api/v1/admin/datasets/jobs` | `GET` | Query `page`, `limit` | `200` + `PaginatedDatasetJobs` | Admin | Theo dõi tiến trình indexing Qdrant & PostgreSQL background |

### Schemas chính:
- `UpdateUserRoleStatusRequest`: `{role?: "PATIENT" | "PHARMACIST" | "ADMIN", isActive?: boolean}`
- `DatasetImportJobResponse`: `{jobId: string, status: "processing" | "completed" | "failed", filename: string, totalRecords?: number, createdAt: string}`

---

## 6. Định dạng Phản hồi Lỗi & Error Codes

### Phản hồi lỗi chuẩn (`ErrorResponse`):
```json
{
  "status": 400,
  "code": "error_code_name",
  "message": "Thông điệp lỗi dành cho giao diện / người dùng",
  "details": []
}
```

### Chỉ mục Error Codes:

| Phân nhóm | Error Code | HTTP Status | Khi nào phát sinh |
|---|---|---|---|
| **Auth & Profile** | `password_policy_violation` | 400 | Mật khẩu ngắn hơn yêu cầu, thiếu chữ hoặc thiếu số |
| | `invalid_credentials` | 401 | Mật khẩu sai hoặc email không tồn tại |
| | `invalid_token` | 401 | Access / Refresh Token hỏng, hết hạn hoặc dùng sai loại |
| | `invalid_google_token` | 401 | Google ID Token sai chữ ký, hết hạn hoặc không hợp lệ |
| | `google_email_not_verified` | 401 | Tài khoản Google chưa được xác minh email |
| | `account_inactive` | 403 | Tài khoản ở trạng thái `is_active = false` |
| | `email_already_registered` | 409 | Email đã được sử dụng tạo tài khoản local |
| | `google_account_conflict` | 409 | Trùng email local nhưng chưa liên kết `oauth_identities` |
| **Catalog & OCR** | `drug_not_found` | 404 | Không tìm thấy mã thuốc trong danh mục |
| | `ocr_processing_failed` | 422 | Tệp ảnh/PDF đơn thuốc mờ hoặc lỗi không trích xuất được |
| **History & Consultation** | `history_record_not_found` | 404 | Không tìm thấy bản ghi tra cứu theo ID |
| | `already_submitted` | 409 | Bản ghi tra cứu này đã được gửi cho bác sĩ trước đó |
| | `unauthorized_review_action` | 403 | Người dùng không có quyền Bác sĩ / Dược sĩ |
| | `evidence_version_not_found` | 404 | Phiên bản bằng chứng không tồn tại trong hệ thống |
| **Admin** | `admin_privilege_required` | 403 | Yêu cầu quyền ADMIN để thực hiện thao tác này |
| | `dataset_import_failed` | 422 | File dataset import bị lỗi cấu trúc / định dạng |
