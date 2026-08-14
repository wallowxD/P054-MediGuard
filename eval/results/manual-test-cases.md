# Kết quả kiểm thử thủ công

> **Mục đích:** ghi nhận kết quả **chạy tay thật** trên API đang chạy; không phải estimate.
> Mọi output bên dưới được copy từ response JSON thực tế của backend tại thời điểm đo.

Chỉ số tổng hợp và trạng thái deliverable nằm ở [report.md](report.md). File này lưu evidence
chi tiết đứng sau các con số đó.

## Điều hướng

- [Môi trường đo](#môi-trường-đo)
- [Tóm tắt kết quả](#tóm-tắt-kết-quả)
- [Các test case](#tc-01--tương-tác-chống-chỉ-định-phải-kèm-trích-dẫn-nguyên-văn)
- [Traceability](#traceability--kiểm-tra-trên-30-lượt-tra-cứu)
- [Phát hiện và việc cần làm tiếp](#phát-hiện-và-việc-cần-làm-tiếp)
- [Cách chạy lại](#cách-chạy-lại)

## Môi trường đo

| Trường                      | Giá trị                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Ngày chạy                   | 2026-08-14                                                                                                                     |
| Commit                      | `1579ebd` — `feat(VMEC-68): add drug detail endpoint and wire up drug information page`                                        |
| Branch                      | `VMEC-68`, working tree sạch                                                                                                   |
| Backend                     | `Medication Safety Copilot 0.1.0`, uvicorn tại `http://localhost:8000`                                                         |
| Runtime                     | macOS local (Darwin 25.5.0), Python 3.12.7                                                                                     |
| Database                    | Supabase PostgreSQL — 1311 drug (704 bản `version=v2`), 4693 drug–drug, 1899 drug–disease, 215 drug–food, 47644 evidence chunk |
| LLM                         | `google_genai / gemini-3.5-flash-lite`, chỉ dùng cho `source_grounded_presentation`                                            |
| `retrieval.score_threshold` | `0.35` (không hạ trong lúc đo)                                                                                                 |
| Tài khoản test              | `eval-manual@example.com`, role `PATIENT`                                                                                      |

Lịch sử tra cứu do các case này sinh ra đã được xoá bằng
`DELETE /api/v1/interaction-checks` sau khi đo (`204`, `total: 0`).

## Tóm tắt kết quả

| ID    | Case                                   | Kỳ vọng                                       | Kết quả                                        | Trạng thái |
| ----- | -------------------------------------- | --------------------------------------------- | ---------------------------------------------- | ---------- |
| TC-01 | Tương tác chống chỉ định có trích dẫn  | 1 item `contraindicated` kèm quote nguyên văn | Đúng, quote khớp chunk `f0ce08b4…`             | Pass       |
| TC-02 | Regression Warfarin–Tamoxifen          | Không thay bằng Acenocoumarol                 | `candidates: []` cho `warfarin`                | Pass       |
| TC-03 | Record không có nguồn hiển thị được    | Trả `unavailable`, không hiển thị cảnh báo    | `reason: missing-citation`                     | Pass       |
| TC-04 | Warning `pending_review` hiển thị ngay | Item hiện với `reviewStatus: pending`         | 60/60 warning `pending` đều trả về             | Pass       |
| TC-05 | Sinh unique pair C(N,2)                | 4 thuốc → đúng 6 cặp                          | 2 item + 4 unavailable = 6                     | Pass       |
| TC-06 | Tra cứu thuốc–bệnh nền exact key       | 1 item `contraindicated` có trích dẫn         | Có item, **nhưng kèm 1 unavailable trùng cặp** | **Fail**   |
| TC-07 | Cặp không có bản ghi                   | `reason: missing-record`                      | Đúng                                           | Pass       |
| TC-08 | Chuẩn hoá tên thuốc gõ sai             | Fuzzy match ra hoạt chất đúng                 | `paracetamon` → paracetamol                    | Pass       |
| TC-09 | Validation input                       | 1 thuốc, 0 bệnh → `422`                       | `422` kèm message tiếng Việt                   | Pass       |
| TC-10 | Bắt buộc xác thực                      | Không token → `401`                           | `401 invalid_token`                            | Pass       |

> **Kết quả:** 9/10 pass, 1 fail. Chi tiết lỗi nằm ở [TC-06](#tc-06--tra-cứu-thuốcbệnh-nền--fail)
> và mục [Phát hiện và việc cần làm tiếp](#phát-hiện-và-việc-cần-làm-tiếp).

## Các test case

---

### TC-01 — Tương tác chống chỉ định phải kèm trích dẫn nguyên văn

Kiểm tra nguyên tắc an toàn số 1: cảnh báo hiển thị phải có quote nguyên văn + source URL.

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

**Output thực tế** — `HTTP 200`, 3.36 s

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
    "managementBullets": ["Chống chỉ định sử dụng đồng thời"]
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

Response còn kèm 3 note thuốc–thực phẩm, trong đó có nước ép bưởi cho lovastatin và St.
John's wort cho voriconazol.

**Kết luận: Pass.** `severityScale` đếm đúng `contraindicated: 1`, `highlightId` trỏ vào
đúng item nặng nhất. Quote được xác minh tồn tại nguyên văn trong chunk `f0ce08b4…` (xem
mục Traceability).

---

### TC-02 — Regression Warfarin–Tamoxifen

Đây là bẫy được nêu trong `AGENTS.md`: truy vấn “Warfarin + Tamoxifen” không được trả bản
ghi “Acenocoumarol + Tamoxifen”. Nguồn và trích dẫn của bản ghi đó đều thật nhưng **sai cặp
thuốc**.

Điều kiện đo có ý nghĩa vì cả hai đều tồn tại trong database: bản ghi
`acenocoumarol|tamoxifen` là `contraindicated`, `review_status = approved`; còn warfarin
thì không có trong danh mục 704 thuốc `v2`.

**Input** — `GET /api/v1/drugs/search?q=warfarin`

**Output thực tế** — `HTTP 200`

```json
{ "query": "warfarin", "candidates": [], "requiresConfirmation": false }
```

Đối chứng, cùng endpoint:

| Query           | `candidates`                       | Ghi chú                                             |
| --------------- | ---------------------------------- | --------------------------------------------------- |
| `warfarin`      | `0`                                | Không có gợi ý nào                                  |
| `acenocoumarol` | `2` — Vincerol 1 mg, VINCEROL 4 mg | Cùng nhóm chống đông, vẫn không bị gán cho warfarin |
| `tamoxifen`     | `1` — TAMIFINE                     |                                                     |

**Kết luận: Pass.** Fuzzy matching không kéo acenocoumarol vào kết quả của warfarin, dù đây
là hoạt chất cùng nhóm dược lý và đang có sẵn bản ghi tương tác với tamoxifen. Hệ thống trả
rỗng thay vì đoán.

---

### TC-03 — Record không resolve được nguồn thì không được hiển thị

Không phải bản ghi nào cũng đủ điều kiện hiển thị. Trong 4693 bản ghi drug–drug:

| `source_type`       | Số bản ghi | Có `source_drug_id` | Có `source_leaflet_url` |
| ------------------- | ---------- | ------------------- | ----------------------- |
| `leaflet_ocr`       | 4061       | 1219                | 0                       |
| `national_database` | 632        | 0                   | 0                       |

632 bản ghi `national_database` không trỏ về tờ HDSD nào. Bản ghi
`acenocoumarol|tamoxifen` thuộc nhóm này, và trường `verbatim_quote` của nó thực chất là
văn bản tổng hợp chứ không phải trích dẫn nguyên văn:

> `Tương tác giữa Acenocoumarol và Tamoxifen. Cơ chế: Tamoxifen ức chế CYP2C9 làm giảm chuyển hóa của acenocoumarol. Hậu quả: Tăng nguy cơ xuất…`

**Input**

```json
{
  "drugIds": [
    "f2d7458d-1499-4012-86e9-650a1b71fafa",
    "e46a7fe1-2456-46cb-acf0-b17bd9c61667"
  ],
  "diseaseIds": []
}
```

VINCEROL 4 mg (acenocoumarol) + TAMIFINE (tamoxifen).

**Output thực tế** — `HTTP 200`, 1.36 s

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
    "…"
  ],
  "highlightId": null
}
```

**Kết luận: Pass.** Đây là hành vi đúng theo nguyên tắc số 1, không phải lỗi: bản ghi
`contraindicated` đã duyệt vẫn bị chặn hiển thị vì không có nguồn nguyên văn trỏ về được.
Hệ thống chọn “chưa có dữ liệu” thay vì hiển thị cảnh báo không truy vết được.

Đánh đổi cần leader biết: cách này đang khoá phần lớn dữ liệu `national_database`. Xem mục
“Phát hiện”.

---

### TC-04 — Warning `pending_review` hiển thị ngay

Nguyên tắc số 3: cảnh báo hợp lệ hiển thị ngay kèm nhãn chờ duyệt, không chờ dược sĩ.

**Input**

```json
{
  "drugIds": [
    "f4cc8a18-c23b-4b35-a540-feb44add6223",
    "f6a60e17-2fd1-42e1-a4e5-18de42e58d1c"
  ],
  "diseaseIds": []
}
```

DIGOXIN-BFS + VINPHATON — bản ghi này ở trạng thái `pending_review` trong database.

**Output thực tế** — `HTTP 200`, 2.13 s

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

**Kết luận: Pass.** Item được trả về với `reviewStatus: "pending"` chứ không bị lọc bỏ. Trên
60 warning thu được ở phép đo 30 lượt (mục Traceability), **100% có `reviewStatus: pending`
và đều nằm trong payload** — không có warning nào bị chặn vì chưa duyệt.

Lưu ý về nội dung: quote gốc nói “**không** gặp tương tác thuốc”, và `aiSummary` trả đúng
fallback trung tính “Chưa có thông tin cảnh báo cụ thể cho sự kết hợp này” thay vì bịa ra
một cảnh báo. Việc bản ghi này tồn tại trong bảng tương tác là vấn đề chất lượng dữ liệu
ingestion, ghi ở mục “Phát hiện”.

---

### TC-05 — Sinh unique pair đúng C(N,2)

**Input** — 4 thuốc, kỳ vọng C(4,2) = 6 cặp

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

LOVAREM + VORIOLE 200 + DIGOXIN-BFS + VINPHATON.

**Output thực tế** — `HTTP 200`, 3.48 s

| Cặp                      | Kết quả                       |
| ------------------------ | ----------------------------- |
| lovastatin + voriconazol | item, `contraindicated`       |
| digoxin + vinpocetin     | item, `minor`                 |
| digoxin + lovastatin     | unavailable, `missing-record` |
| digoxin + voriconazol    | unavailable, `missing-record` |
| lovastatin + vinpocetin  | unavailable, `missing-record` |
| vinpocetin + voriconazol | unavailable, `missing-record` |

```text
items = 2, unavailable = 4, tổng = 6 = C(4,2)
severityScale = {contraindicated: 1, major: 0, moderate: 0, minor: 1, unknown: 0}
highlightId  = "drug-drug:5d06df62-0418-4a0b-a700-2434dc9c5eed"   (item contraindicated)
```

**Kết luận: Pass.** Đúng 6 cặp, không trùng, không thiếu, không có cặp tự ghép. Mỗi cặp
xuất hiện đúng một lần ở `items` hoặc `unavailable`. `highlightId` trỏ vào item nặng nhất.

---

### TC-06 — Tra cứu thuốc–bệnh nền — **Fail**

**Input**

```json
{
  "drugIds": ["c5b7f710-dcdd-4423-b9b3-a880b6ad0042"],
  "diseaseIds": ["e26f2554-f9ff-5367-a6f2-0021439189a2"]
}
```

Co-Diovan® + bệnh nền “Vô niệu”.

**Output thực tế** — `HTTP 200`, 3.73 s

```json
{
  "items": [
    {
      "kind": "drug-disease",
      "severity": "contraindicated",
      "reviewStatus": "pending",
      "subject": "Co-Diovan®",
      "object": "Vô niệu",
      "citations": ["…1 citation hợp lệ…"]
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

**Kết luận: Fail.** Cùng một cặp `Co-Diovan® × Vô niệu` xuất hiện đồng thời ở `items` với
mức **chống chỉ định** và ở `unavailable` với lý do **chưa có bản ghi**. Hai kết quả này
mâu thuẫn nhau và UI sẽ hiển thị cả hai.

Root cause đã xác định. Co-Diovan® là thuốc phối hợp, `canonical_ingredients =
['valsartan', 'hydrochlorothiazide']`, còn bản ghi chống chỉ định với “Vô niệu” chỉ gắn với
`hydrochlorothiazide`. Vòng lặp trong
[interaction_check_service.py:347-385](../../backend/src/medsafe/services/interaction_check_service.py#L347-L385)
duyệt theo từng hoạt chất nhưng khi không tìm thấy bản ghi lại ghi `unavailable` theo khoá
`{drug.id}|{disease.id}`:

```python
for drug in drugs:
    for ingredient in drug.canonical_ingredients:
        for disease in diseases:
            ...
            if not rows or not valid:
                unavailable.append(UnavailableResult(key=f"{drug.id}|{disease.id}", ...))
```

`hydrochlorothiazide` sinh ra item, `valsartan` sinh ra `unavailable` — cùng khoá. Mọi thuốc
phối hợp mà chỉ một hoạt chất có bản ghi đều dính lỗi này. Vòng lặp drug–drug ngay phía trên
không có vấn đề vì gom theo `pair_key` của hoạt chất.

---

### TC-07 — Cặp không có bản ghi trả `missing-record`

**Input**

```json
{
  "drugIds": [
    "1acacce8-267a-4e0c-8abb-efcb2c6eac73",
    "e3dceb95-c84b-476a-ab98-96bbf44a0669"
  ],
  "diseaseIds": []
}
```

A.T UREA 20% (urea) + SaVi Acarbose 50 (acarbose) — không có bản ghi tương tác.

**Output thực tế** — `HTTP 200`, 3.25 s

```json
{
  "items": [],
  "unavailable": [
    {
      "key": "acarbose|urea",
      "kind": "drug-drug",
      "subject": "acarbose",
      "object": "urea",
      "reason": "missing-record"
    }
  ],
  "highlightId": null,
  "severityScale": [
    { "severity": "contraindicated", "resultCount": 0 },
    "…tất cả đều 0"
  ]
}
```

**Kết luận: Pass.** Phân biệt đúng `missing-record` (không có bản ghi) với `missing-citation`
ở TC-03 (có bản ghi nhưng không có nguồn). Không suy luận ra tương tác nào.

---

### TC-08 — Chuẩn hoá tên thuốc gõ sai

`GET /api/v1/drugs/search`, output thực tế:

| Query                       | `requiresConfirmation` | `candidates` | Top match                     |
| --------------------------- | ---------------------- | ------------ | ----------------------------- |
| `paracetamol`               | `true`                 | 10           | BFS-PARACETAMOL — paracetamol |
| `paracetamon` (gõ sai)      | `true`                 | 10           | BFS-PARACETAMOL — paracetamol |
| `Lovastatine` (thừa hậu tố) | `true`                 | 2            | LOVAREM — lovastatin          |
| `warfarin` (ngoài danh mục) | `false`                | 0            | —                             |

**Kết luận: Pass.** Fuzzy matching xử lý được lỗi gõ sai ký tự cuối và biến thể hậu tố,
đồng thời `requiresConfirmation: true` buộc người dùng xác nhận trước khi tra cứu. Trường
hợp ngoài danh mục vẫn trả rỗng thay vì ép ra match gần nhất.

Đây mới là 4 mẫu; chỉ số “độ chính xác normalize trên ≥30 case” trong
[report.md](report.md) vẫn chưa đo.

---

### TC-09 — Validation input

**Input** — 1 thuốc, không bệnh nền

```json
{ "drugIds": ["00bd336e-0a0e-42e4-acb6-b827b12a1d2a"], "diseaseIds": [] }
```

**Output thực tế** — `HTTP 422`

```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body"],
      "msg": "Value error, Cần ít nhất hai thuốc, hoặc một thuốc kèm một bệnh/tình trạng đã xác nhận.",
      "input": {
        "drugIds": ["00bd336e-0a0e-42e4-acb6-b827b12a1d2a"],
        "diseaseIds": []
      }
    }
  ]
}
```

Các nhánh validation khác cũng đã chạy và trả `HTTP 422`:

| Trường hợp                                     | Message                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| Thuốc không thuộc danh mục `v2`                | `Một hoặc nhiều thuốc không còn trong danh mục phiên bản hiện hành.` |
| Bệnh nền không thuộc danh mục `v2` đang active | `Một hoặc nhiều bệnh nền không còn trong danh mục được duyệt.`       |

**Kết luận: Pass.** Danh mục bị khoá theo version — 704/1311 thuốc và 274/1545 bệnh ở `v2`;
ID ngoài phạm vi này bị chặn ngay ở service chứ không âm thầm bỏ qua.

---

### TC-10 — Bắt buộc xác thực

**Input** — request hợp lệ nhưng không có header `Authorization`.

**Output thực tế** — `HTTP 401`

```json
{ "code": "invalid_token", "message": "Thiếu access token." }
```

**Kết luận: Pass.** Endpoint tra cứu không cho truy cập ẩn danh.

---

## Traceability — kiểm tra trên 30 lượt tra cứu

Ngoài 10 case trên, đã chạy thêm 30 lượt `POST /api/v1/interactions/check` trên 30 cặp thuốc
phân biệt lấy từ database, để đo tính toàn vẹn trích dẫn ở quy mô lớn hơn.

```text
30 checks → 13 item + 47 note = 60 warning, 17 unavailable
```

| Phép kiểm tra                                             | Kết quả                     |
| --------------------------------------------------------- | --------------------------- |
| Warning có `quote` khác rỗng                              | **60/60**                   |
| Warning có `sourceUrl` bắt đầu bằng `https://`            | **60/60**                   |
| Warning có `reviewStatus` hợp lệ và nằm trong payload     | **60/60**, tất cả `pending` |
| Warning có `chunkId` resolve được                         | 49/60                       |
| **Quote khớp nguyên văn nội dung chunk trong PostgreSQL** | **49/49**                   |
| `historyStatus`                                           | 30/30 `saved`               |

Phép kiểm tra quan trọng nhất là dòng áp chót: với mọi citation có `chunkId`, đã đối chiếu
trực tiếp `quote` vào cột `evidence_chunks.content` — **49/49 khớp nguyên văn, 0 sai lệch**.
Không có cảnh báo nào mang trích dẫn tự chế.

11 warning còn lại có `sourceUrl` hợp lệ nhưng `chunkId: null`: citation resolve được về tờ
HDSD nhưng quote không tìm thấy nguyên văn trong chunk đã index, nên chưa deep-link tới đúng
đoạn được. Không vi phạm nguyên tắc số 1 nhưng làm giảm khả năng truy vết.

Phân bố:

```text
severity          moderate 34 · minor 14 · unknown 4 · major 4 · contraindicated 4
aiSummary.status  generated 52 · fallback 8
unavailable       missing-citation 17
```

### Thời gian end-to-end

Đo trên chính 30 lượt trên, tính từ lúc gửi request tới lúc nhận đủ response, có gọi LLM
sinh `aiSummary`:

| Chỉ số    | Giá trị         |
| --------- | --------------- |
| N         | 30              |
| p50       | **2.24 s**      |
| p95       | **3.67 s**      |
| min / max | 0.83 s / 3.70 s |
| mean      | 2.23 s          |

Đây là baseline đầu tiên, đo trên máy local với database Supabase từ xa. Chưa đặt target;
theo `report.md`, target chỉ được duyệt sau khi có baseline — file này chính là baseline đó.

---

## Phát hiện và việc cần làm tiếp

| # | Phát hiện | Mức | Đề xuất |
| - | --- | --- | --- |
| 1 | TC-06: thuốc phối hợp sinh đồng thời item và `unavailable` cho cùng cặp drug–disease. | Cao | Gom `unavailable` drug–disease theo `{drug.id}|{disease.id}` sau khi duyệt hết hoạt chất; chỉ ghi khi **không hoạt chất nào** cho ra item — giống cách drug–drug gom theo `pair_key`. |
| 2 | 632/4693 bản ghi `national_database` không có nguồn nên không bao giờ hiển thị được; 17/17 `unavailable` ở phép đo 30 lượt đều là `missing-citation`. | Cao | Quyết định sản phẩm: bổ sung nguồn cho nhóm này, hoặc chấp nhận và nêu rõ độ phủ thực tế. Không được nới lỏng điều kiện citation để ép hiển thị. |
| 3 | Bản ghi `digoxin|vinpocetin` (TC-04) có quote khẳng định “**không** gặp tương tác thuốc” nhưng vẫn nằm trong bảng tương tác. | Trung bình | Sửa ở tầng ingestion: lọc câu phủ định trước khi tạo bản ghi. Tầng hiển thị đã xử lý an toàn bằng fallback trung tính. |
| 4 | 11/60 citation thiếu `chunkId`. | Thấp | Rà chuẩn hoá whitespace giữa quote và `evidence_chunks.content` để tăng tỉ lệ deep-link. |
| 5 | 3 chỉ số trong `report.md` vẫn chưa đo: normalize ≥30 case, coverage PDF pilot 50 thuốc, review artifact. | Trung bình | Lên lịch đo, mỗi chỉ số một ticket `VMEC`. |

Mỗi phát hiện cần một ticket Jira sở hữu, root cause, fix hoặc accepted risk, ngày chạy lại
và evidence mới. Khi chạy lại, cập nhật cả file này lẫn [report.md](report.md).

## Cách chạy lại

```bash
make run                                  # backend tại :8000
# đăng nhập lấy access token
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<eval-account>","password":"<password>"}'
# chạy từng case bằng payload trong file này
curl -s -X POST http://localhost:8000/api/v1/interactions/check \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"drugIds":["…"],"diseaseIds":[]}'
# dọn lịch sử sau khi đo
curl -s -X DELETE http://localhost:8000/api/v1/interaction-checks \
  -H "Authorization: Bearer $TOKEN"
```

Các UUID trong file này gắn với dữ liệu danh mục `v2` tại commit `1579ebd`. Nếu ingestion
chạy lại và đổi ID, chọn fixture mới rồi ghi lại UUID cùng ngày đo.
