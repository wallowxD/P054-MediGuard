# Bằng chứng đánh giá Gate 2

> Bản sao chọn lọc từ
> [`eval/results/manual-test-cases.md`](../../eval/results/manual-test-cases.md). Các output
> dưới đây được copy từ response JSON thực tế của backend tại thời điểm đo, không phải dữ
> liệu giả lập hoặc kết quả kỳ vọng.

File này đóng gói 6 test case tiêu biểu ngay trong hồ sơ Gate 2: 5 case đạt và 1 case lỗi
đã được ghi nhận. Hồ sơ đầy đủ gồm 30 case nằm trong
[`eval/results/manual-test-cases.md`](../../eval/results/manual-test-cases.md), số liệu tổng
hợp nằm trong [`eval/results/report.md`](../../eval/results/report.md).

## Môi trường đo

| Trường | Giá trị |
|---|---|
| Ngày chạy | 2026-08-14 |
| Commit vòng 1 | `1579ebd` — `feat(VMEC-68): add drug detail endpoint and wire up drug information page` |
| Commit vòng 2 | `1643d87` — `docs(VMEC-54): add manual test evidence and evaluation report` |
| Backend | `Medication Safety Copilot 0.1.0`, uvicorn tại `http://localhost:8000` |
| Runtime | macOS local (Darwin 25.5.0), Python 3.12.7 |
| Database | Supabase PostgreSQL — 1.311 thuốc, 4.693 drug–drug, 1.899 drug–disease, 215 drug–food, 47.644 evidence chunk |
| LLM | `google_genai / gemini-3.5-flash-lite` |
| Retrieval threshold | `0.35`, không hạ trong lúc đo |

## Tóm tắt

| ID | Kịch bản | Output chính | Trạng thái |
|---|---|---|---|
| TC-01 | Tương tác chống chỉ định có citation | Item `contraindicated`, quote khớp chunk nguồn | Pass |
| TC-02 | Regression Warfarin–Tamoxifen | `candidates: []`, không thay bằng Acenocoumarol | Pass |
| TC-03 | Record không resolve được nguồn | `items: []`, `reason: missing-citation` | Pass |
| TC-04 | Warning `pending_review` | Item được trả với `reviewStatus: pending` | Pass |
| TC-05 | Sinh unique pair C(N,2) | 4 thuốc tạo đúng 6 cặp | Pass |
| TC-06 | Thuốc phối hợp–bệnh nền | Cùng cặp xuất hiện ở cả `items` và `unavailable` | **Fail** |

## TC-01 — Tương tác chống chỉ định phải kèm trích dẫn nguyên văn

Mục tiêu: kiểm tra mọi cảnh báo hiển thị phải có quote nguyên văn và URL nguồn.

**Input** — `POST /api/v1/interactions/check`

```json
{
  "drugIds": [
    "68677774-88c6-4072-a8d4-e4895e51d930",
    "953cc929-cfd9-46a8-9689-861b9a159190"
  ],
  "diseaseIds": []
}
```

LOVAREM (lovastatin) + VORIOLE 200 (voriconazol).

**Output thực tế** — `HTTP 200`, 3,36 giây

```json
{
  "id": "drug-drug:5d06df62-0418-4a0b-a700-2434dc9c5eed",
  "kind": "drug-drug",
  "severity": "contraindicated",
  "reviewStatus": "pending",
  "subject": "lovastatin",
  "object": "voriconazol",
  "pairKey": "lovastatin|voriconazol",
  "mechanism": "Ức chế CYP3A4",
  "management": "Chống chỉ định sử dụng đồng thời",
  "aiSummary": {
    "status": "generated",
    "warning": "Thuốc này có cơ chế ức chế men gan CYP3A4, do đó không được khuyến cáo dùng chung với nhau.",
    "managementBullets": [
      "Chống chỉ định sử dụng đồng thời"
    ]
  },
  "citations": [
    {
      "evidenceId": "drug-drug:5d06df62-0418-4a0b-a700-2434dc9c5eed:v2",
      "chunkId": "f0ce08b4-d2f7-49b3-929c-8cd7f5734d8d",
      "quote": "Sử dụng đồng thời với các chất ức chế CYP3A4 (như itraconazol, ketoconazol, posaconazol, voriconazol, các chất ức chế HIV protease, boceprevir, telaprevir, erythromycin, clarithromycin, telithromycin, nefazodon, và các sản phẩm chứa cobicistat).",
      "source": "LOVASTATIN 20 mg",
      "sourceUrl": "https://drive.google.com/file/d/11HzeyLFZXxW7nitY9fCqexE3ISjBLawN/view?usp=drive_link",
      "section": "CHỐNG CHỈ ĐỊNH"
    }
  ]
}
```

**Kết luận: Pass.** `severityScale` đếm đúng `contraindicated: 1`, `highlightId` trỏ vào
item nặng nhất. Quote được xác minh tồn tại nguyên văn trong chunk `f0ce08b4…`.

## TC-02 — Regression Warfarin–Tamoxifen

