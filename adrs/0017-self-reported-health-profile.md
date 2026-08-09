# ADR 0017 — Hồ sơ sức khoẻ tự khai nằm ở bảng riêng, không nằm trong identity

- **Trạng thái:** Được chấp nhận
- **Ngày:** 2026-08-09
- **Liên quan:** mở rộng phạm vi sản phẩm so với `specs/product-vision.md`; giữ nguyên ADR
  0005, 0006 và 0012; bổ sung ADR 0015 (backend sở hữu identity)

## Bối cảnh

Sản phẩm cần biết tuổi và bệnh nền của người dùng để phục vụ luồng *tra thuốc với bệnh
nền*. Hiện trạng như sau:

- [`gate/gate_1/README.md`](../gate/gate_1/README.md) — đã nộp, bất biến — **tự mâu thuẫn**.
  Mục *Out of Scope* của PRD (dòng 49) loại *"tương tác thuốc–bệnh lý"*, nhưng phần mô tả
  sơ đồ UI Flow (dòng 64) lại vẽ *"Tra thuốc với bệnh nền"* là một trong ba chức năng của
  bệnh nhân.
- `specs/product-vision.md` và `AGENTS.md` chép đúng theo mục *Out of Scope* của PRD. Hai
  file này **không sai**; chỗ lệch nằm trong chính gate 1, giữa PRD và sơ đồ.
- Backend đã có model `DrugDiseaseInteraction`, `disease_repository.py` và một migration
  tạo bảng `drug_disease_interactions`, trong khi frontend `interactions/drug-disease/page.tsx`
  là server component tĩnh với mọi control disabled.
- **Bảng `drug_disease_interactions` không tồn tại trong database.** Migration tạo nó chưa
  bao giờ chạy được và sẽ không bao giờ chạy — xem mục "Chặn kỹ thuật" bên dưới. Mọi query
  qua `disease_repository.py` hiện sẽ chết với `relation … does not exist`.

Vì gate 1 không tự phân xử được, đây **không phải sửa lỗi tài liệu mà là mở rộng phạm vi
có chủ đích**, do leader quyết định theo cơ chế AGENTS.md đã mở sẵn: *"Các nguyên tắc sản
phẩm có thể được leader sửa thông qua spec và ADR được phê duyệt."*

Điều khoản *"`gate/gate_1/` là bất biến và không thể được nới lỏng bởi bất kỳ tài liệu
nào"* vẫn được tôn trọng. Nó cấm **nới lỏng ràng buộc**, mà ba nguyên tắc an toàn của gate
1 đều giữ nguyên và được nhắc lại ở mục Quyết định bên dưới. Thêm một chức năng vào phạm vi
là mở rộng, không phải nới lỏng.

Vấn đề kỹ thuật đi kèm: `AuthUserResponse` được nhét nguyên vào JWT của NextAuth
(`frontend/src/lib/auth.ts`, callback `jwt`), và JWT đó nằm trong cookie trình duyệt.

## Quyết định

**1. Đưa hồ sơ sức khoẻ tự khai vào phạm vi**, giới hạn ở dữ liệu do người dùng tự nhập.
Hệ thống không suy luận, không chẩn đoán và không tự thêm bệnh nền cho ai.

**2. Hai bảng mới**, không thêm cột vào `users`:

| Bảng | Quan hệ | Nội dung |
|---|---|---|
| `patient_profiles` | 1-1 với `users` | `user_id`, `date_of_birth`, `sex`, `updated_at` |
| `patient_conditions` | 1-n với `users` | `user_id`, `disease_name`, `disease_name_unaccent`, `source`, `created_at` |

Lưu `date_of_birth`, **không** lưu tuổi. Tuổi là giá trị dẫn xuất; lưu số tuổi thì sang năm
dữ liệu sai mà không có tín hiệu nào báo.

`disease_name_unaccent` chuẩn hoá bằng đúng `domain/normalization.py` mà migration của
`drug_disease_interactions` đã chọn cho cột cùng tên, để hai bên join được khi bảng đó
thực sự tồn tại.

