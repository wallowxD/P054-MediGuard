# Gate 2 — Trợ lý An toàn Thuốc

> Cuvée Tech · P-054 · Health System X

**Bản demo đã triển khai:**

- Web: [https://mediguard-tawny-two.vercel.app/](https://mediguard-tawny-two.vercel.app/)
- Backend API: [https://p054-mediguard.onrender.com/](https://p054-mediguard.onrender.com/)
- Swagger UI: [https://p054-mediguard.onrender.com/docs](https://p054-mediguard.onrender.com/docs)

Trợ lý An toàn Thuốc hỗ trợ tra cứu tương tác thuốc–thuốc, thuốc–thực phẩm, thực phẩm
bổ sung và thuốc–bệnh nền dựa trên dữ liệu có nguồn. Mỗi cảnh báo hợp lệ phải kèm trích
dẫn nguyên văn và đường dẫn tài liệu; khi không đủ bằng chứng, hệ thống trả “chưa có dữ
liệu” thay vì tự suy luận.

Hệ thống chỉ cung cấp thông tin tham khảo, không chẩn đoán, kê đơn, đề xuất đổi thuốc hoặc
thay thế đánh giá của bác sĩ/dược sĩ.

## 1. Thành phần hệ thống

| Thành phần | Công nghệ | Địa chỉ/cấu hình |
|---|---|---|
| Web | Next.js 16, React 19, TypeScript, Tailwind CSS | [Demo Vercel](https://mediguard-tawny-two.vercel.app/) · local: <http://localhost:3000> |
| API | FastAPI, Python 3.11, SQLAlchemy async | [Backend Render](https://p054-mediguard.onrender.com/) · local: <http://localhost:8000> |
| API docs | OpenAPI/Swagger UI | [Swagger Render](https://p054-mediguard.onrender.com/docs) · local: <http://localhost:8000/docs> |
| Database | Supabase PostgreSQL | Cấu hình bằng `DATABASE_URL` |
| AI/OCR | Gemini 3.5 Flash-Lite | Cấu hình bằng `GEMINI_API_KEY` |
| Vector store | Qdrant Cloud | Dùng cho ingestion/retrieval có cấu hình |

Luồng tra cứu thuốc–thuốc và thuốc–bệnh nền dùng exact key. Similarity search không được
dùng để quyết định một cặp có tương tác hay không. Cảnh báo đang chờ duyệt chuyên môn vẫn
được hiển thị nếu citation hợp lệ; bản ghi bị từ chối không được trả cho bệnh nhân.

## 2. Yêu cầu môi trường

Chạy mọi lệnh từ thư mục gốc `P-054/`, không mở riêng `backend/` hoặc `frontend/` làm
workspace.

| Công cụ | Yêu cầu |
|---|---|
| Git | Bản ổn định hiện hành |
| Python | 3.11 trở lên |
| uv | Bản ổn định hiện hành |
| Node.js | 20 trở lên |
| Corepack | Đi kèm Node.js |
| Docker Desktop/Engine | Tùy chọn, chỉ cần khi chạy bằng container |
| Supabase project | Bắt buộc cho các API đọc/ghi dữ liệu |

Frontend ghim `yarn@4.18.0`. Không dùng `npm install`, `npm i -g yarn` hoặc
`npx next dev`.

## 3. Thiết lập local

### Bước 1 — Lấy mã nguồn và đứng tại repository root

```bash
git clone https://github.com/AI20K-Build-Phase-Cohort-3/P-054.git
cd P-054
corepack enable
```

### Bước 2 — Tạo file môi trường

Dự án chỉ dùng **một** file `.env` tại repository root:

```bash
cp .env.example .env
openssl rand -hex 32
openssl rand -base64 32
```

Dán kết quả lệnh thứ nhất vào `JWT_SECRET_KEY`, kết quả lệnh thứ hai vào
`NEXTAUTH_SECRET`, rồi điền các credential được cấp cho môi trường development.

Không tạo `frontend/.env` hoặc `frontend/.env.local`, không commit `.env`, và không đặt
secret trong biến có tiền tố `NEXT_PUBLIC_`.

### Bước 3 — Cài hook và dependency

```bash
bash scripts/setup_hooks.sh
make install
make web-install
```

Hook chỉ cần cài một lần cho mỗi clone. Không tự chạy hoặc chỉnh sửa script ghi log AI,
không dùng `git push --no-verify`.

### Bước 4 — Áp migration

Kiểm tra `DATABASE_URL` đang trỏ đúng Supabase development project trước khi chạy:

```bash
make migrate
```

`make migrate` chỉ áp schema; lệnh này không tự tạo bộ dữ liệu demo. Các truy vấn nghiệp
vụ bên dưới cần Supabase project đã được team nạp catalog, interaction và evidence đã
duyệt. Không dùng dữ liệu production hoặc tự chạy script import cũ vào database dùng
chung khi chưa được leader phê duyệt.

### Bước 5 — Chạy ứng dụng

Cách dùng hằng ngày:

```bash
make dev
```

Hoặc chạy riêng trong hai terminal:

```bash
make run
make web
```

Nhấn `Ctrl-C` để dừng. Nếu cần kiểm tra đúng stack container:

```bash
make up
docker compose ps
make down
```

`make up` chạy nền nên phải dùng `make down`; `Ctrl-C` không dừng các container này.

### Bước 6 — Smoke test

```bash
curl -fsS http://localhost:8000/health
```

Kết quả mong đợi:

```json
{"status":"ok","env":"development"}
```

Sau đó kiểm tra:

- <http://localhost:3000> hiển thị trang chủ;
- <http://localhost:8000/docs> hiển thị Swagger UI;
- đăng ký/đăng nhập được khi database và auth secret đã cấu hình.

## 4. Biến môi trường

`.env.example` tại repository root là danh sách đầy đủ và là nguồn sự thật. Bảng dưới đây
phân loại các biến cần thiết cho Gate 2.

### 4.1. Chạy ứng dụng và đăng nhập bằng email

| Biến | Bắt buộc | Mô tả/giá trị local |
|---|---:|---|
| `DATABASE_URL` | Có | Supabase **Session pooler**, cổng `5432`, dùng tiền tố `postgresql+psycopg://` |
| `JWT_SECRET_KEY` | Có | Ký access/refresh token của FastAPI; sinh bằng `openssl rand -hex 32` |
| `NEXTAUTH_SECRET` | Có | Secret phía NextAuth; sinh bằng `openssl rand -base64 32` |
| `APP_ENV` | Có | `development` |
| `APP_HOST` | Không | Mặc định `0.0.0.0` |
| `APP_PORT` | Không | Mặc định `8000` |
| `CORS_ORIGINS` | Có | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Có | `http://localhost:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Có | `http://localhost:8000` |
| `NEXT_PUBLIC_ENVIRONMENT` | Có | `development` |
| `NEXTAUTH_URL` | Có | `http://localhost:3000` |
| `API_INTERNAL_URL` | Không | Để rỗng khi dùng `make dev`; Docker Compose tự đặt `http://backend:8000` |
| `LOG_LEVEL` | Không | `INFO`; dùng `DEBUG` khi cần chẩn đoán local |

Mật khẩu Supabase có ký tự đặc biệt phải được percent-encode, ví dụ `@` thành `%40` và
`:` thành `%3A`. Không dùng Transaction pooler cổng `6543` cho API chạy lâu dài.

### 4.2. Google Sign-In

| Biến | Bắt buộc khi dùng Google | Mô tả |
|---|---:|---|
| `GOOGLE_OAUTH_CLIENT_ID` | Có | Backend dùng để kiểm tra `audience` của Google ID Token |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Có | Browser khởi tạo Google Identity Services |

Hai client ID phải giống hệt nhau. Google Cloud Console cần có Authorized JavaScript
Origin `http://localhost:3000` cho local.

### 4.3. Gemini, OCR và grounded summary

| Biến | Bắt buộc theo tính năng | Mô tả |
|---|---:|---|
| `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` | Có | OCR ảnh đơn thuốc, chatbot và tóm tắt có cấu trúc |
| `GEMINI_MODEL` | Không | Mặc định `gemini-3.5-flash-lite` |
| `GEMINI_BASE_URL` | Không | Base URL tương thích OpenAI cho các script cũ |
| `USE_VERTEX_AI`, `VERTEX_API_KEY` | Không | Cấu hình provider Vertex cho tác vụ hỗ trợ |
| `GCP_PROJECT`, `GCP_LOCATION` | Không | Project và region khi dùng Vertex AI |

Nếu thiếu Gemini key, nhập thuốc thủ công và các endpoint không cần model vẫn dùng được.
OCR ảnh sẽ trả lỗi cấu hình an toàn; phần tóm tắt interaction/chat dùng nội dung fallback
thay vì tự tạo dữ kiện.

### 4.4. Ingestion, retrieval và dịch vụ hỗ trợ

| Nhóm | Biến |
|---|---|
| Supabase Storage | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Qdrant Cloud | `QDRANT_URL`, `QDRANT_API_KEY` |
| Embedding OpenAI | `OPENAI_API_KEY` |
| Qwen/Model Studio | `DASHSCOPE_API_KEY`, `DASHSCOPE_BASE_URL`, `QWEN_API_KEY`, `QWEN_MODEL`, `QWEN_BASE_URL` |
| OCR batch | `OCR_PROVIDER`, `OCR_DPI`, `OUTPUT_DIR` |
| LangSmith | `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT`, `LANGCHAIN_TRACING_V2` |
| AI usage log | `AI_LOG_SERVER`, `AI_LOG_API_KEY`, `AI_LOG_DIR` |

Các biến trong bảng này không bắt buộc để mở web và dùng email/password auth. Chỉ điền
khi chạy đúng adapter hoặc pipeline tương ứng. `SUPABASE_SERVICE_ROLE_KEY` là secret phía
server, tuyệt đối không đưa sang frontend.

### 4.5. Production/VPS

| Biến | Giá trị mong đợi |
|---|---|
| `PUBLIC_DOMAIN` | Domain đã trỏ DNS A record tới VPS |
| `ACME_EMAIL` | Email nhận thông báo chứng chỉ Let's Encrypt |
| `BIND_HOST` | `127.0.0.1` để không công khai trực tiếp cổng 3000/8000 |
| `APP_ENV` | `production` |
| `NEXT_PUBLIC_ENVIRONMENT` | `production` |
| `NEXT_PUBLIC_APP_URL` | `https://<domain>` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://<domain>`; cùng origin, không thêm `:8000` |
| `NEXTAUTH_URL` | `https://<domain>` |
| `CORS_ORIGINS` | `https://<domain>` |

Quy trình DNS, HTTPS, Google OAuth và rollback đầy đủ nằm tại
[`docs/deployment.md`](../../docs/deployment.md).

## 5. Truy vấn API mẫu

Các request protected dùng access token do FastAPI phát hành. Response API sử dụng
`camelCase`.

Đặt base URL một lần:

```bash
export MEDSAFE_API_URL="http://localhost:8000"
```

### 5.1. Health check

```bash
curl -fsS "$MEDSAFE_API_URL/health"
```

### 5.2. Đăng ký và đăng nhập

Đăng ký chỉ thực hiện một lần và không tự trả token:

```bash
curl -sS -X POST "$MEDSAFE_API_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"gate2.demo@example.com","password":"Gate2Demo!2026","name":"Gate 2 Demo"}'
```

Đăng nhập:

```bash
curl -sS -X POST "$MEDSAFE_API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"gate2.demo@example.com","password":"Gate2Demo!2026"}'
```

Copy trường `accessToken` từ response rồi đặt:

```bash
export MEDSAFE_TOKEN="<accessToken>"
```

Nếu email demo đã tồn tại, bỏ qua bước đăng ký hoặc dùng một email test khác được cấp cho
reviewer.

### 5.3. Tìm thuốc và lấy stable ID

Tìm theo biệt dược:

```bash
curl -sS --get "$MEDSAFE_API_URL/api/v1/drugs/search" \
  --data-urlencode "q=ASPIRIN - 100" \
  --data-urlencode "limit=5"
```

```bash
curl -sS --get "$MEDSAFE_API_URL/api/v1/drugs/search" \
  --data-urlencode "q=SavNopain 500" \
  --data-urlencode "limit=5"
```

Người dùng phải xác nhận đúng thuốc từ `candidates`; OCR hoặc fuzzy matching không được
tự biến thành định danh thuốc. Copy hai giá trị `drugId` đã xác nhận:

```bash
export MEDSAFE_DRUG_ID_1="<drugId-cua-ASPIRIN-100>"
export MEDSAFE_DRUG_ID_2="<drugId-cua-SavNopain-500>"
```

Duyệt catalog có phân trang:

```bash
curl -sS --get "$MEDSAFE_API_URL/api/v1/drugs" \
  --data-urlencode "letter=A" \
  --data-urlencode "page=1" \
  --data-urlencode "pageSize=10"
```

### 5.4. Tra cứu thuốc–thuốc

```bash
curl -sS -X POST "$MEDSAFE_API_URL/api/v1/interactions/check" \
  -H "Authorization: Bearer $MEDSAFE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"drugIds\":[\"$MEDSAFE_DRUG_ID_1\",\"$MEDSAFE_DRUG_ID_2\"],\"diseaseIds\":[]}"
```

Response có thể gồm:

- `items`: cảnh báo thuốc–thuốc/thuốc–bệnh nền có citation hợp lệ;
- `notes`: tương tác thuốc–thực phẩm hoặc thực phẩm bổ sung có nguồn;
- `unavailable`: cặp chưa có bản ghi hoặc thiếu citation;
- `checkId` và `historyStatus`: trạng thái lưu snapshot lịch sử.

`items` rỗng không có nghĩa là cặp thuốc an toàn; chỉ có nghĩa hệ thống chưa có cảnh báo
đủ bằng chứng trong dữ liệu hiện tại.

### 5.5. Tra cứu thuốc–bệnh nền

Tìm bệnh trong danh mục đóng:

```bash
curl -sS --get "$MEDSAFE_API_URL/api/v1/diseases" \
  -H "Authorization: Bearer $MEDSAFE_TOKEN" \
  --data-urlencode "q=Suy giảm chức năng thận" \
  --data-urlencode "limit=5"
```

Copy `id` của bệnh đã xác nhận và `drugId` của một thuốc, ví dụ `KETOPROXIN`:

```bash
export MEDSAFE_DISEASE_ID="<disease-id-da-xac-nhan>"
export MEDSAFE_DRUG_ID_1="<drugId-cua-KETOPROXIN>"

curl -sS -X POST "$MEDSAFE_API_URL/api/v1/interactions/check" \
  -H "Authorization: Bearer $MEDSAFE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"drugIds\":[\"$MEDSAFE_DRUG_ID_1\"],\"diseaseIds\":[\"$MEDSAFE_DISEASE_ID\"]}"
```

Request hợp lệ cần ít nhất hai thuốc, hoặc một thuốc kèm ít nhất một bệnh/tình trạng đã
được người dùng xác nhận cho lượt hiện tại.

### 5.6. Đọc ảnh đơn thuốc

Chấp nhận 1–5 ảnh JPG, PNG hoặc WEBP; mỗi ảnh tối đa 10 MB và tổng tối đa 25 MB:

```bash
curl -sS -X POST "$MEDSAFE_API_URL/api/v1/prescriptions/extract" \
  -H "Authorization: Bearer $MEDSAFE_TOKEN" \
  -F "images=@/duong-dan/toi/don-thuoc.jpg;type=image/jpeg"
```

Response luôn có `requiresConfirmation: true`. Candidate OCR phải được người dùng sửa và
xác nhận với catalog trước khi gửi sang endpoint tra cứu tương tác; ảnh chỉ tồn tại trong
request và không được lưu làm hồ sơ.

### 5.7. Chatbot có giới hạn nguồn

Khởi tạo chatbot ở scope tổng quát:

```bash
curl -sS -X POST "$MEDSAFE_API_URL/api/v1/chat/message" \
  -H "Authorization: Bearer $MEDSAFE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"initial","messages":[]}'
```

Gửi câu hỏi tổng quát:

```bash
curl -sS -X POST "$MEDSAFE_API_URL/api/v1/chat/message" \
  -H "Authorization: Bearer $MEDSAFE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"chat","messages":[],"userQuery":"Cảnh báo của hệ thống lấy nguồn từ đâu?"}'
```

Không có context không cho phép chatbot trả lời tự do về dữ kiện thuốc. Để hỏi về một
thuốc hoặc một lượt tra cứu, client phải gửi `drugContext` hoặc `context` lấy từ dữ liệu
đang hiển thị.

### 5.8. Lịch sử tra cứu

```bash
curl -sS --get "$MEDSAFE_API_URL/api/v1/interaction-checks" \
  -H "Authorization: Bearer $MEDSAFE_TOKEN" \
  --data-urlencode "page=1" \
  --data-urlencode "pageSize=20"
```

Mở một snapshot đã lưu:

```bash
curl -sS "$MEDSAFE_API_URL/api/v1/interaction-checks/<checkId>" \
  -H "Authorization: Bearer $MEDSAFE_TOKEN"
```

Trang lịch sử đọc snapshot, không tra lại interaction và không gọi model.

## 6. Kịch bản demo gợi ý

| Kịch bản | Dữ liệu nhập | Điều cần quan sát |
|---|---|---|
| Thuốc–thuốc | `ASPIRIN - 100` + `SavNopain 500` | Exact-pair warning, severity, citation và review status |
| Thuốc–bệnh nền | `KETOPROXIN` + `Suy giảm chức năng thận` | Giữ điều kiện cụ thể trong nguồn, không biến thành kết luận rộng |
| Thuốc–thực phẩm | Chọn thuốc chứa `felodipine` | Note `Nước ép bưởi` không bị lặp nếu có ở nhiều bảng nguồn |
| Wrong-pair regression | `Warfarin` + `Tamoxifen` khi chỉ có record `Acenocoumarol` + `Tamoxifen` | Không trả cảnh báo của cặp gần nghĩa |
| Thiếu dữ liệu | Một cặp không có evidence hợp lệ | Hiển thị giới hạn dữ liệu, không trình bày như xác nhận an toàn |
| OCR đơn thuốc | Ảnh JPG/PNG/WEBP rõ chữ | Candidate cần xác nhận; không tự đưa vào lượt tra cứu |

Kết quả cụ thể phụ thuộc version dữ liệu trên Supabase development project. Chỉ đánh giá
cảnh báo có citation nguyên văn, URL nguồn và evidence identity hợp lệ.

## 7. Bằng chứng đánh giá

Hồ sơ Gate 2 kèm [6 test case manual có output thực tế](eval-evidence.md), gồm 5 case pass
và 1 case fail đã được ghi nhận minh bạch. Bộ evidence đầy đủ có 30 case (28 pass, 2 fail)
nằm tại [`eval/results/manual-test-cases.md`](../../eval/results/manual-test-cases.md), báo
cáo tổng hợp tại [`eval/results/report.md`](../../eval/results/report.md).

## 8. Kiểm tra trước khi bàn giao

```bash
make check
make web-lint
make web-build
docker compose config --quiet
git diff --check
```

Không tuyên bố test pass nếu toàn bộ test bị skip. Báo leader nếu pre-push hook lỗi; không
bypass hook.

## 9. Sơ đồ Gate 2

- [Tổng quan hệ thống](<Architecture diagram /Tổng quan hệ thống.png>)
- [Module backend](<Architecture diagram /Module backend.png>)
- [Bốn loại tra cứu](<Architecture diagram /Bốn loại tra cứu.png>)
- [Data flow luồng tra cứu tương tác](<Architecture diagram /Data flow luồng tra cứu tương tác.png>)
- [Ingestion offline](<Architecture diagram /Ingestion offline.png>)
- [OCR đơn thuốc](<Architecture diagram /OCR đơn thuốc.png>)
- [Duyệt chuyên môn](<Architecture diagram /Duyệt chuyên môn.png>)
- [Chatbot RAG](<Architecture diagram /Chatbot RAG.png>)
- [Chatbot](<Architecture diagram /Chatbot.png>)

## 10. Tài liệu liên quan

- [README dự án](../../README.md)
- [Tầm nhìn sản phẩm](../../specs/product-vision.md)
- [Luồng toàn ứng dụng](../../specs/app-flow.md)
- [Mô hình miền và ranh giới RAG](../../specs/domains.md)
- [API contracts](../../specs/api-contracts.md)
- [Hướng dẫn backend](../../docs/backend.md)
- [Hướng dẫn frontend](../../docs/frontend.md)
- [Triển khai VPS](../../docs/deployment.md)
- [Bằng chứng đánh giá Gate 2](eval-evidence.md)
- [Báo cáo đánh giá](../../eval/results/report.md)