Mục tiêu: truy vấn Warfarin + Tamoxifen không được trả bản ghi Acenocoumarol + Tamoxifen,
dù bản ghi gần nghĩa đó tồn tại và có nguồn.

**Input** — `GET /api/v1/drugs/search?q=warfarin`

**Output thực tế** — `HTTP 200`

```json
{
  "query": "warfarin",
  "candidates": [],
  "requiresConfirmation": false
}
```

Đối chứng trên cùng endpoint:

| Query | `candidates` | Ghi chú |
|---|---:|---|
| `warfarin` | 0 | Không có gợi ý |
| `acenocoumarol` | 2 | Vincerol 1 mg, VINCEROL 4 mg |
| `tamoxifen` | 1 | TAMIFINE |

**Kết luận: Pass.** Fuzzy matching không kéo acenocoumarol vào kết quả của warfarin. Hệ
thống trả rỗng thay vì suy đoán một thuốc cùng nhóm dược lý.

## TC-03 — Record không resolve được nguồn thì không hiển thị

Mục tiêu: record thiếu citation truy vết được phải trả `unavailable`, không tạo cảnh báo.

**Input** — VINCEROL 4 mg (acenocoumarol) + TAMIFINE (tamoxifen)

```json
{
  "drugIds": [
    "f2d7458d-1499-4012-86e9-650a1b71fafa",
    "e46a7fe1-2456-46cb-acf0-b17bd9c61667"
  ],
  "diseaseIds": []
}
```

**Output thực tế** — `HTTP 200`, 1,36 giây

```json
{
  "items": [],
  "notes": [],
  "unavailable": [
    {
      "key": "acenocoumarol|tamoxifen",
      "kind": "drug-drug",
      "subject": "acenocoumarol",
      "object": "tamoxifen",
      "reason": "missing-citation"
    }
  ],
  "severityScale": [
    {
      "severity": "contraindicated",
      "label": "Chống chỉ định",
      "resultCount": 0
    },
    {
      "severity": "major",
      "label": "Nguy cơ cao",
      "resultCount": 0
    },
    {
      "severity": "moderate",
      "label": "Cần thận trọng",
      "resultCount": 0
    },
    {
      "severity": "minor",
      "label": "Mức độ nhẹ",
      "resultCount": 0
    },
    {
      "severity": "unknown",
      "label": "Chưa phân loại",
      "resultCount": 0
    }
  ],
  "highlightId": null
}
```

**Kết luận: Pass.** Bản ghi `contraindicated` vẫn bị chặn vì không có citation nguyên văn
trỏ về tờ HDSD. Hệ thống chọn “chưa có dữ liệu” thay vì hiển thị cảnh báo không truy vết
được.

## TC-04 — Warning `pending_review` hiển thị ngay

Mục tiêu: cảnh báo hợp lệ được hiển thị ngay với nhãn đang chờ duyệt, không chờ dược sĩ.

**Input** — DIGOXIN-BFS + VINPHATON

```json
{
  "drugIds": [
    "f4cc8a18-c23b-4b35-a540-feb44add6223",
    "f6a60e17-2fd1-42e1-a4e5-18de42e58d1c"
  ],
  "diseaseIds": []
}
```

**Output thực tế** — `HTTP 200`, 2,13 giây

```json
{
  "id": "drug-drug:d935cc32-35ed-4a05-a901-ed92fa0b4e22",
  "kind": "drug-drug",
  "severity": "minor",
  "reviewStatus": "pending",
  "subject": "digoxin",
  "object": "vinpocetin",
  "citations": [
    {
      "chunkId": "9ed983e3-9a6f-4933-8e0f-5a98b7df7f65",
      "quote": "Dùng đồng thời với các thuốc chẹn beta như cloranolol và pindolol, với clopamid, glibenclamid, digoxin, acenocoumarol hoặc với hydrochlorothiazid không gặp tương tác thuốc.",
      "source": "VINPHATON",
      "sourceUrl": "https://drive.google.com/file/d/1Sr06EcEFfYlkRAnDQ8XcdSY0RcuBWu1V/view?usp=sharing",
      "section": "Tương tác thuốc"
    }
  ]
}
```

**Kết luận: Pass.** Item được trả với `reviewStatus: "pending"`. Trên 60 warning thu được
ở phép đo 30 lượt, 100% warning pending đều nằm trong payload, không bị chặn vì chưa duyệt.

Finding dữ liệu liên quan: quote nói “không gặp tương tác thuốc”. `aiSummary` đã dùng
fallback trung tính thay vì tự bịa cảnh báo, nhưng bản ghi này cần được xử lý ở pipeline
chất lượng dữ liệu.

## TC-05 — Sinh unique pair đúng C(N,2)

Mục tiêu: 4 thuốc phải tạo đúng C(4,2) = 6 cặp, không trùng và không tự ghép.

**Input** — LOVAREM + VORIOLE 200 + DIGOXIN-BFS + VINPHATON