`source` có hai giá trị: `self_reported` và `pharmacist_confirmed`. Đưa vào ngay từ
migration đầu tiên, không thêm sau — thêm sau phải backfill toàn bộ dữ liệu đã có và không
có cách nào biết dòng cũ thuộc loại nào.

**3. API riêng, ngoài namespace auth:**

```
GET    /api/v1/patients/me/health-profile
PUT    /api/v1/patients/me/health-profile
POST   /api/v1/patients/me/conditions
DELETE /api/v1/patients/me/conditions/{id}
```

`AuthUserResponse` **giữ nguyên**, chỉ chứa `id`, `email`, `name`, `roles`.

**4. Gọi là "hồ sơ sức khoẻ tự khai", không gọi là "hồ sơ bệnh án"** trong mọi tài liệu,
UI string và tên bảng. Bệnh án hàm ý dữ liệu do cơ sở y tế lập và chịu trách nhiệm — đó là
thứ sản phẩm này không làm, theo nguyên tắc "không kết luận lâm sàng".

**5. Nguyên tắc an toàn không đổi.** Cảnh báo thuốc–bệnh nền vẫn phải có trích dẫn nguyên
văn (ADR 0006), vẫn hiển thị ngay kèm nhãn chờ xác nhận (ADR 0005), và không có trích dẫn
thì trả "chưa có dữ liệu" chứ không suy đoán.

## Lý do

- **Bệnh nền không được lọt vào JWT.** Thêm trường vào `AuthUserResponse` đồng nghĩa danh
  sách bệnh của bệnh nhân nằm trong cookie trình duyệt và đi theo mọi request. Đây là lý do
  đủ để loại phương án mở rộng `/auth/profiles`, độc lập với mọi cân nhắc khác.
- **`users` là bảng identity.** Nó giữ `password_hash` và thuộc ADR 0015. Dữ liệu lâm sàng
  có vòng đời, độ nhạy và quyền truy cập khác hẳn; trộn chung là quyết định không đảo được.
- **Bệnh nền là quan hệ 1-n.** Nhét vào `users` buộc phải dùng cột JSON hoặc ARRAY, mất khả
  năng join với `drug_disease_interactions` mà schema đã định nghĩa sẵn.
- **Hồ sơ tự khai không phải "long-term memory".** Ranh giới bị loại trong
  `product-vision.md` là việc *agent tự ghi nhớ giữa các phiên*. Đây là dữ liệu người dùng
  chủ động nhập, nhìn thấy và xoá được. Khác nhau về bản chất, cần nói rõ trong spec để
  người sau không đọc nhầm thành nới lỏng nguyên tắc.

## Hệ quả

- ✅ Contract identity không đổi; frontend `types/auth.d.ts` và NextAuth không phải sửa.
- ✅ Dữ liệu sức khoẻ tách bảng nên xoá theo yêu cầu người dùng là một `DELETE`, không đụng
  tới tài khoản.
- ✅ Join thẳng được với `drug_disease_interactions` khi bảng đó được tạo, vì dùng chung
  quy ước `disease_name_unaccent`.
- ✅ `source` cho phép dược sĩ xác nhận bệnh nền mà vẫn phân biệt được với dữ liệu tự khai.
- ❌ Dự án bắt đầu lưu **dữ liệu sức khoẻ ở trạng thái nghỉ**. Kéo theo nghĩa vụ chưa từng
  có: thông báo và thu thập đồng ý khi nhập, cho phép xoá, và không đưa dữ liệu này vào log
  hay `.ai-log/`.
- ❌ Phải sửa `specs/product-vision.md` và `AGENTS.md` trong cùng pull request với ADR này,
  nếu không tài liệu sẽ mâu thuẫn với code ngay ngày đầu.
- ❌ ADR này chỉ giải quyết việc **lưu hồ sơ**. Luồng tra cứu thuốc–bệnh nền, UI và việc gỡ
  trạng thái disabled của `interactions/drug-disease/page.tsx` là ticket riêng.
- ❌ Người dùng tự khai sai thì kết quả tra cứu sai. UI phải nói rõ đây là thông tin do
  người dùng nhập, không phải hồ sơ y tế được xác thực.

