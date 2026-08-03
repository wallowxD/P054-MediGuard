# Mô hình dữ liệu: Luồng chính kiểm tra tương tác có dẫn nguồn

## Drug

| Field | Ràng buộc |
|---|---|
| `id` | Stable, unique, bắt buộc |
| `brandName` | Giá trị catalog gốc |
| `ingredient` | Hoạt chất/hàm lượng gốc |
| `normalizedIngredient` | Chỉ dùng matching/pair key, không hiển thị như source text |
| `leafletUrl` | URL hoặc null |

## DrugSearchResult / DrugCandidate

`DrugSearchResult` gồm query gốc đã trim, candidate xếp theo deterministic score và
`requiresConfirmation`. Candidate có `drugId`, original brand/ingredient và confidence
0–100. Search không tự thêm vào basket; user chọn stable ID, frontend deduplicate theo ID.

## DrugPair

| Field | Ràng buộc |
|---|---|
| `ingredientA` | Normalized ingredient đứng trước theo lexical order |
| `ingredientB` | Khác A, đứng sau |
| `pairKey` | Stable canonical representation của unordered pair |

Empty/duplicate ingredient không sinh pair.

## Citation

| Field | Ràng buộc |
|---|---|
| `quote` | Bắt buộc, không rỗng, nguyên văn |
| `source` | Tên leaflet/thuốc dễ đọc |
| `sourceUrl` | URL leaflet gốc |
| `page` | Số dương hoặc null |
| `section` | String hoặc null |
| `chunkId` | Stable identity bắt buộc |

Citation invalid khi thiếu quote/source URL/chunk identity hoặc text không khớp source
slice; citation invalid không được hỗ trợ warning.

## EvidenceVersion

| Field | Ràng buộc |
|---|---|
| `id` | Stable, immutable |
| `citationId` | Trỏ tới citation hợp lệ |
| `extractedAt` | Timestamp |
| `extractor` | Adapter/model ID chỉ dùng audit |
| `reviewStatus` | `pending`, `approved`, `rejected` |
| `reviewerId` / `reviewedAt` | Null trước quyết định chuyên môn |
| `rawArtifactKey` | Private object key hoặc null; không trả patient |

Edit extracted content tạo evidence version mới. Authoritative record nằm trong Supabase
PostgreSQL. Qdrant payload chỉ giữ scope field và `evidenceVersionId`; raw OCR nằm trong
private Supabase Storage.

## Interaction

| Field | Ràng buộc |
|---|---|
| `id` | Stable identifier |
| `evidenceVersionId` | Bắt buộc, immutable evidence reference |
| `kind` | `drug-drug` hoặc `drug-food` |
| `subject` / `object` | Original display ingredient hoặc food phrase |
| `pairKey` | Bắt buộc với drug-drug |
| `severity` | Deterministic; không phải request-time model output |
| `reviewStatus` | Snapshot từ evidence version |
| `mechanism` / `consequence` / `management` | Source-backed reference text hoặc null |
| `citations` | Danh sách không rỗng |

`unknown` chỉ hợp lệ cho evidenced record chưa phân loại được.

## UnavailableResult

| Field | Ràng buộc |
|---|---|
| `key` | Canonical pair hoặc stable drug-food request key |
| `kind` | `drug-drug` hoặc `drug-food` |
| `subject` / `object` | Lookup được yêu cầu |
| `reason` | `missing-record`, `missing-citation`, `source-unavailable`, `below-threshold` |

Unavailable chỉ mô tả coverage hiện tại, không khẳng định ngoài đời không có tương tác.

## InteractionCheck

Request gồm 1–20 unique `drugIds` và tối đa 20 food phrase đã trim. Request phải có ít nhất
hai drug ID để kiểm tra thuốc–thuốc, hoặc ít nhất một food phrase để kiểm tra thuốc–thực
phẩm; một drug ID không kèm food là không hợp lệ. Response gồm evidenced `items` và một
unavailable outcome cho mỗi lookup không tạo item. Một lookup lỗi không xóa item độc lập
hợp lệ.

## Chuyển trạng thái

```text
extracted candidate → pending evidence version
pending → approved
pending → rejected
edit content → new pending evidence version
```

Feature 001 chỉ đọc state; mutation endpoint thuộc feature review riêng.