```json
{
  "drugIds": [
    "68677774-88c6-4072-a8d4-e4895e51d930",
    "953cc929-cfd9-46a8-9689-861b9a159190",
    "f4cc8a18-c23b-4b35-a540-feb44add6223",
    "f6a60e17-2fd1-42e1-a4e5-18de42e58d1c"
  ],
  "diseaseIds": []
}
```

**Output thực tế** — `HTTP 200`, 3,48 giây

| Cặp | Kết quả |
|---|---|
| lovastatin + voriconazol | item, `contraindicated` |
| digoxin + vinpocetin | item, `minor` |
| digoxin + lovastatin | unavailable, `missing-record` |
| digoxin + voriconazol | unavailable, `missing-record` |
| lovastatin + vinpocetin | unavailable, `missing-record` |
| vinpocetin + voriconazol | unavailable, `missing-record` |

```text
items = 2, unavailable = 4, tổng = 6 = C(4,2)
severityScale = {contraindicated: 1, major: 0, moderate: 0, minor: 1, unknown: 0}
highlightId  = "drug-drug:5d06df62-0418-4a0b-a700-2434dc9c5eed"
```

**Kết luận: Pass.** Mỗi cặp xuất hiện đúng một lần ở `items` hoặc `unavailable`;
`highlightId` trỏ vào item có mức độ nghiêm trọng nhất.

## TC-06 — Tra cứu thuốc–bệnh nền trên thuốc phối hợp

Mục tiêu: kiểm tra exact lookup Co-Diovan® + bệnh nền “Vô niệu”. Case này lưu lại output
lỗi thực tế, không đánh dấu pass chỉ vì response trả `HTTP 200`.

**Input**

```json
{
  "drugIds": [
    "c5b7f710-dcdd-4423-b9b3-a880b6ad0042"
  ],
  "diseaseIds": [
    "e26f2554-f9ff-5367-a6f2-0021439189a2"
  ]
}
```

**Output thực tế** — `HTTP 200`, 3,73 giây

```json
{
  "items": [
    {
      "kind": "drug-disease",
      "severity": "contraindicated",
      "reviewStatus": "pending",
      "subject": "Co-Diovan®",
      "object": "Vô niệu",
      "citations": [
        "1 citation hợp lệ"
      ]
    }
  ],
  "unavailable": [
    {
      "key": "c5b7f710-dcdd-4423-b9b3-a880b6ad0042|e26f2554-f9ff-5367-a6f2-0021439189a2",
      "kind": "drug-disease",
      "subject": "Co-Diovan®",
      "object": "Vô niệu",
      "reason": "missing-record"
    }
  ]
}
```

**Kết luận: Fail.** Cùng cặp `Co-Diovan® × Vô niệu` xuất hiện đồng thời ở `items` với mức
chống chỉ định và ở `unavailable` với lý do chưa có bản ghi. Hai kết quả mâu thuẫn nhau.

Root cause đã được xác định trong evidence gốc: Co-Diovan® có hai hoạt chất
`valsartan` và `hydrochlorothiazide`; chỉ `hydrochlorothiazide` có record với “Vô niệu”.
Service sinh item cho một hoạt chất nhưng đồng thời sinh `unavailable` cho hoạt chất còn
lại bằng cùng khoá thuốc–bệnh.

## Tổng hợp hồ sơ đầy đủ

Hai vòng kiểm thử thủ công đầy đủ ghi nhận:

- 30 test case: 28 pass, 2 fail;
- 96/96 citation có `chunkId` được kiểm tra đều khớp nguyên văn, không có sai lệch;
- 106/106 warning ở hai vòng có `reviewStatus: pending` đều được trả trong payload;
- 7/7 câu hỏi chat nhạy cảm từ chối kết luận lâm sàng hoặc trả “chưa có dữ liệu”;
- cách ly lịch sử giữa hai tài khoản trả `404` đúng cho cả đọc và xoá trái quyền;
- p95 của ba lần đo 30 run lần lượt là 6,10 giây, 3,67 giây và 3,35 giây.

Hai case fail đều nằm ở nhánh drug–disease và đã được mô tả minh bạch trong
[`eval/results/report.md`](../../eval/results/report.md). Không case nào trong 30 case vi
phạm nguyên tắc bắt buộc citation hoặc cấm kết luận lâm sàng.

## Cách chạy lại

1. Checkout đúng commit cần đo và cấu hình Supabase development snapshot tương ứng.
2. Chạy `make dev`, đăng nhập bằng tài khoản test PATIENT.
3. Dùng stable ID trong từng input để gọi `POST /api/v1/interactions/check`.
4. Lưu HTTP status, thời gian phản hồi và response JSON nguyên bản.
5. Resolve `chunkId`, so sánh `citation.quote` với `evidence_chunks.content` bằng exact
   substring; không dùng model để phán đoán quote có “gần giống” hay không.
6. Ghi commit, ngày chạy, dataset version và mọi sai lệch mới vào hồ sơ đầy đủ.

Không chạy lại trên production data và không ghi đè kết quả cũ. Kết quả mới phải được
thêm thành một vòng đo mới để giữ audit trail.