## Ràng buộc bắt buộc với Supabase

PostgREST expose mọi bảng trong schema `public` qua anon key, mà anon key nằm công khai
trong bundle frontend. Hai bảng mới **bắt buộc** bật `ROW LEVEL SECURITY` và không tạo
policy nào, giống `users` ở migration `0001`. Quên bước này là công khai bệnh nền của toàn
bộ người dùng cho bất kỳ ai đọc được bundle.

## Chặn kỹ thuật phải xử lý trước

`alembic upgrade head` **đang hỏng trên `main`**, độc lập với ADR này. Hai migration cùng
khai báo `revision = "0003"` và cùng `down_revision = "0002"`:

```
20260805_0003_google_oauth.py                     revision "0003" ← trùng
20260806_0003_add_drug_disease_interactions.py    revision "0003" ← trùng
```

Alembic cảnh báo `Revision 0003 is present more than once`, báo hai head và
`alembic upgrade head` thất bại với `Multiple head revisions are present`. `alembic history`
chỉ liệt kê **một** trong hai revision nên migration còn lại biến mất khỏi đồ thị.

Trạng thái Supabase đo ngày 2026-08-09:

| Kiểm tra | Kết quả |
|---|---|
| `alembic_version` | `0003` |
| `oauth_identities`, `users.password_hash` nullable | có — migration `google_oauth` đã chạy |
| `drug_disease_interactions` | **không tồn tại** |

Database đóng dấu `0003`, nên Alembic coi revision `0003` là đã xong. Migration bệnh nền
cũng tự xưng `0003`, nên nó **không bao giờ được chạy** — chạy lại `upgrade` cũng vô ích vì
Alembic không thấy việc gì cần làm. Đây là lỗi tự che giấu: model và repository tồn tại,
code import bình thường, chỉ tới khi có query thật mới chết.

Cách sửa: đổi migration bệnh nền thành mắt xích tiếp theo thay vì mắt xích song song —
`revision = "0004"`, `down_revision = "0003"`, đổi tên file cho khớp. Sau đó
`alembic upgrade head` sẽ tạo bảng còn thiếu. Rủi ro thấp vì bảng chưa tồn tại nên không có
dữ liệu để mất. Không dùng `alembic stamp` để lách: stamp chỉ đổi dấu mốc chứ không tạo
bảng, và sẽ chôn lỗi sâu hơn.

Việc này **phải xong trước** khi thêm bảng hồ sơ sức khoẻ, vì migration mới cần một
`down_revision` không mập mờ để trỏ vào. Đây là ticket riêng, không thuộc ADR này.

## Phương án đã xem xét

- **Thêm cột vào `users`, mở rộng `/auth/profiles`.** Ít file phải sửa nhất. Bị loại vì rò
  dữ liệu sức khoẻ vào JWT, vì trộn identity với dữ liệu lâm sàng, và vì bệnh nền là quan
  hệ 1-n.
- **Chỉ lưu ở phía client (localStorage).** Không phát sinh nghĩa vụ bảo vệ dữ liệu và là
  phương án rủi ro thấp nhất. Bị loại vì mất dữ liệu khi đổi thiết bị, và vì dược sĩ không
  đọc được hồ sơ khi duyệt — mà human-in-the-loop là nguyên tắc số 3 của sản phẩm.
- **Giữ nguyên "ngoài phạm vi".** Đây là phương án đúng nếu bám sát mục *Out of Scope* của
  PRD trong gate 1, và nó cũng có cái lợi thật: không phát sinh nghĩa vụ bảo vệ dữ liệu sức
  khoẻ. Bị loại vì sơ đồ UI Flow trong cùng file gate 1 đã vẽ màn này, và vì repo đã mang
  sẵn model, repository và migration cho `drug_disease_interactions` — giữ nguyên nghĩa là
  để một nhánh code chết mà không ai dám xoá cũng không ai được dùng. Leader chấp nhận đánh
  đổi đó một cách có ý thức, không phải vì tưởng rằng tài liệu đang sai.
